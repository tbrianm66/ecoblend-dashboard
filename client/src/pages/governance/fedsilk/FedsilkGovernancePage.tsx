import { useState, useEffect } from "react";
import { Network, LayoutDashboard, GitBranch, FileText, AlertTriangle, Scale, Cpu } from "lucide-react";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

import FedsilkOverview        from "./FedsilkOverview";
import FedsilkStepWorkflow    from "./FedsilkStepWorkflow";
import FedsilkEvidence        from "./FedsilkEvidence";
import FedsilkContractTriggers from "./FedsilkContractTriggers";
import FedsilkRiskFlags        from "./FedsilkRiskFlags";
import FedsilkPanel            from "./FedsilkPanel";

type TabKey = "overview" | "steps" | "evidence" | "contracts" | "risks" | "engine";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview",   label: "FEDSILK Overview",    icon: LayoutDashboard },
  { key: "steps",      label: "Step Workflow",        icon: GitBranch },
  { key: "evidence",   label: "Required Evidence",    icon: FileText },
  { key: "contracts",  label: "Contract Triggers",    icon: Scale },
  { key: "risks",      label: "Risk Flags",           icon: AlertTriangle },
  { key: "engine",     label: "Attribution Engine",   icon: Cpu },
];

export default function FedsilkGovernancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const summaryQ = trpc.fedsilkGovernance.getSummary.useQuery();
  const summary  = summaryQ.data;

  const score = summary?.completionScore ?? 0;
  const openRisks = summary?.openHighRisks ?? 0;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── Page Header ── */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Network size={18} style={{ color: "#7c3aed" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7c3aed" }}>
                Module 15 · Governance
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt',sans-serif" }}>
                FEDSILK Attribution
              </h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Seven-step board-level governance workflow · Founder → Equity → Decision Rights → Stewardship → IP → Legal → Knowledge
            </p>
          </div>

          {/* Headline KPIs */}
          <div className="flex gap-3 flex-wrap">
            <div className="rounded-xl border px-4 py-2.5 text-center" style={{ borderColor: "#e5e7eb", minWidth: 80 }}>
              <div className="text-[10px] text-gray-400 mb-0.5">Completion</div>
              <div className="text-lg font-bold" style={{
                color: score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626",
                fontFamily: "'Prompt',sans-serif",
              }}>{score}%</div>
            </div>
            <div className="rounded-xl border px-4 py-2.5 text-center" style={{ borderColor: "#e5e7eb", minWidth: 80 }}>
              <div className="text-[10px] text-gray-400 mb-0.5">Steps Approved</div>
              <div className="text-lg font-bold text-gray-800" style={{ fontFamily: "'Prompt',sans-serif" }}>
                {summary?.stepsApproved ?? 0} / {summary?.totalSteps ?? 7}
              </div>
            </div>
            {openRisks > 0 && (
              <div className="rounded-xl border px-4 py-2.5 text-center" style={{ borderColor: "#fecdd3", background: "#fff8f8", minWidth: 80 }}>
                <div className="text-[10px] mb-0.5" style={{ color: "#dc2626" }}>Open Risks</div>
                <div className="text-lg font-bold" style={{ color: "#dc2626", fontFamily: "'Prompt',sans-serif" }}>
                  {openRisks}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-1 mt-5 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: isActive ? "white" : "transparent",
                  color: isActive ? "#1a2332" : "#6b7280",
                  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}>
                <Icon size={14} />
                {tab.label}
                {tab.key === "risks" && openRisks > 0 && (
                  <Badge className="text-[9px] px-1.5 py-0 ml-0.5"
                    style={{ background: "#fee2e2", color: "#dc2626", border: "none" }}>
                    {openRisks}
                  </Badge>
                )}
                {tab.key === "contracts" && (summary?.missingContracts ?? 0) > 0 && (
                  <Badge className="text-[9px] px-1.5 py-0 ml-0.5"
                    style={{ background: "#fef3c7", color: "#d97706", border: "none" }}>
                    {summary!.missingContracts}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="p-8">
        {activeTab === "overview"   && <FedsilkOverview />}
        {activeTab === "steps"      && <FedsilkStepWorkflow />}
        {activeTab === "evidence"   && <FedsilkEvidence />}
        {activeTab === "contracts"  && <FedsilkContractTriggers />}
        {activeTab === "risks"      && <FedsilkRiskFlags />}
        {activeTab === "engine"     && (
          <div className="space-y-4">
            <div className="rounded-xl border p-4 text-xs leading-relaxed"
              style={{ background: "#f0f4ff", borderColor: "#dbeafe", color: "#1e3a5f" }}>
              <strong>Attribution Engine (Simulation mode)</strong> — The panel below demonstrates FEDSILK's five
              technical mechanisms (M1 Data Locality · M2 Gradient Gate · M3 Contribution Scoring · M4 Audit Ledger ·
              M5 Verifiable Unlearning). This is a browser-only simulation. Data does not persist between sessions.
              To integrate with a real Flower gRPC backend or Hyperledger Fabric ledger, see the{" "}
              <code className="font-mono">FedEngine.ts</code> swap seams documented in the README.
            </div>
            <FedsilkPanel />
          </div>
        )}
      </div>
    </div>
  );
}
