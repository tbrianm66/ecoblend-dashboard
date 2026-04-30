// ============================================================
// R&D HUB MODULE — 4-Stage Lifecycle (Concept → Simulation → Prototype → Integration)
// Architecture Module 5 — Phase 3 MVP
// ============================================================

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Microscope, Plus, Lightbulb, Cpu, Wrench, Plug,
  ChevronRight, Clock, CheckCircle2, AlertTriangle, Pause,
} from "lucide-react";

// ── Types ──
interface RDProject {
  id: string;
  title: string;
  ventureName: string;
  ventureColor: string;
  classification: "iterative" | "adjacent" | "moonshot";
  stage: "concept" | "simulation" | "prototyping" | "integration";
  stageStatus: "in_progress" | "gate_pending" | "gate_passed" | "blocked";
  domain: string;
  technicalLead: string;
  ipStatus: string;
  budgetAllocated: number;
  budgetSpent: number;
  kpis: { name: string; target: string; actual: string; met: boolean }[];
}

// ── Stage Configuration ──
const STAGES = [
  { key: "concept", label: "Concept", icon: Lightbulb, color: "#7c3aed", description: "Ideation, literature review, feasibility analysis" },
  { key: "simulation", label: "Simulation", icon: Cpu, color: "#3A97D3", description: "Modelling, digital twin, computational validation" },
  { key: "prototyping", label: "Prototyping", icon: Wrench, color: "#F49C13", description: "Physical build, lab testing, performance measurement" },
  { key: "integration", label: "Integration", icon: Plug, color: "#51AF37", description: "System integration, field testing, production handoff" },
];

const statusConfig = {
  in_progress: { label: "In Progress", color: "#3A97D3", icon: Clock },
  gate_pending: { label: "Gate Pending", color: "#F49C13", icon: AlertTriangle },
  gate_passed: { label: "Gate Passed", color: "#16a34a", icon: CheckCircle2 },
  blocked: { label: "Blocked", color: "#dc2626", icon: Pause },
};

const classColors = {
  iterative: { color: "#16a34a", bg: "#dcfce7" },
  adjacent: { color: "#3A97D3", bg: "#dbeafe" },
  moonshot: { color: "#7c3aed", bg: "#ede9fe" },
};

// ── Sample Data ──
const SAMPLE_PROJECTS: RDProject[] = [
  {
    id: "rd-1",
    title: "Hemp-Flax Composite Panel v3",
    ventureName: "EcoBlend Materials",
    ventureColor: "#51AF37",
    classification: "iterative",
    stage: "prototyping",
    stageStatus: "in_progress",
    domain: "Natural Fibre Composites",
    technicalLead: "Dr. Sarah Chen",
    ipStatus: "Patent Pending",
    budgetAllocated: 45000,
    budgetSpent: 28500,
    kpis: [
      { name: "Tensile Strength", target: "≥ 180 MPa", actual: "172 MPa", met: false },
      { name: "Weight Reduction", target: "≥ 30%", actual: "33%", met: true },
      { name: "Bio-content", target: "≥ 85%", actual: "88%", met: true },
    ],
  },
  {
    id: "rd-2",
    title: "Mycelium Binding Agent Optimisation",
    ventureName: "BioStruct",
    ventureColor: "#8b5cf6",
    classification: "moonshot",
    stage: "simulation",
    stageStatus: "gate_pending",
    domain: "Bio-based Adhesives",
    technicalLead: "Prof. James Okafor",
    ipStatus: "Trade Secret",
    budgetAllocated: 30000,
    budgetSpent: 18200,
    kpis: [
      { name: "Bond Strength", target: "≥ 12 MPa", actual: "11.4 MPa", met: false },
      { name: "Cure Time", target: "≤ 48h", actual: "36h", met: true },
      { name: "Shelf Life", target: "≥ 6 months", actual: "Testing...", met: false },
    ],
  },
  {
    id: "rd-3",
    title: "Recycled Carbon Fibre Reclamation Process",
    ventureName: "CircularTech",
    ventureColor: "#059669",
    classification: "adjacent",
    stage: "concept",
    stageStatus: "in_progress",
    domain: "Recycled Materials",
    technicalLead: "Dr. Amara Patel",
    ipStatus: "Defensive Publication",
    budgetAllocated: 15000,
    budgetSpent: 3200,
    kpis: [
      { name: "Fibre Recovery Rate", target: "≥ 90%", actual: "—", met: false },
      { name: "Cost vs Virgin", target: "≤ 60%", actual: "—", met: false },
    ],
  },
  {
    id: "rd-4",
    title: "Automotive Door Panel Integration",
    ventureName: "EcoBlend Materials",
    ventureColor: "#51AF37",
    classification: "iterative",
    stage: "integration",
    stageStatus: "gate_passed",
    domain: "Automotive Applications",
    technicalLead: "Dr. Sarah Chen",
    ipStatus: "Patent Pending",
    budgetAllocated: 60000,
    budgetSpent: 55800,
    kpis: [
      { name: "OEM Crash Test", target: "Pass", actual: "Pass", met: true },
      { name: "Production Cycle", target: "≤ 4 min", actual: "3.8 min", met: true },
      { name: "Tooling Compatibility", target: "Standard", actual: "Standard", met: true },
    ],
  },
];

