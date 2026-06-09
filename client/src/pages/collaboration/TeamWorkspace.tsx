import { useState } from "react";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { trpc } from "@/lib/trpc";
import {
  Users, Plus, CheckCircle2, Clock, Circle,
  RefreshCw, AlertTriangle, ChevronDown, ChevronUp, X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = "Todo" | "In_Progress" | "Completed";
type Priority = "Low" | "Medium" | "High" | "Critical";

interface Task {
  id: number;
  taskTitle: string;
  pillarCategory: string;
  assignedRole: string;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Todo:        { label: "To Do",       color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: <Circle size={14} /> },
  In_Progress: { label: "In Progress", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: <Clock size={14} /> },
  Completed:   { label: "Completed",   color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircle2 size={14} /> },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  Low:      { label: "Low",      color: "#6b7280", bg: "#f3f4f6" },
  Medium:   { label: "Medium",   color: "#2563eb", bg: "#dbeafe" },
  High:     { label: "High",     color: "#f59e0b", bg: "#fef3c7" },
  Critical: { label: "Critical", color: "#ef4444", bg: "#fee2e2" },
};

const PILLARS = [
  "Market Validation", "Tech Spikes", "Financial Modeling",
  "Operations", "Go-to-Market", "Sustainability", "Legal & IP",
];

const STATUSES: Status[]   = ["Todo", "In_Progress", "Completed"];
const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Critical"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  const now = new Date();
  const diff = Math.ceil((dt.getTime() - now.getTime()) / 86400000);
  const label = dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (diff < 0)  return <span className="text-red-500 font-semibold">{label} (overdue)</span>;
  if (diff <= 3) return <span className="text-amber-500 font-semibold">{label}</span>;
  return <span className="text-gray-500">{label}</span>;
}

