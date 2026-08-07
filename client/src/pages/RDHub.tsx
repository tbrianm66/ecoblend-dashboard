// ============================================================
// R&D HUB MODULE — 4-Stage Lifecycle (Concept → Simulation → Prototype → Integration)
// Architecture Module 5 — Phase 3 (Live API)
// ============================================================
import ContextualWidgetPanel from "@/components/ContextualWidgetPanel";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Microscope, Plus, Lightbulb, Cpu, Wrench, Plug,
  ChevronRight, Clock, CheckCircle2, AlertTriangle, Pause,
  Pencil, Trash2, ArrowRight,
} from "lucide-react";
import { VentureSelector } from "@/components/discovery/primitives";

// ── Stage Configuration ────────────────────────────────────────────────────────
const STAGES = [
  {
    key: "concept",     label: "Concept",     icon: Lightbulb, color: "#7c3aed",
    description: "Ideation, literature review, feasibility",
    checklist: ["Literature review complete", "Feasibility confirmed", "IP landscape scanned", "Technical lead assigned"],
  },
  {
    key: "simulation",  label: "Simulation",  icon: Cpu,       color: "#3B85BA",
    description: "Modelling, digital twin, computational validation",
    checklist: ["Simulation model validated", "Key parameters defined", "Risk factors identified", "Peer review complete"],
  },
  {
    key: "prototype",   label: "Prototype",   icon: Wrench,    color: "#F69111",
    description: "Physical build, lab testing, performance measurement",
    checklist: ["Prototype built", "Lab tests run", "KPIs measured", "Test results documented"],
  },
  {
    key: "integration", label: "Integration", icon: Plug,      color: "#56A837",
    description: "System integration, field testing, production handoff",
    checklist: ["OEM/field tests passed", "Integration specs met", "Production handoff prepared", "IP protection filed"],
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  in_progress:  { label: "In Progress",  color: "#3B85BA", icon: Clock },
  gate_pending: { label: "Gate Pending", color: "#F69111", icon: AlertTriangle },
  gate_passed:  { label: "Gate Passed",  color: "#16a34a", icon: CheckCircle2 },
  blocked:      { label: "Blocked",      color: "#dc2626", icon: Pause },
};

const classColors: Record<string, { color: string; bg: string }> = {
  iterative: { color: "#16a34a", bg: "#dcfce7" },
  adjacent:  { color: "#3B85BA", bg: "#dbeafe" },
  moonshot:  { color: "#7c3aed", bg: "#ede9fe" },
};

// ── New / Edit Project Modal ───────────────────────────────────────────────────
const EMPTY_FORM = {
  projectName:          "",
  description:          "",
  classification:       "iterative" as "iterative" | "adjacent" | "moonshot",
  currentStage:         "concept"   as "concept" | "simulation" | "prototype" | "integration",
  stageStatus:          "in_progress" as "in_progress" | "gate_pending" | "gate_passed" | "blocked",
  targetTrl:            4,
  completionPercentage: 0,
  technicalLead:        "",
  domain:               "",
  budgetAllocated:      0,
  budgetSpent:          0,
  ipStatus:             "",
};
type ProjectForm = typeof EMPTY_FORM;

function ProjectModal({
  open, onClose, ventureId, editId, initialForm, onSaved,
}: {
  open: boolean; onClose: () => void; ventureId: string;
  editId?: number; initialForm: ProjectForm; onSaved: () => void;
}) {
  const [form, setForm] = useState<ProjectForm>(initialForm);
  const upsert = trpc.rnd.projects.upsert.useMutation({
    onSuccess: () => { toast.success(editId ? "Project updated." : "Project created."); onSaved(); onClose(); },
    onError: e => toast.error(e.message),
  });
  const set = (k: keyof ProjectForm, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit R&D Project" : "New R&D Project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Project Name *</label>
            <Input value={form.projectName} onChange={e => set("projectName", e.target.value)} placeholder="e.g. Hemp-Flax Composite Panel v3" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="mt-1" placeholder="Research goals and scope…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Classification *</label>
              <Select value={form.classification} onValueChange={v => set("classification", v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="iterative">Iterative</SelectItem>
                  <SelectItem value="adjacent">Adjacent</SelectItem>
                  <SelectItem value="moonshot">Moonshot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Starting Stage *</label>
              <Select value={form.currentStage} onValueChange={v => set("currentStage", v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Status *</label>
              <Select value={form.stageStatus} onValueChange={v => set("stageStatus", v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="gate_pending">Gate Pending</SelectItem>
                  <SelectItem value="gate_passed">Gate Passed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Target TRL (1–9)</label>
              <Input type="number" min={1} max={9} value={form.targetTrl} onChange={e => set("targetTrl", Number(e.target.value))} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Technical Lead</label>
              <Input value={form.technicalLead} onChange={e => set("technicalLead", e.target.value)} placeholder="Name / team" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Domain</label>
              <Input value={form.domain} onChange={e => set("domain", e.target.value)} placeholder="e.g. Natural Fibre Composites" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Budget Allocated (£)</label>
              <Input type="number" min={0} value={form.budgetAllocated} onChange={e => set("budgetAllocated", Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Budget Spent (£)</label>
              <Input type="number" min={0} value={form.budgetSpent} onChange={e => set("budgetSpent", Number(e.target.value))} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">IP Status</label>
            <Input value={form.ipStatus} onChange={e => set("ipStatus", e.target.value)} placeholder="e.g. Patent Pending, Trade Secret" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.projectName.trim() || upsert.isPending}
            onClick={() => upsert.mutate({ id: editId, ventureId, ...form })}
            style={{ background: "#3B85BA" }}
          >
            {upsert.isPending ? "Saving…" : editId ? "Save Changes" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Stage Gate Checklist Drawer ────────────────────────────────────────────────
function GateDrawer({ project, onClose, onAdvanced }: {
  project: any; onClose: () => void; onAdvanced: () => void;
}) {
  const stageCfg = STAGES.find(s => s.key === project.currentStage)!;
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    Object.fromEntries(stageCfg.checklist.map(item => [item, false])),
  );
  const advance = trpc.rnd.projects.advanceStage.useMutation({
    onSuccess: () => { toast.success(`Project advanced to ${STAGES[STAGES.findIndex(s => s.key === project.currentStage) + 1]?.label ?? "next stage"}.`); onAdvanced(); onClose(); },
    onError: e => toast.error(e.message),
  });
  const allChecked = Object.values(checklist).every(Boolean);
  const isLastStage = project.currentStage === "integration";

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-white border-l shadow-xl z-50 overflow-y-auto" style={{ borderColor: "#e5e7eb" }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Stage Gate — {stageCfg.label}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{project.projectName}</p>

        <div className="space-y-3 mb-6">
          {stageCfg.checklist.map(item => (
            <label key={item} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checklist[item] ?? false}
                onChange={e => setChecklist(c => ({ ...c, [item]: e.target.checked }))}
                className="mt-0.5 accent-blue-600"
              />
              <span className={`text-sm ${checklist[item] ? "text-gray-400 line-through" : "text-gray-700"}`}>{item}</span>
            </label>
          ))}
        </div>

        {!isLastStage && (
          <Button
            className="w-full gap-2"
            disabled={!allChecked || advance.isPending}
            onClick={() => advance.mutate({ id: project.id, currentStage: project.currentStage, checklist })}
            style={{ background: allChecked ? "#56A837" : undefined }}
          >
            <ArrowRight size={14} />
            {advance.isPending ? "Advancing…" : `Advance to ${STAGES[STAGES.findIndex(s => s.key === project.currentStage) + 1]?.label}`}
          </Button>
        )}
        {isLastStage && (
          <p className="text-xs text-center text-gray-400">Project is at the final stage (Integration).</p>
        )}
        {!allChecked && !isLastStage && (
          <p className="text-[10px] text-center text-gray-400 mt-2">Complete all checklist items to advance.</p>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RDHub() {
  const { selectedVentureId, setSelectedVentureId } = useSelectedVenture();
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<{ id: number; form: ProjectForm } | null>(null);
  const [gateProject, setGateProject] = useState<any | null>(null);

  const { data: projects = [], refetch } = trpc.rnd.projects.list.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );

  const deleteProject = trpc.rnd.projects.delete.useMutation({
    onSuccess: () => { toast.success("Project deleted."); refetch(); },
    onError: e => toast.error(e.message),
  });

  const projectsByStage = STAGES.map(s => ({
    ...s,
    projects: projects.filter(p => p.currentStage === s.key),
  }));

  const openAdd = () => { setEditProject(null); setModalOpen(true); };
  const openEdit = (p: typeof projects[0]) => {
    setEditProject({
      id: p.id,
      form: {
        projectName:          p.projectName,
        description:          p.description ?? "",
        classification:       p.classification as any,
        currentStage:         p.currentStage as any,
        stageStatus:          p.stageStatus as any,
        targetTrl:            p.targetTrl,
        completionPercentage: p.completionPercentage,
        technicalLead:        p.technicalLead ?? "",
        domain:               p.domain ?? "",
        budgetAllocated:      p.budgetAllocated ?? 0,
        budgetSpent:          p.budgetSpent ?? 0,
        ipStatus:             p.ipStatus ?? "",
      },
    });
    setModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Microscope size={18} style={{ color: "#3B85BA" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#3B85BA" }}>Module 5</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>R&D Hub</h1>
            <p className="text-sm text-gray-500 mt-1">4-stage innovation lifecycle — Concept → Simulation → Prototype → Integration</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(["pipeline", "list"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
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
            <Button size="sm" className="gap-2" style={{ background: "#3B85BA" }} onClick={openAdd}>
              <Plus size={14} /> New Project
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <VentureSelector selectedId={selectedVentureId ?? undefined} onSelect={setSelectedVentureId} compact />
        </div>
      </div>

      <div className="p-8">
        {!selectedVentureId ? (
          <div className="text-center py-16 text-gray-400">
            <Microscope size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a venture above to view its R&D pipeline.</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Lightbulb size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-600">No R&D projects yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Create your first project to start tracking the innovation lifecycle.</p>
            <Button size="sm" style={{ background: "#3B85BA" }} onClick={openAdd}><Plus size={14} className="mr-1" /> New Project</Button>
          </div>
        ) : viewMode === "pipeline" ? (
          /* Pipeline / Kanban */
          <div className="grid grid-cols-4 gap-4">
            {projectsByStage.map(stage => {
              const StageIcon = stage.icon;
              return (
                <div key={stage.key}>
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <StageIcon size={14} style={{ color: stage.color }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: stage.color }}>{stage.label}</span>
                    <span className="text-xs text-gray-400 ml-auto">{stage.projects.length}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 px-2 mb-3">{stage.description}</p>
                  <div className="space-y-3">
                    {stage.projects.map(project => {
                      const stCfg = statusConfig[project.stageStatus] ?? statusConfig.in_progress;
                      const StatusIcon = stCfg.icon;
                      const clsCfg = classColors[project.classification] ?? classColors.iterative;
                      const budget = project.budgetAllocated ?? 0;
                      const spent  = project.budgetSpent ?? 0;
                      const budgetPct = budget > 0 ? (spent / budget) * 100 : 0;

                      return (
                        <div
                          key={project.id}
                          className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow"
                          style={{ borderColor: "#e5e7eb", borderTop: `3px solid ${stage.color}` }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="text-[10px] capitalize" style={{ borderColor: clsCfg.color, color: clsCfg.color, background: clsCfg.bg }}>
                              {project.classification}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: stCfg.color, color: stCfg.color }}>
                              <StatusIcon size={8} className="mr-0.5" />{stCfg.label}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 mb-1 leading-tight">{project.projectName}</h3>
                          {project.domain && <p className="text-[10px] text-gray-400 mb-2">{project.domain}</p>}
                          <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-400">
                            <span>TRL target: <strong style={{ color: stage.color }}>{project.targetTrl}</strong></span>
                            {project.ipStatus && <span>· {project.ipStatus}</span>}
                          </div>
                          {budget > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, budgetPct)}%`, background: budgetPct > 90 ? "#dc2626" : stage.color }} />
                              </div>
                              <span className="text-[10px] text-gray-400">£{(spent / 1000).toFixed(0)}k/£{(budget / 1000).toFixed(0)}k</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-2">
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1 flex-1" onClick={() => setGateProject(project)} style={{ color: stage.color }}>
                              <ChevronRight size={10} /> Gate Checklist
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEdit(project)}><Pencil size={10} /></Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400" onClick={() => { if (confirm("Delete this project?")) deleteProject.mutate({ id: project.id }); }}><Trash2 size={10} /></Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">TRL</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Budget</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">IP Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => {
                  const stCfg    = statusConfig[project.stageStatus] ?? statusConfig.in_progress;
                  const stageCfg = STAGES.find(s => s.key === project.currentStage)!;
                  const budget   = project.budgetAllocated ?? 0;
                  const spent    = project.budgetSpent ?? 0;
                  return (
                    <tr key={project.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#f3f4f6" }}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{project.projectName}</p>
                        {project.domain && <p className="text-[10px] text-gray-400">{project.domain}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: stageCfg.color, color: stageCfg.color }}>{stageCfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: stCfg.color }}>{stCfg.label}</td>
                      <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: "#3B85BA" }}>{project.targetTrl}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        {budget > 0 ? `£${(spent / 1000).toFixed(0)}k / £${(budget / 1000).toFixed(0)}k` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{project.ipStatus ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setGateProject(project)} style={{ color: "#3B85BA" }}>Gate</Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(project)}><Pencil size={12} /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => { if (confirm("Delete?")) deleteProject.mutate({ id: project.id }); }}><Trash2 size={12} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contextual Playbook */}
      <div className="p-8 pt-0">
        <ContextualWidgetPanel module="Research & Technical Validation" ventureId={selectedVentureId} page="rd-hub" workflowStage="Build" />
      </div>

      {/* Modals & drawers */}
      <ProjectModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProject(null); }}
        ventureId={selectedVentureId ?? ""}
        editId={editProject?.id}
        initialForm={editProject?.form ?? EMPTY_FORM}
        onSaved={refetch}
      />
      {gateProject && (
        <GateDrawer project={gateProject} onClose={() => setGateProject(null)} onAdvanced={refetch} />
      )}
    </div>
  );
}
