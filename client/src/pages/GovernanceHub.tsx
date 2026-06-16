// ============================================================
// GOVERNANCE MODULE — Stage-Gate Approvals + Audit Trail + Board Reporting
// Architecture Module 15 — Phase 6 MVP
// ============================================================
import ContextualWidgetPanel from "@/components/ContextualWidgetPanel";
import ConstitutionalGovernanceForm from "@/components/ConstitutionalGovernanceForm";
import SuccessionPlanningForm from "@/components/SuccessionPlanningForm";
import StakeholderAlignmentFramework from "@/components/StakeholderAlignmentFramework";
import BoardDecisionAuditTrail from "@/components/BoardDecisionAuditTrail";
import InstitutionalMemorySystem from "@/components/InstitutionalMemorySystem";
import GovernanceComplianceFramework from "@/components/GovernanceComplianceFramework";
import AdvancedStakeholderManagement from "@/components/AdvancedStakeholderManagement";

import { useState } from "react";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Scale, CheckCircle2, Clock, XCircle, AlertTriangle,
  FileText, Users, History, ChevronRight, Network,
} from "lucide-react";
import FedsilkPanel from "@/pages/governance/fedsilk/FedsilkPanel";

// ── Types ──
interface StageGate {
  id: string;
  ventureName: string;
  ventureColor: string;
  stage: number;
  gateName: string;
  status: "pending" | "approved" | "rejected" | "escalated";
  criteria: { label: string; met: boolean }[];
  approver: string;
  submittedAt: string;
  decidedAt?: string;
}

interface AuditEntry {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityName: string;
  timestamp: string;
}

// ── Sample Data ──
const STAGE_GATES: StageGate[] = [
  {
    id: "sg-1",
    ventureName: "EcoBlend Materials",
    ventureColor: "#56A837",
    stage: 3,
    gateName: "Stage 3 → Stage 4: Scale-Up Approval",
    status: "pending",
    criteria: [
      { label: "TRL ≥ 7", met: true },
      { label: "BRL ≥ 6.0", met: true },
      { label: "No critical risks", met: false },
      { label: "Financial model validated", met: true },
      { label: "IP position secured", met: true },
    ],
    approver: "Brian (CTO)",
    submittedAt: "2026-04-28",
  },
  {
    id: "sg-2",
    ventureName: "BioStruct",
    ventureColor: "#8b5cf6",
    stage: 2,
    gateName: "Stage 2 → Stage 3: Prototype Approval",
    status: "approved",
    criteria: [
      { label: "TRL ≥ 4", met: true },
      { label: "Problem validated", met: true },
      { label: "Hypothesis evidence ≥ 3", met: true },
      { label: "Budget allocated", met: true },
    ],
    approver: "Brian (CTO)",
    submittedAt: "2026-04-15",
    decidedAt: "2026-04-17",
  },
  {
    id: "sg-3",
    ventureName: "CircularTech",
    ventureColor: "#059669",
    stage: 1,
    gateName: "Stage 1 → Stage 2: Discovery Approval",
    status: "rejected",
    criteria: [
      { label: "Problem statement validated", met: true },
      { label: "Customer segment defined", met: true },
      { label: "Market size > £100M", met: false },
      { label: "Strategic fit confirmed", met: false },
    ],
    approver: "Brian (CTO)",
    submittedAt: "2026-04-10",
    decidedAt: "2026-04-12",
  },
];

const AUDIT_LOG: AuditEntry[] = [
  { id: "a1", userName: "Brian", action: "approve", entityType: "Stage Gate", entityName: "BioStruct Stage 2→3", timestamp: "2026-04-17 14:32" },
  { id: "a2", userName: "Brian", action: "reject", entityType: "Stage Gate", entityName: "CircularTech Stage 1→2", timestamp: "2026-04-12 09:15" },
  { id: "a3", userName: "Dr. Sarah Chen", action: "create", entityType: "R&D Project", entityName: "Hemp-Flax Panel v3", timestamp: "2026-04-10 11:20" },
  { id: "a4", userName: "Brian", action: "update", entityType: "Risk", entityName: "OEM adoption timeline", timestamp: "2026-04-09 16:45" },
  { id: "a5", userName: "IP Counsel", action: "create", entityType: "IP Asset", entityName: "Patent GB2024/001234", timestamp: "2026-04-05 10:00" },
  { id: "a6", userName: "Brian", action: "export", entityType: "Investment Pack", entityName: "EcoBlend Seed Round", timestamp: "2026-04-01 15:30" },
];

const statusConfig = {
  pending: { color: "#d97706", bg: "#fef3c7", icon: Clock, label: "Pending" },
  approved: { color: "#16a34a", bg: "#dcfce7", icon: CheckCircle2, label: "Approved" },
  rejected: { color: "#dc2626", bg: "#fee2e2", icon: XCircle, label: "Rejected" },
  escalated: { color: "#7c3aed", bg: "#ede9fe", icon: AlertTriangle, label: "Escalated" },
};

const actionColors: Record<string, string> = {
  approve: "#16a34a",
  reject: "#dc2626",
  create: "#3B85BA",
  update: "#d97706",
  export: "#7c3aed",
  delete: "#dc2626",
};

