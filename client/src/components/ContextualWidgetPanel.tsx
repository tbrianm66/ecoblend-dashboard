/**
 * ContextualWidgetPanel — Host component for Phase 3B specialised widget cards.
 *
 * Renders the appropriate specialised card(s) based on the current module,
 * alongside the existing ContextualPlaybookPanel recommendations.
 *
 * Module → Widget mapping:
 *   Venture Intake              → MissingEvidenceCard
 *   Discovery & Market          → MissingEvidenceCard
 *   Research & Technical Val.   → RDStageGuidanceCard + MissingEvidenceCard
 *   Readiness Scoring           → ScoreImprovementCard + MissingEvidenceCard
 *   Risk Intelligence           → RiskMitigationCard
 *   Investment Readiness        → InvestmentPackReadinessCard
 *   Governance                  → StageGateApprovalCard
 *   Execution Planning          → ScoreImprovementCard
 *   (default)                   → MissingEvidenceCard
 */
import React, { useState } from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ContextualPlaybookPanel from "./ContextualPlaybookPanel";
import MissingEvidenceCard from "./widgets/MissingEvidenceCard";
import ScoreImprovementCard from "./widgets/ScoreImprovementCard";
import RDStageGuidanceCard from "./widgets/RDStageGuidanceCard";
import InvestmentPackReadinessCard from "./widgets/InvestmentPackReadinessCard";
import RiskMitigationCard from "./widgets/RiskMitigationCard";
import StageGateApprovalCard from "./widgets/StageGateApprovalCard";

interface ContextualWidgetPanelProps {
  module: string;
  ventureId: string | null;
  page?: string;
  workflowStage?: string;
  /** If true, also renders the ContextualPlaybookPanel below the specialised card */
  showPlaybookPanel?: boolean;
}

type WidgetType =
  | "missing-evidence"
  | "score-improvement"
  | "rd-stage-guidance"
  | "investment-pack-readiness"
  | "risk-mitigation"
  | "stage-gate-approval";

interface WidgetConfig {
  id: string;
  type: WidgetType;
  label: string;
  color: string;
}

/** Determine which widgets to show for a given module */
function getWidgetsForModule(module: string): WidgetConfig[] {
  switch (module) {
    case "Venture Intake":
      return [{ id: "me", type: "missing-evidence", label: "Evidence Gaps", color: "#F49C13" }];

    case "Discovery & Market":
      return [{ id: "me", type: "missing-evidence", label: "Evidence Gaps", color: "#F49C13" }];

    case "Research & Technical Validation":
      return [
        { id: "rd", type: "rd-stage-guidance", label: "R&D Stage", color: "#3A97D3" },
        { id: "me", type: "missing-evidence", label: "Evidence Gaps", color: "#F49C13" },
      ];

    case "Readiness Scoring":
      return [
        { id: "si", type: "score-improvement", label: "Score Blockers", color: "#51AF37" },
        { id: "me", type: "missing-evidence", label: "Evidence Gaps", color: "#F49C13" },
      ];

    case "Risk Intelligence":
      return [{ id: "rm", type: "risk-mitigation", label: "Risk Mitigation", color: "#ef4444" }];

    case "Investment Readiness":
      return [{ id: "ip", type: "investment-pack-readiness", label: "Pack Readiness", color: "#8b5cf6" }];

    case "Governance":
      return [{ id: "sg", type: "stage-gate-approval", label: "Stage Gate", color: "#3A97D3" }];

    case "Execution Planning":
      return [{ id: "si", type: "score-improvement", label: "Score Blockers", color: "#51AF37" }];

    default:
      return [{ id: "me", type: "missing-evidence", label: "Evidence Gaps", color: "#F49C13" }];
  }
}

function WidgetCard({
  config,
  ventureId,
  module,
}: {
  config: WidgetConfig;
  ventureId: string | null;
  module: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Card header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: config.color }}
          />
          <span
            className="text-sm font-semibold text-gray-800"
            style={{ fontFamily: "'Prompt', sans-serif" }}
          >
            {config.label}
          </span>
        </div>
        {collapsed ? (
          <ChevronDown size={14} className="text-gray-400" />
        ) : (
          <ChevronUp size={14} className="text-gray-400" />
        )}
      </button>

      {/* Card body */}
      {!collapsed && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          {config.type === "missing-evidence" && (
            <MissingEvidenceCard ventureId={ventureId} module={module} />
          )}
          {config.type === "score-improvement" && (
            <ScoreImprovementCard ventureId={ventureId} />
          )}
          {config.type === "rd-stage-guidance" && (
            <RDStageGuidanceCard ventureId={ventureId} />
          )}
          {config.type === "investment-pack-readiness" && (
            <InvestmentPackReadinessCard ventureId={ventureId} />
          )}
          {config.type === "risk-mitigation" && (
            <RiskMitigationCard ventureId={ventureId} module={module} />
          )}
          {config.type === "stage-gate-approval" && (
            <StageGateApprovalCard ventureId={ventureId} />
          )}
        </div>
      )}
    </div>
  );
}

export default function ContextualWidgetPanel({
  module,
  ventureId,
  page,
  workflowStage,
  showPlaybookPanel = true,
}: ContextualWidgetPanelProps) {
  const widgets = getWidgetsForModule(module);

  return (
    <div className="flex flex-col gap-3">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1">
        <Layers size={13} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Contextual Guidance
        </span>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 border-gray-200 text-gray-400 ml-auto"
        >
          {module}
        </Badge>
      </div>

      {/* Specialised widget cards */}
      {widgets.map((cfg) => (
        <WidgetCard key={cfg.id} config={cfg} ventureId={ventureId} module={module} />
      ))}

      {/* Contextual playbook recommendations panel */}
      {showPlaybookPanel && (
        <ContextualPlaybookPanel
          module={module}
          ventureId={ventureId}
          page={page}
          workflowStage={workflowStage}
        />
      )}
    </div>
  );
}
