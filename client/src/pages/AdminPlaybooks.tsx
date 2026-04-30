// ============================================================
// ADMIN — PLAYBOOK LIBRARY
// Full CRUD: create, edit, archive, version, publish, assign
// Search, filter by category/module/status/access level
// Design: Precision Industrial — consistent with EcoBlend OS
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BookOpenCheck, Plus, Search, Filter, Edit2, Archive,
  Eye, Send, Copy, ChevronDown, ChevronRight, X, Tag,
  Layers, Users, Lock, Globe, Building2, GraduationCap,
  Briefcase, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, RefreshCw, FileText, BookOpen,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  "Draft", "Under Review", "Approved", "Published", "Archived", "Superseded",
] as const;

const ACCESS_LEVELS = [
  "Admin Only", "Internal Team", "Venture Team", "Advisor Access",
  "Academic Partner Access", "Investor View", "Public / Exportable",
] as const;

const CATEGORIES = [
  "Getting Started", "Venture Intake", "Problem Framing", "Customer Discovery",
  "Market Validation", "Value Proposition", "Business Model", "R&D",
  "Prototyping", "Risk Management", "Scoring", "Investment", "Execution",
  "Stage-Gate",
] as const;

const MODULES = [
  "Portfolio Overview", "Venture Intake", "Experiment Log", "VRL Analytics",
  "TRL Analytics", "BRL Analytics", "Risk Management", "Investment Readiness",
  "Founder Profiles", "Academic Research", "Onboarding", "All Modules",
] as const;

const WORKFLOW_STAGES = [
  "Opportunity", "Validation", "Build", "Launch", "Scale",
] as const;

const USER_ROLES = [
  "Admin", "Venture Team", "Founder", "Coach", "Advisor",
  "Academic Partner", "Investor", "All Roles",
] as const;

// ── Status badge colours ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Draft":        { bg: "#1a2332", text: "#94a3b8", border: "#334155" },
  "Under Review": { bg: "#1c1a08", text: "#F49C13", border: "#78350f" },
  "Approved":     { bg: "#0f1f14", text: "#4ade80", border: "#166534" },
  "Published":    { bg: "#0d1f2d", text: "#3A97D3", border: "#1d4ed8" },
  "Archived":     { bg: "#1a1a1a", text: "#6b7280", border: "#374151" },
  "Superseded":   { bg: "#1f0f1a", text: "#c084fc", border: "#7e22ce" },
};

