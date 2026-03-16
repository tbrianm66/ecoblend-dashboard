// ─────────────────────────────────────────────────────────────────────────────
// VENTURE PROJECT MANAGEMENT MODULE
// Design: Precision Industrial — EcoBlend design system
// Features: Programs, Phases, Workstreams, Tasks (Kanban), Milestones,
//           Resources, Execution Risks, Documents
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ClipboardList, Plus, ChevronDown, ChevronRight, AlertTriangle,
  CheckCircle2, Clock, Circle, XCircle, FolderOpen, Users,
  FileText, Layers, Flag, BarChart3, ArrowRight, Pencil, Trash2,
  ShieldAlert, BookOpen, Target,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Program = {
  id: number; ventureId: string; name: string; description?: string | null;
  status?: string | null; startDate?: string | null; targetEndDate?: string | null;
  programManager?: string | null; budget?: number | null; budgetSpent?: number | null;
  notes?: string | null; createdAt?: Date | null;
};

type Phase = {
  id: number; programId: number; ventureId: string; name: string;
  phaseNumber: number; vrlStage?: number | null; status?: string | null;
  completionPercent?: number | null; gateReviewPassed?: boolean | null;
  startDate?: string | null; targetEndDate?: string | null; notes?: string | null;
};

type Workstream = {
  id: number; phaseId: number; ventureId: string; name: string;
  functionalArea?: string | null; owner?: string | null; status?: string | null;
  completionPercent?: number | null; startDate?: string | null; targetEndDate?: string | null;
};

type Milestone = {
  id: number; workstreamId: number; phaseId: number; ventureId: string;
  title: string; description?: string | null; milestoneType?: string | null;
  status?: string | null; targetDate?: string | null; completionEvidence?: string | null;
};

type Task = {
  id: number; workstreamId: number; ventureId: string; title: string;
  description?: string | null; kanbanStatus?: string | null; priority?: string | null;
  assignee?: string | null; dueDate?: string | null; estimatedHours?: number | null;
  actualHours?: number | null; notes?: string | null;
};

type Resource = {
  id: number; ventureId: string; name: string; resourceType?: string | null;
  role?: string | null; allocationPercent?: number | null; dayRate?: number | null;
  totalBudgeted?: number | null; totalActual?: number | null;
  startDate?: string | null; endDate?: string | null;
};

type ExecutionRisk = {
  id: number; ventureId: string; title: string; description?: string | null;
  riskCategory?: string | null; likelihood?: string | null; impact?: string | null;
  riskScore?: number | null; riskLevel?: string | null; status?: string | null;
  mitigationPlan?: string | null; owner?: string | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const VENTURES_MOCK = [
  { id: "ecoblend-core", name: "EcoComp Core" },
  { id: "verdant-packaging", name: "Verdant Packaging" },
  { id: "bioloop", name: "BioLoop" },
  { id: "solaris-agri", name: "Solaris Agri" },
  { id: "circulate", name: "Circulate" },
  { id: "greenchain", name: "GreenChain" },
];

const STATUS_COLORS: Record<string, string> = {
  "Not Started": "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-100 text-blue-700",
  "On Hold": "bg-amber-100 text-amber-700",
  "Completed": "bg-green-100 text-green-700",
  "Cancelled": "bg-red-100 text-red-600",
  "Overdue": "bg-red-100 text-red-700",
  "Backlog": "bg-gray-100 text-gray-500",
  "To Do": "bg-slate-100 text-slate-600",
  "In Review": "bg-purple-100 text-purple-700",
  "Done": "bg-green-100 text-green-700",
  "Blocked": "bg-red-100 text-red-700",
};

const RISK_LEVEL_COLORS: Record<string, string> = {
  "Low": "bg-green-100 text-green-700",
  "Medium": "bg-amber-100 text-amber-700",
  "High": "bg-orange-100 text-orange-700",
  "Critical": "bg-red-100 text-red-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  "Critical": "text-red-600",
  "High": "text-orange-500",
  "Medium": "text-amber-500",
  "Low": "text-gray-400",
};

const KANBAN_COLUMNS = ["Backlog", "To Do", "In Progress", "In Review", "Done", "Blocked"];

// ── Status Icon ───────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status?: string | null }) {
  if (status === "Completed" || status === "Done") return <CheckCircle2 size={14} className="text-green-500" />;
  if (status === "In Progress") return <Clock size={14} className="text-blue-500" />;
  if (status === "Blocked" || status === "Cancelled") return <XCircle size={14} className="text-red-500" />;
  if (status === "Overdue") return <AlertTriangle size={14} className="text-red-500" />;
  return <Circle size={14} className="text-gray-400" />;
}

// ── KPI Tile ──────────────────────────────────────────────────────────────────

