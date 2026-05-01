// ============================================================
// VENTURE INTAKE MODULE — Problem Statement + Hypothesis Register
// Architecture Module 2 — Phase 1 MVP
// ============================================================
import ContextualWidgetPanel from "@/components/ContextualWidgetPanel";

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Rocket, Target, FlaskConical, Plus, ChevronRight,
  FileText, CheckCircle2, Clock, XCircle, AlertTriangle,
} from "lucide-react";

// ── Types ──
interface ProblemStatement {
  id: string;
  statement: string;
  customerSegment: string;
  context: string;
  evidenceCriteria: string;
  sampleSize: number;
  status: "draft" | "validated" | "invalidated";
  confidenceScore: number | null;
}

interface Hypothesis {
  id: string;
  problemStatementId: string;
  hypothesis: string;
  type: "desirability" | "feasibility" | "viability";
  status: "untested" | "testing" | "validated" | "invalidated";
  evidenceCount: number;
  confidenceScore: number | null;
}

// ── Sample data ──
const SAMPLE_PROBLEMS: ProblemStatement[] = [
  {
    id: "ps-1",
    statement: "Automotive OEMs experience excessive weight in structural components when using traditional materials, leading to higher fuel consumption and emissions.",
    customerSegment: "Automotive Tier 1 Suppliers",
    context: "During lightweighting initiatives for EV platforms",
    evidenceCriteria: "3+ OEM interviews confirming weight as top-3 engineering priority",
    sampleSize: 5,
    status: "validated",
    confidenceScore: 4.2,
  },
  {
    id: "ps-2",
    statement: "Sustainable packaging brands struggle to achieve comparable mechanical performance to petroleum-based alternatives at competitive cost.",
    customerSegment: "FMCG Packaging Buyers",
    context: "When sourcing bio-based packaging for premium products",
    evidenceCriteria: "Survey of 20+ packaging buyers confirming performance-cost trade-off",
    sampleSize: 20,
    status: "draft",
    confidenceScore: null,
  },
];

const SAMPLE_HYPOTHESES: Hypothesis[] = [
  {
    id: "h-1",
    problemStatementId: "ps-1",
    hypothesis: "We believe that natural fibre composites can achieve 30% weight reduction vs. aluminium while maintaining equivalent structural integrity.",
    type: "feasibility",
    status: "testing",
    evidenceCount: 3,
    confidenceScore: 3.8,
  },
  {
    id: "h-2",
    problemStatementId: "ps-1",
    hypothesis: "We believe that Tier 1 suppliers will pay a 15% premium for bio-based structural components if weight savings exceed 25%.",
    type: "viability",
    status: "untested",
    evidenceCount: 0,
    confidenceScore: null,
  },
  {
    id: "h-3",
    problemStatementId: "ps-2",
    hypothesis: "We believe that hemp-flax hybrid composites can match PET packaging rigidity at <10% cost premium.",
    type: "feasibility",
    status: "validated",
    evidenceCount: 7,
    confidenceScore: 4.5,
  },
];

const statusConfig = {
  draft: { color: "#6b7280", bg: "#f3f4f6", icon: Clock, label: "Draft" },
  validated: { color: "#16a34a", bg: "#dcfce7", icon: CheckCircle2, label: "Validated" },
  invalidated: { color: "#dc2626", bg: "#fee2e2", icon: XCircle, label: "Invalidated" },
  untested: { color: "#6b7280", bg: "#f3f4f6", icon: Clock, label: "Untested" },
  testing: { color: "#d97706", bg: "#fef3c7", icon: AlertTriangle, label: "Testing" },
};

const typeColors = {
  desirability: { color: "#7c3aed", bg: "#ede9fe" },
  feasibility: { color: "#0891b2", bg: "#cffafe" },
  viability: { color: "#16a34a", bg: "#dcfce7" },
};

export default function VentureIntake() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<"problems" | "hypotheses">("problems");
  const [showForm, setShowForm] = useState(false);

  // Determine sub-route
  const isHypotheses = location.includes("/hypotheses");
  const isProblem = location.includes("/problem");

  const currentTab = isHypotheses ? "hypotheses" : isProblem ? "problems" : activeTab;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb", background: "linear-gradient(135deg, rgba(81,175,55,0.03) 0%, rgba(58,151,211,0.03) 100%)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Rocket size={18} style={{ color: "#51AF37" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#51AF37" }}>Module 2</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Venture Intake
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Define problem statements and register hypotheses for validation.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            style={{ background: "#51AF37" }}
            onClick={() => { setShowForm(true); toast.info("Form coming in next build iteration"); }}
          >
            <Plus size={14} />
            {currentTab === "problems" ? "New Problem Statement" : "New Hypothesis"}
          </Button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mt-4">
          {[
            { key: "problems", label: "Problem Statements", icon: Target, count: SAMPLE_PROBLEMS.length },
            { key: "hypotheses", label: "Hypothesis Register", icon: FlaskConical, count: SAMPLE_HYPOTHESES.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: currentTab === tab.key ? "white" : "transparent",
                color: currentTab === tab.key ? "#1a2332" : "#6b7280",
                boxShadow: currentTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <tab.icon size={14} />
              {tab.label}
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: currentTab === tab.key ? "rgba(81,175,55,0.1)" : "#f3f4f6", color: currentTab === tab.key ? "#51AF37" : "#6b7280" }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {currentTab === "problems" ? (
          <div className="space-y-4">
            {SAMPLE_PROBLEMS.map(ps => {
              const cfg = statusConfig[ps.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={ps.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs" style={{ borderColor: cfg.color, color: cfg.color, background: cfg.bg }}>
                        <StatusIcon size={10} className="mr-1" />
                        {cfg.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ps.customerSegment}
                      </Badge>
                    </div>
                    {ps.confidenceScore && (
                      <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: "rgba(81,175,55,0.08)", color: "#51AF37" }}>
                        Confidence: {ps.confidenceScore}/5
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-800 font-medium leading-relaxed mb-3">
                    "{ps.statement}"
                  </p>

                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-semibold text-gray-400 block mb-0.5">Context</span>
                      {ps.context}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-400 block mb-0.5">Evidence Criteria</span>
                      {ps.evidenceCriteria}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-400 block mb-0.5">Sample Size</span>
                      n ≥ {ps.sampleSize}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
                    <span className="text-xs text-gray-400">
                      {SAMPLE_HYPOTHESES.filter(h => h.problemStatementId === ps.id).length} hypotheses linked
                    </span>
                    <Button variant="ghost" size="sm" className="text-xs gap-1" style={{ color: "#51AF37" }}>
                      View Hypotheses <ChevronRight size={12} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {SAMPLE_HYPOTHESES.map(h => {
              const cfg = statusConfig[h.status];
              const StatusIcon = cfg.icon;
              const typeCfg = typeColors[h.type];
              return (
                <div key={h.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs" style={{ borderColor: cfg.color, color: cfg.color, background: cfg.bg }}>
                        <StatusIcon size={10} className="mr-1" />
                        {cfg.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: typeCfg.color, color: typeCfg.color, background: typeCfg.bg }}>
                        {h.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        <FileText size={10} className="inline mr-1" />
                        {h.evidenceCount} evidence
                      </span>
                      {h.confidenceScore && (
                        <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: "rgba(81,175,55,0.08)", color: "#51AF37" }}>
                          {h.confidenceScore}/5
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    "{h.hypothesis}"
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Contextual Playbook Guidance */}
        <div className="p-8 pt-0">
          <ContextualWidgetPanel module="Venture Intake" ventureId={null} page="intake" workflowStage="Opportunity" />
        </div>
    </div>
  );
}