const ACCESS_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  "Admin Only": Lock,
  "Internal Team": Building2,
  "Venture Team": Briefcase,
  "Advisor Access": Users,
  "Academic Partner Access": GraduationCap,
  "Investor View": TrendingUp,
  "Public / Exportable": Globe,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Playbook {
  id: number;
  playbookId: string;
  title: string;
  category: string | null;
  relatedModule: string | null;
  relatedWorkflowStage: string | null;
  userRole: string | null;
  purpose: string | null;
  whenToUse: string | null;
  stepByStepGuidance: string | null;
  requiredInputs: string | null;
  requiredOutputs: string | null;
  linkedTemplates: string | null;
  linkedScoringFrameworks: string | null;
  linkedRiskCategories: string | null;
  evidenceRequired: string | null;
  approvalRequired: boolean | null;
  accessLevel: string | null;
  version: string | null;
  status: string | null;
  owner: string | null;
  reviewDate: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

const EMPTY_FORM: Omit<Playbook, "id" | "createdAt" | "updatedAt"> = {
  playbookId: "",
  title: "",
  category: null,
  relatedModule: null,
  relatedWorkflowStage: null,
  userRole: null,
  purpose: null,
  whenToUse: null,
  stepByStepGuidance: null,
  requiredInputs: null,
  requiredOutputs: null,
  linkedTemplates: null,
  linkedScoringFrameworks: null,
  linkedRiskCategories: null,
  evidenceRequired: null,
  approvalRequired: false,
  accessLevel: "Internal Team",
  version: "1.0",
  status: "Draft",
  owner: null,
  reviewDate: null,
  createdBy: null,
  updatedBy: null,
};

// ── Playbook Form Dialog ──────────────────────────────────────────────────────

function PlaybookFormDialog({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: Partial<Playbook> | null;
  onSaved: () => void;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<Omit<Playbook, "id" | "createdAt" | "updatedAt">>(
    initial ? { ...EMPTY_FORM, ...initial } : { ...EMPTY_FORM }
  );
  const [tab, setTab] = useState<"overview" | "content" | "links" | "settings">("overview");

  const createMutation = trpc.admin.playbooks.create.useMutation({
    onSuccess: () => { toast.success("Playbook created"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.admin.playbooks.update.useMutation({
    onSuccess: () => { toast.success("Playbook updated"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: keyof typeof form, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.playbookId.trim()) { toast.error("Playbook ID is required"); return; }
    if (isEdit && initial?.id) {
      updateMutation.mutate({ id: initial.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "content", label: "Content" },
    { id: "links", label: "Links" },
    { id: "settings", label: "Settings" },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" style={{ background: "#0f1923", border: "1px solid #1e2d3d", color: "#e2e8f0" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#51AF37", fontFamily: "'Prompt', sans-serif" }}>
            {isEdit ? "Edit Playbook" : "Create New Playbook"}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b mb-4" style={{ borderColor: "#1e2d3d" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: tab === t.id ? "#51AF37" : "#64748b",
                borderBottom: tab === t.id ? "2px solid #51AF37" : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label style={{ color: "#94a3b8" }}>Title *</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)}
                placeholder="e.g. New Venture Intake Playbook"
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Playbook ID *</Label>
              <Input value={form.playbookId} onChange={e => set("playbookId", e.target.value)}
                placeholder="e.g. pb-venture-intake"
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Version</Label>
              <Input value={form.version ?? ""} onChange={e => set("version", e.target.value)}
                placeholder="1.0"
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Category</Label>
              <Select value={form.category ?? ""} onValueChange={v => set("category", v)}>
                <SelectTrigger style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent style={{ background: "#0f1923", border: "1px solid #1e2d3d" }}>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Related Module</Label>
              <Select value={form.relatedModule ?? ""} onValueChange={v => set("relatedModule", v)}>
                <SelectTrigger style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }}>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent style={{ background: "#0f1923", border: "1px solid #1e2d3d" }}>
                  {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Workflow Stage</Label>
              <Select value={form.relatedWorkflowStage ?? ""} onValueChange={v => set("relatedWorkflowStage", v)}>
                <SelectTrigger style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }}>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent style={{ background: "#0f1923", border: "1px solid #1e2d3d" }}>
                  {WORKFLOW_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>User Role</Label>
              <Select value={form.userRole ?? ""} onValueChange={v => set("userRole", v)}>
                <SelectTrigger style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent style={{ background: "#0f1923", border: "1px solid #1e2d3d" }}>
                  {USER_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Owner</Label>
              <Input value={form.owner ?? ""} onChange={e => set("owner", e.target.value)}
                placeholder="e.g. Brian"
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Review Date</Label>
              <Input type="date" value={form.reviewDate ?? ""} onChange={e => set("reviewDate", e.target.value)}
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
          </div>
        )}

        {/* Content Tab */}
        {tab === "content" && (
          <div className="flex flex-col gap-4">
            <div>
              <Label style={{ color: "#94a3b8" }}>Purpose</Label>
              <Textarea rows={3} value={form.purpose ?? ""} onChange={e => set("purpose", e.target.value)}
                placeholder="What is this playbook for?"
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>When to Use</Label>
              <Textarea rows={2} value={form.whenToUse ?? ""} onChange={e => set("whenToUse", e.target.value)}
                placeholder="Describe the trigger conditions for using this playbook"
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Step-by-Step Guidance</Label>
              <Textarea rows={6} value={form.stepByStepGuidance ?? ""} onChange={e => set("stepByStepGuidance", e.target.value)}
                placeholder="Step 1: ...\nStep 2: ...\nStep 3: ..."
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label style={{ color: "#94a3b8" }}>Required Inputs</Label>
                <Textarea rows={3} value={form.requiredInputs ?? ""} onChange={e => set("requiredInputs", e.target.value)}
                  placeholder="List required inputs..."
                  style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
              </div>
              <div>
                <Label style={{ color: "#94a3b8" }}>Required Outputs</Label>
                <Textarea rows={3} value={form.requiredOutputs ?? ""} onChange={e => set("requiredOutputs", e.target.value)}
                  placeholder="List expected outputs..."
                  style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
              </div>
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Evidence Required</Label>
              <Textarea rows={2} value={form.evidenceRequired ?? ""} onChange={e => set("evidenceRequired", e.target.value)}
                placeholder="What evidence must be collected or referenced?"
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
          </div>
        )}

        {/* Links Tab */}
        {tab === "links" && (
          <div className="flex flex-col gap-4">
            <div>
              <Label style={{ color: "#94a3b8" }}>Linked Templates</Label>
              <Textarea rows={2} value={form.linkedTemplates ?? ""} onChange={e => set("linkedTemplates", e.target.value)}
                placeholder="e.g. BMC Template, H4 Hypothesis Template"
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Linked Scoring Frameworks</Label>
              <Textarea rows={2} value={form.linkedScoringFrameworks ?? ""} onChange={e => set("linkedScoringFrameworks", e.target.value)}
                placeholder="e.g. VRL, TRL, BRL, PRL"
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Linked Risk Categories</Label>
              <Textarea rows={2} value={form.linkedRiskCategories ?? ""} onChange={e => set("linkedRiskCategories", e.target.value)}
                placeholder="e.g. Market Risk, Technical Risk, Regulatory Risk"
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }} />
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label style={{ color: "#94a3b8" }}>Status</Label>
              <Select value={form.status ?? "Draft"} onValueChange={v => set("status", v)}>
                <SelectTrigger style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "#0f1923", border: "1px solid #1e2d3d" }}>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: "#94a3b8" }}>Access Level</Label>
              <Select value={form.accessLevel ?? "Internal Team"} onValueChange={v => set("accessLevel", v)}>
                <SelectTrigger style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "#0f1923", border: "1px solid #1e2d3d" }}>
                  {ACCESS_LEVELS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center gap-3 mt-2">
              <input
                type="checkbox"
                id="approval-required"
                checked={form.approvalRequired ?? false}
                onChange={e => set("approvalRequired", e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="approval-required" style={{ color: "#94a3b8" }}>
                Approval required before publishing
              </Label>
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}
            style={{ borderColor: "#1e2d3d", color: "#64748b" }}>
            Cancel
          </Button>
          <Button onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            style={{ background: "#51AF37", color: "#fff" }}>
            {createMutation.isPending || updateMutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Playbook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Playbook Detail Drawer ────────────────────────────────────────────────────

function PlaybookDetailDrawer({
  playbook,
  onClose,
  onEdit,
}: {
  playbook: Playbook;
  onClose: () => void;
  onEdit: () => void;
}) {
  const sc = STATUS_COLORS[playbook.status ?? "Draft"];
  const AccessIcon = ACCESS_ICONS[playbook.accessLevel ?? "Internal Team"] ?? Lock;

  const Section = ({ title, content }: { title: string; content: string | null }) =>
    content ? (
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#64748b" }}>{title}</div>
        <div className="text-sm whitespace-pre-wrap" style={{ color: "#cbd5e1" }}>{content}</div>
      </div>
    ) : null;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] z-50 shadow-2xl flex flex-col"
      style={{ background: "#0f1923", borderLeft: "1px solid #1e2d3d" }}>
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono" style={{ color: "#3A97D3" }}>{playbook.playbookId}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
              {playbook.status}
            </span>
          </div>
          <h2 className="text-base font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
            {playbook.title}
          </h2>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#64748b" }}>
            {playbook.category && <span className="flex items-center gap-1"><Tag size={10} />{playbook.category}</span>}
            {playbook.version && <span>v{playbook.version}</span>}
            <span className="flex items-center gap-1"><AccessIcon size={10} />{playbook.accessLevel}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
          <X size={16} style={{ color: "#64748b" }} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Meta row */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
          {[
            { label: "Module", value: playbook.relatedModule },
            { label: "Stage", value: playbook.relatedWorkflowStage },
            { label: "Role", value: playbook.userRole },
            { label: "Owner", value: playbook.owner },
          ].map(({ label, value }) => value ? (
            <div key={label} className="rounded-lg p-2" style={{ background: "#0a1520", border: "1px solid #1e2d3d" }}>
              <div style={{ color: "#64748b" }}>{label}</div>
              <div className="font-medium mt-0.5" style={{ color: "#94a3b8" }}>{value}</div>
            </div>
          ) : null)}
        </div>

        <Section title="Purpose" content={playbook.purpose} />
        <Section title="When to Use" content={playbook.whenToUse} />
        <Section title="Step-by-Step Guidance" content={playbook.stepByStepGuidance} />
        <Section title="Required Inputs" content={playbook.requiredInputs} />
        <Section title="Required Outputs" content={playbook.requiredOutputs} />
        <Section title="Evidence Required" content={playbook.evidenceRequired} />
        <Section title="Linked Templates" content={playbook.linkedTemplates} />
        <Section title="Linked Scoring Frameworks" content={playbook.linkedScoringFrameworks} />
        <Section title="Linked Risk Categories" content={playbook.linkedRiskCategories} />

        {playbook.approvalRequired && (
          <div className="flex items-center gap-2 text-xs mt-2" style={{ color: "#F49C13" }}>
            <AlertTriangle size={12} /> Approval required before publishing
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t flex gap-2" style={{ borderColor: "#1e2d3d" }}>
        <Button size="sm" onClick={onEdit}
          style={{ background: "#51AF37", color: "#fff" }}>
          <Edit2 size={13} className="mr-1" /> Edit
        </Button>
        <Button size="sm" variant="outline"
          style={{ borderColor: "#1e2d3d", color: "#64748b" }}>
          <Copy size={13} className="mr-1" /> Duplicate
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPlaybooks() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterAccess, setFilterAccess] = useState<string>("all");
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [editingPlaybook, setEditingPlaybook] = useState<Partial<Playbook> | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data, refetch, isLoading } = trpc.admin.playbooks.list.useQuery({
    search: search || undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
    category: filterCategory !== "all" ? filterCategory : undefined,
    module: filterModule !== "all" ? filterModule : undefined,
    accessLevel: filterAccess !== "all" ? filterAccess : undefined,
    limit: 100,
  });

  const archiveMutation = trpc.admin.playbooks.archive.useMutation({
    onSuccess: () => { toast.success("Playbook archived"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const publishMutation = trpc.admin.playbooks.publish.useMutation({
    onSuccess: () => { toast.success("Playbook published"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const changeStatusMutation = trpc.admin.playbooks.setStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const playbooks = data?.playbooks ?? [];

  // Group by category for display
  const grouped = useMemo(() => {
    const map: Record<string, Playbook[]> = {};
    for (const pb of playbooks) {
      const cat = pb.category ?? "Uncategorised";
      if (!map[cat]) map[cat] = [];
      map[cat].push(pb);
    }
    return map;
  }, [playbooks]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pb of playbooks) {
      const s = pb.status ?? "Draft";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [playbooks]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>
      {/* Page header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpenCheck size={18} style={{ color: "#51AF37" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#51AF37" }}>
                Admin
              </span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
              Playbook Library
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
              {playbooks.length} playbooks · Create, manage, version, and publish operational playbooks across all modules
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}
            style={{ background: "#51AF37", color: "#fff" }}>
            <Plus size={14} className="mr-1.5" /> New Playbook
          </Button>
        </div>

        {/* Status summary pills */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {STATUS_OPTIONS.map(s => {
            const sc = STATUS_COLORS[s];
            const count = statusCounts[s] ?? 0;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: filterStatus === s ? sc.bg : "transparent",
                  color: filterStatus === s ? sc.text : "#475569",
                  border: `1px solid ${filterStatus === s ? sc.border : "#1e2d3d"}`,
                }}
              >
                {s} {count > 0 && <span className="font-mono">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-0">
        {/* Main content */}
        <div className={`flex-1 p-6 transition-all ${selectedPlaybook ? "mr-[480px]" : ""}`}>
          {/* Search & filters */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search playbooks…"
                className="pl-9"
                style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px]" style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#94a3b8" }}>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent style={{ background: "#0f1923", border: "1px solid #1e2d3d" }}>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-[180px]" style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#94a3b8" }}>
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent style={{ background: "#0f1923", border: "1px solid #1e2d3d" }}>
                <SelectItem value="all">All Modules</SelectItem>
                {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterAccess} onValueChange={setFilterAccess}>
              <SelectTrigger className="w-[180px]" style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#94a3b8" }}>
                <SelectValue placeholder="Access Level" />
              </SelectTrigger>
              <SelectContent style={{ background: "#0f1923", border: "1px solid #1e2d3d" }}>
                <SelectItem value="all">All Access Levels</SelectItem>
                {ACCESS_LEVELS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Playbook grid grouped by category */}
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw size={20} className="animate-spin" style={{ color: "#51AF37" }} />
            </div>
          ) : playbooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 gap-3">
              <BookOpen size={40} style={{ color: "#1e2d3d" }} />
              <p style={{ color: "#475569" }}>No playbooks found. Create your first playbook.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, pbs]) => (
              <div key={category} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={12} style={{ color: "#51AF37" }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#51AF37" }}>
                    {category}
                  </span>
                  <span className="text-xs" style={{ color: "#475569" }}>({pbs.length})</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {pbs.map(pb => {
                    const sc = STATUS_COLORS[pb.status ?? "Draft"];
                    const AccessIcon = ACCESS_ICONS[pb.accessLevel ?? "Internal Team"] ?? Lock;
                    const isSelected = selectedPlaybook?.id === pb.id;
                    return (
                      <div
                        key={pb.id}
                        onClick={() => setSelectedPlaybook(isSelected ? null : pb)}
                        className="rounded-xl p-4 cursor-pointer transition-all"
                        style={{
                          background: isSelected ? "#0d1f2d" : "#0a1520",
                          border: `1px solid ${isSelected ? "#3A97D3" : "#1e2d3d"}`,
                        }}
                      >
                        {/* Card header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-2">
                            <div className="text-xs font-mono mb-0.5" style={{ color: "#3A97D3" }}>
                              {pb.playbookId}
                            </div>
                            <div className="text-sm font-semibold leading-snug" style={{ color: "#e2e8f0" }}>
                              {pb.title}
                            </div>
                          </div>
                          <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                            {pb.status}
                          </span>
                        </div>

                        {/* Purpose snippet */}
                        {pb.purpose && (
                          <p className="text-xs mb-3 line-clamp-2" style={{ color: "#64748b" }}>
                            {pb.purpose}
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {pb.relatedWorkflowStage && (
                            <span className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: "#0f1923", color: "#94a3b8", border: "1px solid #1e2d3d" }}>
                              {pb.relatedWorkflowStage}
                            </span>
                          )}
                          {pb.version && (
                            <span className="text-xs" style={{ color: "#475569" }}>v{pb.version}</span>
                          )}
                          <span className="flex items-center gap-0.5 text-xs ml-auto" style={{ color: "#475569" }}>
                            <AccessIcon size={10} />{pb.accessLevel?.split(" ")[0]}
                          </span>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t" style={{ borderColor: "#1e2d3d" }}>
                          <button
                            onClick={e => { e.stopPropagation(); setEditingPlaybook(pb); }}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/5"
                            style={{ color: "#64748b" }}
                          >
                            <Edit2 size={11} /> Edit
                          </button>
                          {pb.status !== "Published" && pb.status !== "Archived" && (
                            <button
                              onClick={e => { e.stopPropagation(); publishMutation.mutate({ id: pb.id }); }}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/5"
                              style={{ color: "#51AF37" }}
                            >
                              <Send size={11} /> Publish
                            </button>
                          )}
                          {pb.status !== "Archived" && (
                            <button
                              onClick={e => { e.stopPropagation(); archiveMutation.mutate({ id: pb.id }); }}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/5 ml-auto"
                              style={{ color: "#475569" }}
                            >
                              <Archive size={11} /> Archive
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail drawer */}
        {selectedPlaybook && (
          <PlaybookDetailDrawer
            playbook={selectedPlaybook}
            onClose={() => setSelectedPlaybook(null)}
            onEdit={() => { setEditingPlaybook(selectedPlaybook); setSelectedPlaybook(null); }}
          />
        )}
      </div>

      {/* Create dialog */}
      {showCreateDialog && (
        <PlaybookFormDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          initial={null}
          onSaved={refetch}
        />
      )}

      {/* Edit dialog */}
      {editingPlaybook && (
        <PlaybookFormDialog
          open={!!editingPlaybook}
          onClose={() => setEditingPlaybook(null)}
          initial={editingPlaybook}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
