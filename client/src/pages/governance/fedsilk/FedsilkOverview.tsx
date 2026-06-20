import { trpc } from "@/lib/trpc";
import {
  CheckCircle2, Clock, AlertTriangle, XCircle, FileText,
  Shield, Scale, Network, ArrowRight, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STEP_LABELS: Record<string, string> = {
  F: "Founder Intent", E: "Equity & ESOP", D: "Decision Rights",
  S: "Stewardship", I: "IP Controls", L: "Legal Contracts", K: "Knowledge & Audit",
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  not_started:  { label: "Not Started",  color: "#6b7280", bg: "#f3f4f6",   icon: Clock },
  in_progress:  { label: "In Progress",  color: "#d97706", bg: "#fef3c7",   icon: Clock },
  under_review: { label: "Under Review", color: "#3b82f6", bg: "#dbeafe",   icon: Shield },
  approved:     { label: "Approved",     color: "#16a34a", bg: "#dcfce7",   icon: CheckCircle2 },
  blocked:      { label: "Blocked",      color: "#dc2626", bg: "#fee2e2",   icon: XCircle },
};

const SEVERITY_CFG: Record<string, { color: string; bg: string }> = {
  critical: { color: "#dc2626", bg: "#fee2e2" },
  high:     { color: "#d97706", bg: "#fef3c7" },
  medium:   { color: "#3b82f6", bg: "#dbeafe" },
  low:      { color: "#16a34a", bg: "#dcfce7" },
};

export default function FedsilkOverview() {
  const summaryQ  = trpc.fedsilkGovernance.getSummary.useQuery();
  const stepsQ    = trpc.fedsilkGovernance.getSteps.useQuery({});
  const riskQ     = trpc.fedsilkGovernance.getRisks.useQuery({});

  const summary = summaryQ.data;
  const steps   = stepsQ.data ?? [];
  const risks   = (riskQ.data ?? []).filter(r => r.status === "open" && (r.severity === "critical" || r.severity === "high"));

  const score = summary?.completionScore ?? 0;
  const scoreColor = score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";

  return (
    <div className="space-y-6">

      {/* What is FEDSILK — context banner */}
      <div className="rounded-xl border p-5" style={{ background: "linear-gradient(135deg,#0B2545 0%,#163662 100%)", borderColor: "transparent" }}>
        <div className="flex items-start gap-4">
          <Network size={28} style={{ color: "#B8862F", flexShrink: 0, marginTop: 2 }} />
          <div>
            <h2 className="text-base font-bold text-white mb-1" style={{ fontFamily: "'Prompt',sans-serif" }}>
              FEDSILK Governance Framework
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.6" }}>
              FEDSILK is a seven-step board-level governance workflow that protects founder intent, 
              IP integrity, equity fairness, decision authority, mission lock, legal compliance, and 
              knowledge attribution across all entity layers — holding company, studio, SPV, charity, 
              and venture. Each step (F → K) must be evidenced, approved, and linked to the correct 
              contract before the venture is considered governance-ready for investment or scaling.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(STEP_LABELS).map(([key, label]) => (
                <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }}>
                  <span style={{ color: "#B8862F", fontWeight: 700 }}>{key}</span> — {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Completion Score",      value: score + "%",            sub: "steps · evidence · contracts", color: scoreColor },
          { label: "Steps Approved",        value: `${summary?.stepsApproved ?? 0} / ${summary?.totalSteps ?? 7}`, sub: "of 7 FEDSILK steps", color: "#16a34a" },
          { label: "Evidence Complete",     value: (summary?.evidencePct ?? 0) + "%",   sub: "required evidence items", color: summary?.evidencePct ?? 0 >= 80 ? "#16a34a" : "#d97706" },
          { label: "Open High Risks",       value: String(summary?.openHighRisks ?? 0),  sub: "critical + high severity", color: summary?.openHighRisks ?? 0 > 0 ? "#dc2626" : "#16a34a" },
          { label: "Missing Key Contracts", value: String(summary?.missingContracts ?? 0), sub: "immediate / high priority", color: summary?.missingContracts ?? 0 > 0 ? "#d97706" : "#16a34a" },
          { label: "Pending Approvals",     value: String(summary?.pendingApprovals ?? 0), sub: "under review", color: "#3b82f6" },
          { label: "Contract Coverage",     value: (summary?.contractCoverage ?? 0) + "%", sub: "contracts initiated", color: "#7c3aed" },
          { label: "Governance Modules",    value: "7",                      sub: "linked modules", color: "#0B2545" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs text-gray-500 mb-1">{k.label}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: k.color, fontFamily: "'Prompt',sans-serif" }}>{k.value}</div>
            <div className="text-[10px] text-gray-400">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Step status summary */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2" style={{ borderColor: "#f3f4f6" }}>
          <Scale size={14} style={{ color: "#0B2545" }} />
          <span className="text-sm font-bold text-gray-800">Step-by-Step Status</span>
        </div>
        <div className="divide-y" style={{ divideColor: "#f3f4f6" }}>
          {steps.map(step => {
            const cfg = STATUS_CFG[step.status ?? "not_started"] ?? STATUS_CFG["not_started"];
            const StatusIcon = cfg.icon;
            return (
              <div key={step.stepKey} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "#0B2545", color: "#B8862F" }}>{step.stepKey}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">{step.stepName}</div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{step.governanceQuestion}</div>
                </div>
                <Badge className="text-[10px] flex-shrink-0 flex items-center gap-1"
                  style={{ background: cfg.bg, color: cfg.color, border: "none" }}>
                  <StatusIcon size={9} />
                  {cfg.label}
                </Badge>
                {step.owner && (
                  <span className="text-[11px] text-gray-400 flex-shrink-0 hidden sm:block">{step.owner}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Open critical/high risks */}
      {risks.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "#f3f4f6", background: "#fff8f8" }}>
            <AlertTriangle size={14} style={{ color: "#dc2626" }} />
            <span className="text-sm font-bold" style={{ color: "#dc2626" }}>Open High-Priority Governance Risks</span>
            <Badge className="text-[10px] ml-auto" style={{ background: "#fee2e2", color: "#dc2626", border: "none" }}>{risks.length} open</Badge>
          </div>
          <div className="divide-y" style={{ divideColor: "#f3f4f6" }}>
            {risks.slice(0, 6).map(risk => {
              const sev = SEVERITY_CFG[risk.severity ?? "medium"];
              return (
                <div key={risk.id} className="flex items-start gap-3 px-5 py-3">
                  <Badge className="text-[10px] mt-0.5 flex-shrink-0"
                    style={{ background: sev.bg, color: sev.color, border: "none" }}>
                    {(risk.severity ?? "").toUpperCase()}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800">{risk.riskName}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{risk.category} · Step {risk.stepKey} — {STEP_LABELS[risk.stepKey ?? ""]}</div>
                  </div>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "#0B2545", color: "#B8862F", fontSize: 11 }}>{risk.stepKey}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Linked modules */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2 mb-4">
          <ArrowRight size={14} style={{ color: "#0B2545" }} />
          <h3 className="text-sm font-bold text-gray-800">FEDSILK Connects To</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Legal Repository",   href: "/governance/legal",   note: "Contract records & document status" },
            { label: "IP Register",        href: "/governance/ip",      note: "IP ownership, assignment & licensing" },
            { label: "Audit Trail",        href: "/governance/audit",   note: "Governance decisions & evidence logs" },
            { label: "Board Reporting",    href: "/governance/board",   note: "Items requiring board visibility" },
            { label: "Stage-Gate Approvals", href: "/governance/gates", note: "Approval checkpoints" },
            { label: "Attribution Engine", href: "#engine",             note: "Federated learning & M1–M5 mechanisms" },
          ].map(m => (
            <a key={m.label} href={m.href}
              className="flex items-start gap-2 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              style={{ border: "1px solid #e5e7eb" }}>
              <ChevronRight size={12} style={{ color: "#B8862F", marginTop: 2, flexShrink: 0 }} />
              <div>
                <div className="text-xs font-semibold text-gray-800">{m.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{m.note}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
