// ============================================================
// EXECUTION PLANNING MODULE — Roadmap + Milestones + Budget
// Architecture Module 12 — Phase 5 MVP
// ============================================================
import ContextualWidgetPanel from "@/components/ContextualWidgetPanel";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Map, Target, Calendar, DollarSign, Users,
  CheckCircle2, Clock, AlertTriangle, Pause,
} from "lucide-react";

// ── Types ──
interface RoadmapPhase {
  id: string;
  phaseName: string;
  order: number;
  startDate: string;
  endDate: string;
  status: "not_started" | "in_progress" | "complete" | "blocked";
  deliverables: string[];
  dependencies: string[];
  progressPct: number;
}

interface BudgetItem {
  category: string;
  planned: number;
  actual: number;
  period: string;
}

// ── Config ──
const phaseStatusConfig = {
  not_started: { color: "#6b7280", bg: "#f3f4f6", icon: Clock, label: "Not Started" },
  in_progress: { color: "#3B85BA", bg: "#dbeafe", icon: Target, label: "In Progress" },
  complete: { color: "#16a34a", bg: "#dcfce7", icon: CheckCircle2, label: "Complete" },
  blocked: { color: "#dc2626", bg: "#fee2e2", icon: Pause, label: "Blocked" },
};

// ── Sample Data ──
const ROADMAP: RoadmapPhase[] = [
  { id: "p1", phaseName: "Discovery & Validation", order: 1, startDate: "2025-09-01", endDate: "2025-12-31", status: "complete", deliverables: ["Problem validated", "20 customer interviews", "Market size confirmed"], dependencies: [], progressPct: 100 },
  { id: "p2", phaseName: "Prototype Development", order: 2, startDate: "2026-01-01", endDate: "2026-04-30", status: "in_progress", deliverables: ["v3 panel prototype", "OEM crash test pass", "IP filing"], dependencies: ["Discovery complete"], progressPct: 72 },
  { id: "p3", phaseName: "Pilot Production", order: 3, startDate: "2026-05-01", endDate: "2026-08-31", status: "not_started", deliverables: ["Pilot line operational", "50 panels produced", "Quality certification"], dependencies: ["Prototype approved"], progressPct: 0 },
  { id: "p4", phaseName: "Commercial Launch", order: 4, startDate: "2026-09-01", endDate: "2026-12-31", status: "not_started", deliverables: ["First commercial order", "£250k revenue", "3 active customers"], dependencies: ["Pilot validated", "Investment secured"], progressPct: 0 },
  { id: "p5", phaseName: "Scale-Up", order: 5, startDate: "2027-01-01", endDate: "2027-06-30", status: "not_started", deliverables: ["Full production line", "£1M ARR", "Series A preparation"], dependencies: ["Commercial traction proven"], progressPct: 0 },
];

const BUDGET: BudgetItem[] = [
  { category: "R&D & Prototyping", planned: 120000, actual: 85000, period: "FY2026" },
  { category: "Production Tooling", planned: 80000, actual: 12000, period: "FY2026" },
  { category: "Team & Salaries", planned: 95000, actual: 72000, period: "FY2026" },
  { category: "IP & Legal", planned: 25000, actual: 18500, period: "FY2026" },
  { category: "Marketing & Sales", planned: 30000, actual: 8000, period: "FY2026" },
  { category: "Working Capital", planned: 50000, actual: 22000, period: "FY2026" },
];