function KpiTile({ label, value, sub, accent, icon: Icon }: {
  label: string; value: string | number; sub?: string; accent?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent ?? "#51AF37"}18` }}>
        <Icon size={18} style={{ color: accent ?? "#51AF37" }} />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</div>
        <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{value}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type Tab = "programs" | "kanban" | "milestones" | "resources" | "risks" | "documents";

export default function VentureProjectManagement() {
  const [selectedVentureId, setSelectedVentureId] = useState(VENTURES_MOCK[0].id);
  const [activeTab, setActiveTab] = useState<Tab>("programs");
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());

  // Dialog states
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [showPhaseDialog, setShowPhaseDialog] = useState<{ programId: number } | null>(null);
  const [showWorkstreamDialog, setShowWorkstreamDialog] = useState<{ phaseId: number } | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState<{ workstreamId: number } | null>(null);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState<{ workstreamId: number; phaseId: number } | null>(null);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const utils = trpc.useUtils();

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: programs = [], isLoading: loadingPrograms } = trpc.pm.listPrograms.useQuery(
    { ventureId: selectedVentureId }, { enabled: !!selectedVentureId }
  );
  const { data: allTasks = [] } = trpc.pm.listTasksByVenture.useQuery(
    { ventureId: selectedVentureId }, { enabled: activeTab === "kanban" }
  );
  const { data: allMilestones = [] } = trpc.pm.listMilestonesByVenture.useQuery(
    { ventureId: selectedVentureId }, { enabled: activeTab === "milestones" }
  );
  const { data: resources = [] } = trpc.pm.listResources.useQuery(
    { ventureId: selectedVentureId }, { enabled: activeTab === "resources" }
  );
  const { data: risks = [] } = trpc.pm.listExecutionRisks.useQuery(
    { ventureId: selectedVentureId }, { enabled: activeTab === "risks" }
  );
  const { data: documents = [] } = trpc.pm.listDocuments.useQuery(
    { ventureId: selectedVentureId }, { enabled: activeTab === "documents" }
  );
  const { data: summary } = trpc.pm.portfolioSummary.useQuery();

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createProgram = trpc.pm.createProgram.useMutation({
    onSuccess: () => { utils.pm.listPrograms.invalidate(); toast.success("Program created"); setShowProgramDialog(false); },
    onError: () => toast.error("Failed to create program"),
  });
  const deleteProgram = trpc.pm.deleteProgram.useMutation({
    onSuccess: () => { utils.pm.listPrograms.invalidate(); toast.success("Program deleted"); },
  });
  const createPhase = trpc.pm.createPhase.useMutation({
    onSuccess: () => { utils.pm.listPrograms.invalidate(); toast.success("Phase added"); setShowPhaseDialog(null); },
    onError: () => toast.error("Failed to add phase"),
  });
  const createWorkstream = trpc.pm.createWorkstream.useMutation({
    onSuccess: () => { utils.pm.listPrograms.invalidate(); toast.success("Workstream added"); setShowWorkstreamDialog(null); },
    onError: () => toast.error("Failed to add workstream"),
  });
  const createTask = trpc.pm.createTask.useMutation({
    onSuccess: () => {
      utils.pm.listTasksByVenture.invalidate();
      toast.success("Task created");
      setShowTaskDialog(null);
    },
    onError: () => toast.error("Failed to create task"),
  });
  const updateTask = trpc.pm.updateTask.useMutation({
    onSuccess: () => { utils.pm.listTasksByVenture.invalidate(); setEditingTask(null); },
  });
  const deleteTask = trpc.pm.deleteTask.useMutation({
    onSuccess: () => { utils.pm.listTasksByVenture.invalidate(); toast.success("Task deleted"); },
  });
  const createMilestone = trpc.pm.createMilestone.useMutation({
    onSuccess: () => { utils.pm.listMilestonesByVenture.invalidate(); toast.success("Milestone added"); setShowMilestoneDialog(null); },
  });
  const updateMilestone = trpc.pm.updateMilestone.useMutation({
    onSuccess: () => { utils.pm.listMilestonesByVenture.invalidate(); },
  });
  const createResource = trpc.pm.createResource.useMutation({
    onSuccess: () => { utils.pm.listResources.invalidate(); toast.success("Resource added"); setShowResourceDialog(false); },
  });
  const createRisk = trpc.pm.createExecutionRisk.useMutation({
    onSuccess: () => { utils.pm.listExecutionRisks.invalidate(); toast.success("Risk logged"); setShowRiskDialog(false); },
  });
  const updateRisk = trpc.pm.updateExecutionRisk.useMutation({
    onSuccess: () => { utils.pm.listExecutionRisks.invalidate(); },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleProgram = (id: number) => setExpandedPrograms(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const togglePhase = (id: number) => setExpandedPhases(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const selectedVentureName = VENTURES_MOCK.find(v => v.id === selectedVentureId)?.name ?? "";

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "programs", label: "Programs & Phases", icon: Layers },
    { id: "kanban", label: "Task Board", icon: ClipboardList },
    { id: "milestones", label: "Milestones", icon: Target },
    { id: "resources", label: "Resources", icon: Users },
    { id: "risks", label: "Execution Risks", icon: ShieldAlert },
    { id: "documents", label: "Documents", icon: BookOpen },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList size={18} style={{ color: "#51AF37" }} />
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Project Management</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Venture Execution Hub
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Programs · Phases · Workstreams · Tasks · Milestones · Resources · Risks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedVentureId} onValueChange={setSelectedVentureId}>
              <SelectTrigger className="w-48 text-sm h-9">
                <SelectValue placeholder="Select venture" />
              </SelectTrigger>
              <SelectContent>
                {VENTURES_MOCK.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI row */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <KpiTile label="Active Programs" value={summary.activePrograms} sub={`of ${summary.totalPrograms} total`} accent="#51AF37" icon={Layers} />
            <KpiTile label="Overdue Tasks" value={summary.overdueTasks} sub={`of ${summary.totalTasks} tasks`} accent="#F49C13" icon={AlertTriangle} />
            <KpiTile label="Milestone Progress" value={`${summary.milestoneCompletionRate}%`} sub={`${summary.completedMilestones}/${summary.totalMilestones} done`} accent="#3A97D3" icon={Target} />
            <KpiTile label="Critical Risks" value={summary.criticalRisks} sub={`of ${summary.totalRisks} open risks`} accent="#ef4444" icon={ShieldAlert} />
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#51AF37] text-[#51AF37]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* ── PROGRAMS & PHASES TAB ────────────────────────────────────────── */}
        {activeTab === "programs" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700">
                {selectedVentureName} — Programs
              </h2>
              <Button size="sm" className="gap-1.5 text-xs h-8" style={{ background: "#51AF37" }}
                onClick={() => setShowProgramDialog(true)}>
                <Plus size={13} /> New Program
              </Button>
            </div>

            {loadingPrograms && (
              <div className="text-center py-12 text-gray-400 text-sm">Loading programs…</div>
            )}

            {!loadingPrograms && programs.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <Layers size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">No programs yet</p>
                <p className="text-xs text-gray-400 mt-1">Create a program to start organising this venture's execution</p>
                <Button size="sm" className="mt-4 gap-1.5 text-xs" style={{ background: "#51AF37" }}
                  onClick={() => setShowProgramDialog(true)}>
                  <Plus size={13} /> Create First Program
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {(programs as Program[]).map(program => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  ventureId={selectedVentureId}
                  expanded={expandedPrograms.has(program.id)}
                  onToggle={() => toggleProgram(program.id)}
                  expandedPhases={expandedPhases}
                  onTogglePhase={togglePhase}
                  onAddPhase={() => setShowPhaseDialog({ programId: program.id })}
                  onAddWorkstream={(phaseId) => setShowWorkstreamDialog({ phaseId })}
                  onAddTask={(workstreamId) => setShowTaskDialog({ workstreamId })}
                  onAddMilestone={(workstreamId, phaseId) => setShowMilestoneDialog({ workstreamId, phaseId })}
                  onDelete={() => deleteProgram.mutate({ id: program.id })}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── KANBAN TASK BOARD TAB ─────────────────────────────────────────── */}
        {activeTab === "kanban" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700">{selectedVentureName} — Task Board</h2>
              <p className="text-xs text-gray-400">Drag tasks between columns to update status</p>
            </div>
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
              {KANBAN_COLUMNS.map(col => {
                const colTasks = (allTasks as Task[]).filter(t => (t.kanbanStatus ?? "Backlog") === col);
                return (
                  <div key={col} className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[col] ?? "bg-gray-100 text-gray-600"}`}>
                        {col}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{colTasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colTasks.map(task => (
                        <div key={task.id}
                          className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 cursor-pointer hover:border-gray-300 transition-colors group"
                          onClick={() => setEditingTask(task)}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs font-medium text-gray-800 leading-tight">{task.title}</p>
                            <button onClick={e => { e.stopPropagation(); deleteTask.mutate({ id: task.id }); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={10} className="text-red-400" />
                            </button>
                          </div>
                          {task.assignee && (
                            <p className="text-xs text-gray-400 mt-1">{task.assignee}</p>
                          )}
                          {task.dueDate && (
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">{task.dueDate}</p>
                          )}
                          {task.priority && (
                            <Flag size={10} className={`mt-1 ${PRIORITY_COLORS[task.priority] ?? "text-gray-400"}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MILESTONES TAB ───────────────────────────────────────────────── */}
        {activeTab === "milestones" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700">{selectedVentureName} — Milestones</h2>
            </div>
            {(allMilestones as Milestone[]).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <Target size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">No milestones yet</p>
                <p className="text-xs text-gray-400 mt-1">Add milestones from within a workstream in the Programs tab</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(allMilestones as Milestone[]).map(m => (
                  <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                    <StatusIcon status={m.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{m.title}</p>
                      {m.description && <p className="text-xs text-gray-400 truncate">{m.description}</p>}
                    </div>
                    {m.milestoneType && (
                      <Badge variant="outline" className="text-xs shrink-0">{m.milestoneType}</Badge>
                    )}
                    {m.targetDate && (
                      <span className="text-xs font-mono text-gray-400 shrink-0">{m.targetDate}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[m.status ?? "Not Started"] ?? "bg-gray-100 text-gray-600"}`}>
                      {m.status ?? "Not Started"}
                    </span>
                    {m.status !== "Completed" && (
                      <button
                        onClick={() => updateMilestone.mutate({ id: m.id, status: "Completed" })}
                        className="text-xs text-green-600 hover:underline shrink-0"
                      >
                        Mark done
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RESOURCES TAB ────────────────────────────────────────────────── */}
        {activeTab === "resources" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700">{selectedVentureName} — Resources</h2>
              <Button size="sm" className="gap-1.5 text-xs h-8" style={{ background: "#51AF37" }}
                onClick={() => setShowResourceDialog(true)}>
                <Plus size={13} /> Add Resource
              </Button>
            </div>
            {(resources as Resource[]).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <Users size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">No resources allocated</p>
                <Button size="sm" className="mt-4 gap-1.5 text-xs" style={{ background: "#51AF37" }}
                  onClick={() => setShowResourceDialog(true)}>
                  <Plus size={13} /> Add First Resource
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["Name", "Type", "Role", "Allocation", "Day Rate", "Budgeted", "Actual", "Dates"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-gray-500 font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(resources as Resource[]).map(r => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                        <td className="px-4 py-3 text-gray-500">{r.resourceType ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{r.role ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{r.allocationPercent != null ? `${r.allocationPercent}%` : "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{r.dayRate != null ? `£${r.dayRate}` : "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{r.totalBudgeted != null ? `£${r.totalBudgeted.toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{r.totalActual != null ? `£${r.totalActual.toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono">
                          {r.startDate ?? "—"} {r.endDate ? `→ ${r.endDate}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── EXECUTION RISKS TAB ──────────────────────────────────────────── */}
        {activeTab === "risks" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700">{selectedVentureName} — Execution Risk Register</h2>
              <Button size="sm" className="gap-1.5 text-xs h-8" style={{ background: "#51AF37" }}
                onClick={() => setShowRiskDialog(true)}>
                <Plus size={13} /> Log Risk
              </Button>
            </div>
            {(risks as ExecutionRisk[]).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <ShieldAlert size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">No execution risks logged</p>
                <Button size="sm" className="mt-4 gap-1.5 text-xs" style={{ background: "#51AF37" }}
                  onClick={() => setShowRiskDialog(true)}>
                  <Plus size={13} /> Log First Risk
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {(risks as ExecutionRisk[]).map(r => (
                  <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RISK_LEVEL_COLORS[r.riskLevel ?? "Low"]}`}>
                            {r.riskLevel ?? "Low"} ({r.riskScore ?? 0})
                          </span>
                          {r.riskCategory && (
                            <Badge variant="outline" className="text-xs">{r.riskCategory}</Badge>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status ?? "Open"] ?? "bg-gray-100 text-gray-600"}`}>
                            {r.status ?? "Open"}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{r.title}</p>
                        {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                        {r.mitigationPlan && (
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="font-semibold text-gray-600">Mitigation: </span>{r.mitigationPlan}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-400 shrink-0">
                        <div>L: {r.likelihood ?? "—"}</div>
                        <div>I: {r.impact ?? "—"}</div>
                        {r.owner && <div className="mt-1 font-medium text-gray-600">{r.owner}</div>}
                      </div>
                    </div>
                    {r.status === "Open" && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => updateRisk.mutate({ id: r.id, status: "Mitigated" })}
                          className="text-xs text-green-600 hover:underline">Mark Mitigated</button>
                        <button onClick={() => updateRisk.mutate({ id: r.id, status: "Accepted" })}
                          className="text-xs text-amber-600 hover:underline">Accept Risk</button>
                        <button onClick={() => updateRisk.mutate({ id: r.id, status: "Escalated" })}
                          className="text-xs text-red-600 hover:underline">Escalate</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS TAB ────────────────────────────────────────────────── */}
        {activeTab === "documents" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700">{selectedVentureName} — Document Repository</h2>
            </div>
            {(documents as { id: number; title: string; documentType?: string | null; fileUrl?: string | null; version?: string | null; uploadedBy?: string | null; createdAt?: Date | null }[]).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">No documents uploaded</p>
                <p className="text-xs text-gray-400 mt-1">Documents can be linked from within workstreams</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["Title", "Type", "Version", "Uploaded By", "Date", "Link"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-gray-500 font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(documents as { id: number; title: string; documentType?: string | null; fileUrl?: string | null; version?: string | null; uploadedBy?: string | null; createdAt?: Date | null }[]).map(d => (
                      <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{d.title}</td>
                        <td className="px-4 py-3 text-gray-500">{d.documentType ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono">{d.version ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{d.uploadedBy ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono">
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {d.fileUrl ? (
                            <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1">
                              <FileText size={11} /> Open
                            </a>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DIALOGS ─────────────────────────────────────────────────────────── */}

      {/* Create Program */}
      <CreateProgramDialog
        open={showProgramDialog}
        onClose={() => setShowProgramDialog(false)}
        onSubmit={(data) => createProgram.mutate({ ...data, ventureId: selectedVentureId } as Parameters<typeof createProgram.mutate>[0])}
        loading={createProgram.isPending}
      />

      {/* Create Phase */}
      {showPhaseDialog && (
        <CreatePhaseDialog
          open={!!showPhaseDialog}
          onClose={() => setShowPhaseDialog(null)}
          onSubmit={(data) => createPhase.mutate({ ...data, programId: showPhaseDialog.programId, ventureId: selectedVentureId } as Parameters<typeof createPhase.mutate>[0])}
          loading={createPhase.isPending}
        />
      )}

      {/* Create Workstream */}
      {showWorkstreamDialog && (
        <CreateWorkstreamDialog
          open={!!showWorkstreamDialog}
          onClose={() => setShowWorkstreamDialog(null)}
          onSubmit={(data) => createWorkstream.mutate({ ...data, phaseId: showWorkstreamDialog.phaseId, ventureId: selectedVentureId } as Parameters<typeof createWorkstream.mutate>[0])}
          loading={createWorkstream.isPending}
        />
      )}

      {/* Create Task */}
      {showTaskDialog && (
        <CreateTaskDialog
          open={!!showTaskDialog}
          onClose={() => setShowTaskDialog(null)}
          onSubmit={(data) => createTask.mutate({ ...data, workstreamId: showTaskDialog.workstreamId, ventureId: selectedVentureId } as Parameters<typeof createTask.mutate>[0])}
          loading={createTask.isPending}
        />
      )}

      {/* Edit Task */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={(data) => updateTask.mutate({ id: editingTask.id, ...data } as Parameters<typeof updateTask.mutate>[0])}
          loading={updateTask.isPending}
        />
      )}

      {/* Create Milestone */}
      {showMilestoneDialog && (
        <CreateMilestoneDialog
          open={!!showMilestoneDialog}
          onClose={() => setShowMilestoneDialog(null)}
          onSubmit={(data) => createMilestone.mutate({
            ...data,
            workstreamId: showMilestoneDialog.workstreamId,
            phaseId: showMilestoneDialog.phaseId,
            ventureId: selectedVentureId,
          } as Parameters<typeof createMilestone.mutate>[0])}
          loading={createMilestone.isPending}
        />
      )}

      {/* Create Resource */}
      <CreateResourceDialog
        open={showResourceDialog}
        onClose={() => setShowResourceDialog(false)}
        onSubmit={(data) => createResource.mutate({ ...data, ventureId: selectedVentureId } as Parameters<typeof createResource.mutate>[0])}
        loading={createResource.isPending}
      />

      {/* Create Risk */}
      <CreateRiskDialog
        open={showRiskDialog}
        onClose={() => setShowRiskDialog(false)}
        onSubmit={(data) => createRisk.mutate({ ...data, ventureId: selectedVentureId } as Parameters<typeof createRisk.mutate>[0])}
        loading={createRisk.isPending}
      />
    </div>
  );
}

// ── Program Card ──────────────────────────────────────────────────────────────

function ProgramCard({
  program, ventureId, expanded, onToggle, expandedPhases, onTogglePhase,
  onAddPhase, onAddWorkstream, onAddTask, onAddMilestone, onDelete,
}: {
  program: Program; ventureId: string; expanded: boolean; onToggle: () => void;
  expandedPhases: Set<number>; onTogglePhase: (id: number) => void;
  onAddPhase: () => void; onAddWorkstream: (phaseId: number) => void;
  onAddTask: (workstreamId: number) => void; onAddMilestone: (workstreamId: number, phaseId: number) => void;
  onDelete: () => void;
}) {
  const { data: phases = [] } = trpc.pm.listPhases.useQuery(
    { programId: program.id }, { enabled: expanded }
  );

  const budgetUsed = program.budget && program.budgetSpent
    ? Math.round((program.budgetSpent / program.budget) * 100)
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Program header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#51AF37]/10">
          <Layers size={14} style={{ color: "#51AF37" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{program.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[program.status ?? "Not Started"]}`}>
              {program.status ?? "Not Started"}
            </span>
          </div>
          {program.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{program.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0">
          {program.programManager && <span>{program.programManager}</span>}
          {program.targetEndDate && <span className="font-mono">{program.targetEndDate}</span>}
          {budgetUsed !== null && (
            <span className={budgetUsed > 90 ? "text-red-500 font-semibold" : ""}>
              {budgetUsed}% budget
            </span>
          )}
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {/* Phases */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="p-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phases</span>
            <Button size="sm" variant="outline" className="h-6 text-xs gap-1 px-2" onClick={onAddPhase}>
              <Plus size={10} /> Phase
            </Button>
          </div>
          {(phases as Phase[]).map(phase => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              ventureId={ventureId}
              expanded={expandedPhases.has(phase.id)}
              onToggle={() => onTogglePhase(phase.id)}
              onAddWorkstream={() => onAddWorkstream(phase.id)}
              onAddTask={onAddTask}
              onAddMilestone={(wsId) => onAddMilestone(wsId, phase.id)}
            />
          ))}
          {(phases as Phase[]).length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No phases yet — add one above</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Phase Card ────────────────────────────────────────────────────────────────

function PhaseCard({
  phase, ventureId, expanded, onToggle, onAddWorkstream, onAddTask, onAddMilestone,
}: {
  phase: Phase; ventureId: string; expanded: boolean; onToggle: () => void;
  onAddWorkstream: () => void; onAddTask: (workstreamId: number) => void;
  onAddMilestone: (workstreamId: number) => void;
}) {
  const { data: workstreams = [] } = trpc.pm.listWorkstreams.useQuery(
    { phaseId: phase.id }, { enabled: expanded }
  );

  return (
    <div className="mx-3 mb-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}>
        <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-50">
          <BarChart3 size={11} className="text-blue-500" />
        </div>
        <span className="text-xs font-bold text-gray-700">
          Phase {phase.phaseNumber}: {phase.name}
        </span>
        {phase.vrlStage && (
          <Badge variant="outline" className="text-xs h-4 px-1.5">VRL {phase.vrlStage}</Badge>
        )}
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[phase.status ?? "Not Started"]}`}>
          {phase.status ?? "Not Started"}
        </span>
        {phase.completionPercent != null && (
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-green-400" style={{ width: `${phase.completionPercent}%` }} />
            </div>
            <span className="text-xs text-gray-400 font-mono">{phase.completionPercent}%</span>
          </div>
        )}
        {phase.gateReviewPassed && (
          <CheckCircle2 size={12} className="text-green-500 ml-1" aria-label="Gate review passed" />
        )}
        {expanded ? <ChevronDown size={12} className="text-gray-400 ml-1" /> : <ChevronRight size={12} className="text-gray-400 ml-1" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/30 px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workstreams</span>
            <Button size="sm" variant="outline" className="h-5 text-xs gap-1 px-1.5" onClick={onAddWorkstream}>
              <Plus size={9} /> Workstream
            </Button>
          </div>
          {(workstreams as Workstream[]).map(ws => (
            <WorkstreamRow
              key={ws.id}
              workstream={ws}
              onAddTask={() => onAddTask(ws.id)}
              onAddMilestone={() => onAddMilestone(ws.id)}
            />
          ))}
          {(workstreams as Workstream[]).length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No workstreams yet</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Workstream Row ────────────────────────────────────────────────────────────

function WorkstreamRow({
  workstream, onAddTask, onAddMilestone,
}: {
  workstream: Workstream; onAddTask: () => void; onAddMilestone: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white transition-colors group">
      <ArrowRight size={10} className="text-gray-300 shrink-0" />
      <span className="text-xs font-medium text-gray-700 flex-1 min-w-0 truncate">{workstream.name}</span>
      {workstream.functionalArea && (
        <Badge variant="outline" className="text-xs h-4 px-1.5 shrink-0">{workstream.functionalArea}</Badge>
      )}
      {workstream.owner && (
        <span className="text-xs text-gray-400 shrink-0">{workstream.owner}</span>
      )}
      <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[workstream.status ?? "Not Started"]}`}>
        {workstream.status ?? "Not Started"}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onAddTask} className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
          <Plus size={9} /> Task
        </button>
        <button onClick={onAddMilestone} className="text-xs text-amber-500 hover:underline flex items-center gap-0.5">
          <Plus size={9} /> Milestone
        </button>
      </div>
    </div>
  );
}

// ── Dialog Components ─────────────────────────────────────────────────────────

function CreateProgramDialog({ open, onClose, onSubmit, loading }: {
  open: boolean; onClose: () => void;
  onSubmit: (data: { name: string; description?: string; status?: string; programManager?: string; startDate?: string; targetEndDate?: string; budget?: number }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [manager, setManager] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name, description: description || undefined, status, programManager: manager || undefined, startDate: startDate || undefined, targetEndDate: endDate || undefined, budget: budget ? parseFloat(budget) : undefined });
    setName(""); setDescription(""); setStatus("Not Started"); setManager(""); setStartDate(""); setEndDate(""); setBudget("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Program</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Program Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. VRL 1 → 2 Execution" className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1 text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{["Not Started","In Progress","On Hold","Completed","Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Program Manager</Label><Input value={manager} onChange={e => setManager(e.target.value)} placeholder="Name" className="mt-1 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 text-sm" /></div>
            <div><Label className="text-xs">Target End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 text-sm" /></div>
          </div>
          <div><Label className="text-xs">Budget (£)</Label><Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0" className="mt-1 text-sm" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-sm">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="text-sm" style={{ background: "#51AF37" }}>
            {loading ? "Creating…" : "Create Program"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreatePhaseDialog({ open, onClose, onSubmit, loading }: {
  open: boolean; onClose: () => void;
  onSubmit: (data: { name: string; phaseNumber: number; vrlStage?: number; status?: string; startDate?: string; targetEndDate?: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [phaseNumber, setPhaseNumber] = useState("1");
  const [vrlStage, setVrlStage] = useState("");
  const [status, setStatus] = useState("Not Started");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name, phaseNumber: parseInt(phaseNumber), vrlStage: vrlStage ? parseInt(vrlStage) : undefined, status });
    setName(""); setPhaseNumber("1"); setVrlStage(""); setStatus("Not Started");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Phase</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Phase Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Market Validation" className="mt-1 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Phase Number</Label><Input type="number" value={phaseNumber} onChange={e => setPhaseNumber(e.target.value)} min={1} className="mt-1 text-sm" /></div>
            <div><Label className="text-xs">VRL Stage (1–4)</Label><Input type="number" value={vrlStage} onChange={e => setVrlStage(e.target.value)} min={1} max={4} placeholder="Optional" className="mt-1 text-sm" /></div>
          </div>
          <div><Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1 text-sm h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{["Not Started","In Progress","On Hold","Completed","Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-sm">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="text-sm" style={{ background: "#51AF37" }}>
            {loading ? "Adding…" : "Add Phase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateWorkstreamDialog({ open, onClose, onSubmit, loading }: {
  open: boolean; onClose: () => void;
  onSubmit: (data: { name: string; functionalArea?: string; owner?: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [owner, setOwner] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name, functionalArea: area as "Technical" | "Commercial" | "Legal" | "Financial" | "Marketing" | "Operations" | "People" | "ESG" | "Other" | undefined || undefined, owner: owner || undefined });
    setName(""); setArea(""); setOwner("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Workstream</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Workstream Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. IP Protection" className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Functional Area</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="mt-1 text-sm h-9"><SelectValue placeholder="Select area" /></SelectTrigger>
              <SelectContent>{["Technical","Commercial","Legal","Financial","Marketing","Operations","People","ESG","Other"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Owner</Label><Input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Name" className="mt-1 text-sm" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-sm">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="text-sm" style={{ background: "#51AF37" }}>
            {loading ? "Adding…" : "Add Workstream"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateTaskDialog({ open, onClose, onSubmit, loading }: {
  open: boolean; onClose: () => void;
  onSubmit: (data: { title: string; description?: string; kanbanStatus?: string; priority?: string; assignee?: string; dueDate?: string; estimatedHours?: number }) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To Do");
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [hours, setHours] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({ title, description: description || undefined, kanbanStatus: status, priority, assignee: assignee || undefined, dueDate: dueDate || undefined, estimatedHours: hours ? parseFloat(hours) : undefined });
    setTitle(""); setDescription(""); setStatus("To Do"); setPriority("Medium"); setAssignee(""); setDueDate(""); setHours("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Task Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. File provisional patent" className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1 text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{KANBAN_COLUMNS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1 text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{["Critical","High","Medium","Low"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Assignee</Label><Input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Name" className="mt-1 text-sm" /></div>
            <div><Label className="text-xs">Due Date</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 text-sm" /></div>
          </div>
          <div><Label className="text-xs">Estimated Hours</Label><Input type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder="0" className="mt-1 text-sm" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-sm">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || loading} className="text-sm" style={{ background: "#51AF37" }}>
            {loading ? "Creating…" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTaskDialog({ task, onClose, onSubmit, loading }: {
  task: Task; onClose: () => void;
  onSubmit: (data: { kanbanStatus?: string; priority?: string; assignee?: string; dueDate?: string; actualHours?: number }) => void;
  loading: boolean;
}) {
  const [status, setStatus] = useState(task.kanbanStatus ?? "To Do");
  const [priority, setPriority] = useState(task.priority ?? "Medium");
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [actualHours, setActualHours] = useState(task.actualHours?.toString() ?? "");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Edit Task: {task.title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1 text-sm h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{KANBAN_COLUMNS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1 text-sm h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{["Critical","High","Medium","Low"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Assignee</Label><Input value={assignee} onChange={e => setAssignee(e.target.value)} className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Due Date</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Actual Hours</Label><Input type="number" value={actualHours} onChange={e => setActualHours(e.target.value)} className="mt-1 text-sm" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-sm">Cancel</Button>
          <Button onClick={() => onSubmit({ kanbanStatus: status, priority, assignee: assignee || undefined, dueDate: dueDate || undefined, actualHours: actualHours ? parseFloat(actualHours) : undefined })} disabled={loading} className="text-sm" style={{ background: "#51AF37" }}>
            {loading ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateMilestoneDialog({ open, onClose, onSubmit, loading }: {
  open: boolean; onClose: () => void;
  onSubmit: (data: { title: string; milestoneType?: string; targetDate?: string; description?: string }) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({ title, milestoneType: type as "Gate Review" | "Deliverable" | "Decision Point" | "External Event" | "Funding Milestone" | "Launch" | undefined || undefined, targetDate: targetDate || undefined, description: description || undefined });
    setTitle(""); setType(""); setTargetDate(""); setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Milestone</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Milestone Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. MVP Launched" className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1 text-sm h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{["Gate Review","Deliverable","Decision Point","External Event","Funding Milestone","Launch"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Target Date</Label><Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1 text-sm" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-sm">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || loading} className="text-sm" style={{ background: "#51AF37" }}>
            {loading ? "Adding…" : "Add Milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateResourceDialog({ open, onClose, onSubmit, loading }: {
  open: boolean; onClose: () => void;
  onSubmit: (data: { name: string; resourceType?: string; role?: string; allocationPercent?: number; dayRate?: number; totalBudgeted?: number; startDate?: string; endDate?: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Person");
  const [role, setRole] = useState("");
  const [allocation, setAllocation] = useState("");
  const [dayRate, setDayRate] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name, resourceType: type as "Person" | "Budget" | "Equipment" | "External Service" | undefined || undefined, role: role || undefined, allocationPercent: allocation ? parseFloat(allocation) : undefined, dayRate: dayRate ? parseFloat(dayRate) : undefined, totalBudgeted: budget ? parseFloat(budget) : undefined, startDate: startDate || undefined, endDate: endDate || undefined });
    setName(""); setType("Person"); setRole(""); setAllocation(""); setDayRate(""); setBudget(""); setStartDate(""); setEndDate("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Smith" className="mt-1 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1 text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{["Person","Budget","Equipment","External Service"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Role</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Lead Engineer" className="mt-1 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Allocation %</Label><Input type="number" value={allocation} onChange={e => setAllocation(e.target.value)} placeholder="100" className="mt-1 text-sm" /></div>
            <div><Label className="text-xs">Day Rate (£)</Label><Input type="number" value={dayRate} onChange={e => setDayRate(e.target.value)} placeholder="0" className="mt-1 text-sm" /></div>
          </div>
          <div><Label className="text-xs">Total Budgeted (£)</Label><Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0" className="mt-1 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 text-sm" /></div>
            <div><Label className="text-xs">End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 text-sm" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-sm">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="text-sm" style={{ background: "#51AF37" }}>
            {loading ? "Adding…" : "Add Resource"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateRiskDialog({ open, onClose, onSubmit, loading }: {
  open: boolean; onClose: () => void;
  onSubmit: (data: { title: string; description?: string; riskCategory?: string; likelihood?: string; impact?: string; mitigationPlan?: string; owner?: string }) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technical");
  const [likelihood, setLikelihood] = useState("Medium");
  const [impact, setImpact] = useState("Moderate");
  const [mitigation, setMitigation] = useState("");
  const [owner, setOwner] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({ title, description: description || undefined, riskCategory: category as "Schedule" | "Budget" | "Resource" | "Technical" | "Dependency" | "Regulatory" | "Stakeholder" | "Scope" | "Quality" | undefined || undefined, likelihood: likelihood as "Very Low" | "Low" | "Medium" | "High" | "Very High" | undefined || undefined, impact: impact as "Negligible" | "Minor" | "Moderate" | "Major" | "Critical" | undefined || undefined, mitigationPlan: mitigation || undefined, owner: owner || undefined });
    setTitle(""); setDescription(""); setCategory("Technical"); setLikelihood("Medium"); setImpact("Moderate"); setMitigation(""); setOwner("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Execution Risk</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Risk Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Key engineer departure" className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1 text-sm" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1 text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{["Schedule","Budget","Resource","Technical","Dependency","Regulatory","Stakeholder","Scope","Quality"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Likelihood</Label>
              <Select value={likelihood} onValueChange={setLikelihood}>
                <SelectTrigger className="mt-1 text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{["Very Low","Low","Medium","High","Very High"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Impact</Label>
              <Select value={impact} onValueChange={setImpact}>
                <SelectTrigger className="mt-1 text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{["Negligible","Minor","Moderate","Major","Critical"].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Mitigation Plan</Label><Textarea value={mitigation} onChange={e => setMitigation(e.target.value)} rows={2} className="mt-1 text-sm" /></div>
          <div><Label className="text-xs">Risk Owner</Label><Input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Name" className="mt-1 text-sm" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-sm">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || loading} className="text-sm" style={{ background: "#51AF37" }}>
            {loading ? "Logging…" : "Log Risk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