export default function GovernanceHub() {
  const [activeTab, setActiveTab] = useState<"gates" | "audit" | "board" | "constitutional" | "succession" | "stakeholders" | "decisions" | "memory" | "compliance" | "advanced-stakeholders" | "fedsilk">("gates");

  const pendingCount = STAGE_GATES.filter(g => g.status === "pending").length;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale size={18} style={{ color: "#7c3aed" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7c3aed" }}>Module 15</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Governance</h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Stage-gate approvals, audit trail, and board reporting.
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge className="text-xs px-3 py-1" style={{ background: "#fef3c7", color: "#d97706", border: "none" }}>
              {pendingCount} pending approval{pendingCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto pb-2">
          {[
            { key: "gates", label: "Stage Gates", icon: CheckCircle2 },
            { key: "audit", label: "Audit Trail", icon: History },
            { key: "board", label: "Board Reports", icon: FileText },
            { key: "constitutional", label: "Constitutional Governance", icon: Scale },
            { key: "succession", label: "Succession Planning", icon: Users },
            { key: "stakeholders", label: "Stakeholder Alignment", icon: Users },
            { key: "decisions", label: "Board Decisions", icon: Scale },
            { key: "memory", label: "Institutional Memory", icon: History },
            { key: "compliance", label: "Compliance Framework", icon: CheckCircle2 },
            { key: "advanced-stakeholders", label: "Stakeholder Management", icon: Users },
            { key: "fedsilk", label: "FEDSILK Attribution", icon: Network },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: activeTab === tab.key ? "white" : "transparent",
                color: activeTab === tab.key ? "#1a2332" : "#6b7280",
                boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Stage Gates */}
        {activeTab === "gates" && (
          <div className="space-y-4">
            {STAGE_GATES.map(gate => {
              const cfg = statusConfig[gate.status];
              const StatusIcon = cfg.icon;
              const criteriaMet = gate.criteria.filter(c => c.met).length;
              return (
                <div key={gate.id} className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${gate.ventureColor}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold" style={{ color: gate.ventureColor }}>{gate.ventureName}</span>
                        <Badge className="text-[10px]" style={{ background: cfg.bg, color: cfg.color, border: "none" }}>
                          <StatusIcon size={8} className="mr-0.5" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{gate.gateName}</h3>
                    </div>
                    {gate.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs gap-1" style={{ borderColor: "#dc2626", color: "#dc2626" }} onClick={() => toast.info("Reject action — coming in next build")}>
                          <XCircle size={12} /> Reject
                        </Button>
                        <Button size="sm" className="text-xs gap-1" style={{ background: "#16a34a" }} onClick={() => toast.info("Approve action — coming in next build")}>
                          <CheckCircle2 size={12} /> Approve
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Criteria checklist */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {gate.criteria.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {c.met ? (
                          <CheckCircle2 size={12} style={{ color: "#16a34a" }} />
                        ) : (
                          <XCircle size={12} style={{ color: "#dc2626" }} />
                        )}
                        <span className={c.met ? "text-gray-700" : "text-red-700 font-medium"}>{c.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
                    <span>{criteriaMet}/{gate.criteria.length} criteria met</span>
                    <span>Approver: {gate.approver}</span>
                    <span>Submitted: {gate.submittedAt}</span>
                    {gate.decidedAt && <span>Decided: {gate.decidedAt}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Audit Trail */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
              <span className="text-xs font-semibold text-gray-500">Recent Activity</span>
            </div>
            {AUDIT_LOG.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: "#f3f4f6" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: actionColors[entry.action] || "#6b7280" }} />
                <span className="text-xs text-gray-500 w-28 font-mono">{entry.timestamp}</span>
                <span className="text-xs text-gray-700">
                  <strong>{entry.userName}</strong>{" "}
                  <span style={{ color: actionColors[entry.action] || "#6b7280" }}>{entry.action}</span>{" "}
                  {entry.entityType}: <em>{entry.entityName}</em>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Board Reports */}
        {activeTab === "board" && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-gray-400" />
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Board Reporting
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Auto-generated board reports summarising portfolio status, readiness scores, risk position, and stage-gate decisions.
            </p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Board report generation — coming in next build")}>
              <FileText size={14} /> Generate Q2 2026 Board Report
            </Button>
          </div>
        )}

        {/* Constitutional Governance (Phase 5B) */}
        {activeTab === "constitutional" && (
          <div>
            <ConstitutionalGovernanceForm />
          </div>
        )}

        {/* Succession Planning (Phase 5C) */}
        {activeTab === "succession" && (
          <div>
            <SuccessionPlanningForm />
          </div>
        )}

        {/* Stakeholder Alignment Framework (Phase 5D) */}
        {activeTab === "stakeholders" && (
          <div>
            <StakeholderAlignmentFramework />
          </div>
        )}

        {/* Board Decision Audit Trail (Phase 5 Medium-Term) */}
        {activeTab === "decisions" && (
          <div>
            <BoardDecisionAuditTrail />
          </div>
        )}
        {/* Institutional Memory System (Phase 5 Long-Term) */}
        {activeTab === "memory" && (
          <div>
            <InstitutionalMemorySystem />
          </div>
        )}
        {/* Governance Compliance Framework (Phase 5 Long-Term) */}
        {activeTab === "compliance" && (
          <div>
            <GovernanceComplianceFramework />
          </div>
        )}
        {/* Advanced Stakeholder Management (Phase 5 Long-Term) */}
        {activeTab === "advanced-stakeholders" && (
          <div>
            <AdvancedStakeholderManagement />
          </div>
        )}
        {/* FEDSILK Attribution Engine */}
        {activeTab === "fedsilk" && (
          <FedsilkPanel />
        )}
      </div>

        {/* Contextual Playbook Guidance */}
        <div className="p-8 pt-0">
          <ContextualWidgetPanel module="Governance" ventureId={null} page="governance" workflowStage="ALL" />
        </div>
    </div>
  );
}