export default function ExecutionPlanning() {
  const [activeTab, setActiveTab] = useState<"roadmap" | "budget" | "hiring">("roadmap");

  const totalPlanned = BUDGET.reduce((s, b) => s + b.planned, 0);
  const totalActual = BUDGET.reduce((s, b) => s + b.actual, 0);
  const completedPhases = ROADMAP.filter(p => p.status === "complete").length;
  const overallProgress = Math.round(ROADMAP.reduce((s, p) => s + p.progressPct, 0) / ROADMAP.length);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Map size={18} style={{ color: "#059669" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#059669" }}>Module 12</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Execution Planning
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Roadmap phases, milestone tracking, budget planning, and hiring.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-gray-400">Overall Progress</span>
              <p className="text-lg font-bold" style={{ color: "#059669", fontFamily: "'Prompt', sans-serif" }}>{overallProgress}%</p>
            </div>
            <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${overallProgress}%`, background: "#059669" }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {[
            { key: "roadmap", label: "Roadmap", icon: Calendar },
            { key: "budget", label: "Budget", icon: DollarSign },
            { key: "hiring", label: "Hiring Plan", icon: Users },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
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
        {/* Roadmap */}
        {activeTab === "roadmap" && (
          <div className="space-y-4">
            {ROADMAP.map((phase, idx) => {
              const cfg = phaseStatusConfig[phase.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={phase.id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${cfg.color}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: cfg.color }}>
                        {phase.order}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{phase.phaseName}</h3>
                        <span className="text-[10px] text-gray-400">{phase.startDate} → {phase.endDate}</span>
                      </div>
                    </div>
                    <Badge className="text-[10px]" style={{ background: cfg.bg, color: cfg.color, border: "none" }}>
                      <StatusIcon size={8} className="mr-0.5" />
                      {cfg.label}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${phase.progressPct}%`, background: cfg.color }} />
                    </div>
                    <span className="text-xs font-mono text-gray-500">{phase.progressPct}%</span>
                  </div>

                  {/* Deliverables */}
                  <div className="flex flex-wrap gap-2">
                    {phase.deliverables.map((d, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border" style={{ borderColor: "#f0f0f0" }}>
                        {d}
                      </span>
                    ))}
                  </div>

                  {phase.dependencies.length > 0 && (
                    <div className="mt-2 text-[10px] text-gray-400">
                      Dependencies: {phase.dependencies.join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Budget */}
        {activeTab === "budget" && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                <span className="text-xs font-semibold text-gray-400 uppercase">Total Budget</span>
                <p className="text-2xl font-bold" style={{ fontFamily: "'Prompt', sans-serif" }}>£{(totalPlanned / 1000).toFixed(0)}k</p>
              </div>
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                <span className="text-xs font-semibold text-gray-400 uppercase">Spent to Date</span>
                <p className="text-2xl font-bold" style={{ color: "#3B85BA", fontFamily: "'Prompt', sans-serif" }}>£{(totalActual / 1000).toFixed(0)}k</p>
              </div>
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                <span className="text-xs font-semibold text-gray-400 uppercase">Remaining</span>
                <p className="text-2xl font-bold" style={{ color: "#059669", fontFamily: "'Prompt', sans-serif" }}>£{((totalPlanned - totalActual) / 1000).toFixed(0)}k</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Category</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Planned</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Actual</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Variance</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Utilisation</th>
                  </tr>
                </thead>
                <tbody>
                  {BUDGET.map(item => {
                    const variance = item.actual - item.planned;
                    const utilPct = (item.actual / item.planned) * 100;
                    return (
                      <tr key={item.category} className="border-b" style={{ borderColor: "#f3f4f6" }}>
                        <td className="px-4 py-3 text-xs font-medium text-gray-700">{item.category}</td>
                        <td className="px-4 py-3 text-xs text-right font-mono">£{item.planned.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-right font-mono">£{item.actual.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-right font-mono" style={{ color: variance > 0 ? "#dc2626" : "#16a34a" }}>
                          {variance > 0 ? "+" : ""}£{variance.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, utilPct)}%`, background: utilPct > 90 ? "#dc2626" : "#3B85BA" }} />
                            </div>
                            <span className="text-[10px] text-gray-400">{utilPct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hiring Plan */}
        {activeTab === "hiring" && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Hiring Plan
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Team composition planning linked to execution phases and budget allocation.
            </p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Hiring plan builder — coming in next build")}>
              <Users size={14} /> Build Hiring Plan
            </Button>
          </div>
        )}
      </div>

        {/* Contextual Playbook Guidance */}
        <div className="p-8 pt-0">
          <ContextualWidgetPanel module="Execution Planning" ventureId={null} page="execution" workflowStage="Build" />
        </div>
    </div>
  );
}