// ── Priority tag ──────────────────────────────────────────────────────────────
function PriorityTag({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority as Priority] ?? { label: priority, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
  );
}

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task }: { task: Task }) {
  const sc = STATUS_CONFIG[task.status as Status] ?? STATUS_CONFIG.Todo;
  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderColor: sc.border }}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex-shrink-0" style={{ color: sc.color }}>{sc.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-800 leading-snug">{task.taskTitle}</p>
            <PriorityTag priority={task.priority} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: sc.color }} />
              {task.pillarCategory}
            </span>
            <span>{task.assignedRole}</span>
            <span>{fmtDate(task.dueDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────
function KanbanColumn({ status, tasks, collapsed, onToggle }: {
  status: Status; tasks: Task[]; collapsed: boolean; onToggle: () => void;
}) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="flex flex-col min-w-0" style={{ minWidth: 260 }}>
      {/* column header */}
      <button onClick={onToggle}
        className="flex items-center justify-between w-full rounded-xl px-4 py-2.5 mb-3 font-bold text-sm transition-colors"
        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
        <div className="flex items-center gap-2">
          {cfg.icon}
          {cfg.label}
          <span className="text-xs font-extrabold px-1.5 py-0.5 rounded-full bg-white/70">{tasks.length}</span>
        </div>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      {!collapsed && (
        <div className="space-y-3">
          {tasks.length === 0
            ? <div className="rounded-xl border border-dashed p-4 text-xs text-gray-400 text-center"
                style={{ borderColor: cfg.border }}>No tasks</div>
            : tasks.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}

// ── New Task Modal ────────────────────────────────────────────────────────────
function NewTaskModal({ ventureId, onClose, onCreated }: {
  ventureId: string; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    taskTitle: "", pillarCategory: PILLARS[0], assignedRole: "",
    priority: "Medium" as Priority, status: "Todo" as Status, dueDate: "",
  });
  const [err, setErr] = useState("");

  const create = trpc.collaboration.createTeamTask.useMutation({
    onSuccess: () => { onCreated(); onClose(); },
    onError: (e) => setErr(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.taskTitle.trim() || !form.assignedRole.trim()) { setErr("Title and role are required."); return; }
    setErr("");
    create.mutate({ ventureId, ...form, dueDate: form.dueDate || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">New Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Task Title <span className="text-red-400">*</span></label>
            <input value={form.taskTitle} onChange={e => setForm(f => ({ ...f, taskTitle: e.target.value }))}
              placeholder="e.g. Conduct user interviews"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          {/* Pillar */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Pillar Category</label>
            <select value={form.pillarCategory} onChange={e => setForm(f => ({ ...f, pillarCategory: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {PILLARS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned Role <span className="text-red-400">*</span></label>
            <input value={form.assignedRole} onChange={e => setForm(f => ({ ...f, assignedRole: e.target.value }))}
              placeholder="e.g. Product Manager"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          {/* Priority + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
          </div>
          {/* Due date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          {err && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle size={13} /> {err}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={create.isPending}
              className="flex-1 rounded-lg py-2 text-sm font-bold text-white transition-colors disabled:opacity-60"
              style={{ background: "#6366f1" }}>
              {create.isPending ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TeamWorkspace() {
  const { selectedVentureId, selectedVenture } = useSelectedVenture();
  const [showModal, setShowModal]   = useState(false);
  const [collapsed, setCollapsed]   = useState<Record<string, boolean>>({});

  const { data: tasks = [], isLoading, refetch } = trpc.collaboration.getTeamTasks.useQuery(
    { ventureId: selectedVentureId ?? "" },
    { enabled: !!selectedVentureId }
  );

  if (!selectedVentureId) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Users size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold">Select a venture to view the Team Workspace</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  // Summary counts
  const total     = tasks.length;
  const done      = tasks.filter(t => t.status === "Completed").length;
  const inProg    = tasks.filter(t => t.status === "In_Progress").length;
  const todo      = tasks.filter(t => t.status === "Todo").length;
  const critical  = tasks.filter(t => t.priority === "Critical").length;
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0;

  // Group by status
  const byStatus = STATUSES.reduce<Record<string, Task[]>>((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  function toggleCol(s: string) {
    setCollapsed(prev => ({ ...prev, [s]: !prev[s] }));
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} style={{ color: "#6366f1" }} />
            <h1 className="text-xl font-bold text-gray-900">Team Workspace</h1>
          </div>
          <p className="text-sm text-gray-500">{selectedVenture?.name ?? selectedVentureId} — Operational Task Board</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: "#6366f1" }}>
          <Plus size={15} /> New Task
        </button>
      </div>

      {/* Summary panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Completion ratio — hero card */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border p-4 bg-white shadow-sm flex flex-col gap-2" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Completion</div>
          <div className="text-3xl font-extrabold" style={{ color: pct === 100 ? "#10b981" : "#6366f1" }}>
            {done}<span className="text-base font-semibold text-gray-400">/{total}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#6366f1" }} />
          </div>
          <div className="text-xs text-gray-400">{pct}% of tasks completed</div>
        </div>
        {/* In Progress */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm flex flex-col gap-1" style={{ borderColor: "#bfdbfe" }}>
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wide">In Progress</div>
          <div className="text-3xl font-extrabold text-blue-600">{inProg}</div>
          <div className="text-xs text-gray-400">active tasks</div>
        </div>
        {/* To Do */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm flex flex-col gap-1" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">To Do</div>
          <div className="text-3xl font-extrabold text-gray-700">{todo}</div>
          <div className="text-xs text-gray-400">queued</div>
        </div>
        {/* Critical */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm flex flex-col gap-1"
          style={{ borderColor: critical > 0 ? "#fecaca" : "#e5e7eb" }}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: critical > 0 ? "#ef4444" : "#9ca3af" }}>Critical</div>
          <div className="text-3xl font-extrabold" style={{ color: critical > 0 ? "#ef4444" : "#9ca3af" }}>{critical}</div>
          <div className="text-xs text-gray-400">high-urgency tasks</div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {STATUSES.map(s => (
          <KanbanColumn
            key={s}
            status={s}
            tasks={byStatus[s]}
            collapsed={!!collapsed[s]}
            onToggle={() => toggleCol(s)}
          />
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <NewTaskModal
          ventureId={selectedVentureId}
          onClose={() => setShowModal(false)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
}