export default function RDHub() {
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  const [selectedProject, setSelectedProject] = useState<RDProject | null>(null);

  const projectsByStage = STAGES.map(s => ({
    ...s,
    projects: SAMPLE_PROJECTS.filter(p => p.stage === s.key),
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Microscope size={18} style={{ color: "#3A97D3" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#3A97D3" }}>Module 5</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              R&D Hub
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              4-stage innovation lifecycle — Concept → Simulation → Prototyping → Integration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {["pipeline", "list"].map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m as any)}
                  className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: viewMode === m ? "white" : "transparent",
                    color: viewMode === m ? "#1a2332" : "#6b7280",
                    boxShadow: viewMode === m ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  {m === "pipeline" ? "Pipeline" : "List"}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              className="gap-2"
              style={{ background: "#3A97D3" }}
              onClick={() => toast.info("New R&D project form — coming in next build")}
            >
              <Plus size={14} /> New Project
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Pipeline View */}
        {viewMode === "pipeline" && (
          <div className="grid grid-cols-4 gap-4">
            {projectsByStage.map(stage => {
              const StageIcon = stage.icon;
              return (
                <div key={stage.key}>
                  {/* Stage header */}
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <StageIcon size={14} style={{ color: stage.color }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: stage.color }}>
                      {stage.label}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">{stage.projects.length}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 px-2 mb-3">{stage.description}</p>

                  {/* Project cards */}
                  <div className="space-y-3">
                    {stage.projects.map(project => {
                      const stCfg = statusConfig[project.stageStatus];
                      const StatusIcon = stCfg.icon;
                      const clsCfg = classColors[project.classification];
                      const budgetPct = (project.budgetSpent / project.budgetAllocated) * 100;

                      return (
                        <div
                          key={project.id}
                          className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow"
                          style={{ borderColor: "#e5e7eb", borderTop: `3px solid ${stage.color}` }}
                          onClick={() => setSelectedProject(project)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: clsCfg.color, color: clsCfg.color, background: clsCfg.bg }}>
                              {project.classification}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: stCfg.color, color: stCfg.color }}>
                              <StatusIcon size={8} className="mr-0.5" />
                              {stCfg.label}
                            </Badge>
                          </div>

                          <h3 className="text-sm font-bold text-gray-900 mb-1 leading-tight">{project.title}</h3>
                          <p className="text-[10px] text-gray-400 mb-2">{project.ventureName} · {project.domain}</p>

                          {/* KPI summary */}
                          <div className="flex gap-1 mb-2">
                            {project.kpis.map((kpi, i) => (
                              <div
                                key={i}
                                className="w-2 h-2 rounded-full"
                                style={{ background: kpi.met ? "#16a34a" : "#e5e7eb" }}
                                title={`${kpi.name}: ${kpi.actual} (target: ${kpi.target})`}
                              />
                            ))}
                            <span className="text-[10px] text-gray-400 ml-1">
                              {project.kpis.filter(k => k.met).length}/{project.kpis.length} KPIs met
                            </span>
                          </div>

                          {/* Budget bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(100, budgetPct)}%`, background: budgetPct > 90 ? "#dc2626" : stage.color }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400">
                              £{(project.budgetSpent / 1000).toFixed(0)}k/{(project.budgetAllocated / 1000).toFixed(0)}k
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Venture</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">KPIs</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Budget</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">IP</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_PROJECTS.map(project => {
                  const stCfg = statusConfig[project.stageStatus];
                  const stageCfg = STAGES.find(s => s.key === project.stage)!;
                  return (
                    <tr key={project.id} className="border-b hover:bg-gray-50 cursor-pointer" style={{ borderColor: "#f3f4f6" }} onClick={() => setSelectedProject(project)}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{project.title}</span>
                        <br />
                        <span className="text-[10px] text-gray-400">{project.domain}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: project.ventureColor }}>{project.ventureName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: stageCfg.color, color: stageCfg.color }}>
                          {stageCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: stCfg.color }}>{stCfg.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs">{project.kpis.filter(k => k.met).length}/{project.kpis.length} met</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono">£{(project.budgetSpent / 1000).toFixed(0)}k / £{(project.budgetAllocated / 1000).toFixed(0)}k</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{project.ipStatus}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail drawer */}
        {selectedProject && (
          <div className="fixed inset-y-0 right-0 w-[480px] bg-white border-l shadow-xl z-50 overflow-y-auto" style={{ borderColor: "#e5e7eb" }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  {selectedProject.title}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>✕</Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Venture</span>
                    <p className="text-sm font-medium" style={{ color: selectedProject.ventureColor }}>{selectedProject.ventureName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Technical Lead</span>
                    <p className="text-sm font-medium text-gray-900">{selectedProject.technicalLead}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">IP Status</span>
                    <p className="text-sm font-medium text-gray-900">{selectedProject.ipStatus}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Classification</span>
                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedProject.classification}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Technical KPIs</h3>
                  <div className="space-y-2">
                    {selectedProject.kpis.map((kpi, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-700">{kpi.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500">Target: {kpi.target}</span>
                          <span className="text-xs font-mono font-bold" style={{ color: kpi.met ? "#16a34a" : "#dc2626" }}>
                            {kpi.actual}
                          </span>
                          {kpi.met ? <CheckCircle2 size={12} style={{ color: "#16a34a" }} /> : <AlertTriangle size={12} style={{ color: "#dc2626" }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
