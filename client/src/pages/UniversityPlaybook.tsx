// ============================================================
// UNIVERSITY PLAYBOOK
// 15-section venture creation model — university-led
// 8 tabs: Overview, Research, Talent, Venture Workflow,
//         Industry, Governance, Data Strategy, Roadmap
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  GraduationCap, BookOpen, Users, GitBranch, Building2,
  FileText, Database, Map, Plus, Pencil, Trash2, ChevronRight,
  CheckCircle2, Clock, AlertCircle, Sparkles, ArrowRight,
  Shield, Globe, BarChart3, TrendingUp, Lightbulb,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type VentureId = string;

// ── Helpers ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
    published: "bg-blue-100 text-blue-700",
    signed: "bg-green-100 text-green-700",
    analysed: "bg-green-100 text-green-700",
    planned: "bg-gray-100 text-gray-500",
    pending: "bg-gray-100 text-gray-500",
    draft: "bg-yellow-100 text-yellow-700",
    under_review: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    paused: "bg-orange-100 text-orange-700",
    inactive: "bg-gray-100 text-gray-400",
    negotiating: "bg-purple-100 text-purple-700",
    delayed: "bg-red-100 text-red-700",
    cancelled: "bg-red-100 text-red-700",
    expired: "bg-red-100 text-red-700",
    rejected: "bg-red-100 text-red-700",
    confirmed: "bg-green-100 text-green-700",
    refuted: "bg-red-100 text-red-700",
    inconclusive: "bg-yellow-100 text-yellow-700",
    onboarding: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: "bg-gray-100 text-gray-500",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[priority] || "bg-gray-100 text-gray-500"}`}>
      {priority}
    </span>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ ventureId }: { ventureId: VentureId }) {
  const { data: summary } = trpc.uniSummary.getSummary.useQuery({ ventureId });

  const WORKFLOW_STAGES = [
    { id: "problem_definition", label: "Problem Definition", color: "#3A97D3" },
    { id: "research_discovery", label: "Research & Discovery", color: "#F49C13" },
    { id: "hypothesis_development", label: "Hypothesis Development", color: "#8B5CF6" },
    { id: "validation", label: "Validation", color: "#51AF37" },
    { id: "commercialisation", label: "Commercialisation", color: "#EF4444" },
  ];

  const STRATEGIC_OBJECTIVES = [
    { icon: GraduationCap, label: "Establish venture creation capability", color: "#3A97D3" },
    { icon: BookOpen, label: "Integrate academic research with commercialisation", color: "#51AF37" },
    { icon: TrendingUp, label: "Create new revenue streams", color: "#F49C13" },
    { icon: Building2, label: "Strengthen industry collaboration", color: "#8B5CF6" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "University Partners", value: summary?.activePartners ?? 0, sub: `of ${summary?.totalPartners ?? 0} total`, icon: GraduationCap, color: "#3A97D3" },
          { label: "Research Projects", value: summary?.activeResearch ?? 0, sub: `of ${summary?.totalResearch ?? 0} total`, icon: BookOpen, color: "#51AF37" },
          { label: "Active Talent", value: summary?.activeTalent ?? 0, sub: `of ${summary?.totalTalent ?? 0} enrolled`, icon: Users, color: "#8B5CF6" },
          { label: "Roadmap Progress", value: `${summary?.roadmapProgress ?? 0}%`, sub: `${summary?.completedMilestones ?? 0}/${summary?.totalMilestones ?? 0} milestones`, icon: Map, color: "#F49C13" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dual Risk Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Shield size={16} className="text-blue-500" /> Dual Risk Model
            </CardTitle>
            <p className="text-xs text-gray-400">University manages business risk; founders manage product risk</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl p-4 border" style={{ background: "#3A97D308", borderColor: "#3A97D330" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#3A97D318" }}>
                  <Building2 size={16} style={{ color: "#3A97D3" }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Business Risk</p>
                  <p className="text-xs text-gray-400">Managed by University</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {["Market Analysis", "Strategy", "Commercialisation"].map(item => (
                  <div key={item} className="text-xs text-center py-1.5 px-2 rounded-lg font-medium" style={{ background: "#3A97D315", color: "#3A97D3" }}>{item}</div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: "#51AF3708", borderColor: "#51AF3730" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#51AF3718" }}>
                  <Lightbulb size={16} style={{ color: "#51AF37" }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Product Risk</p>
                  <p className="text-xs text-gray-400">Managed by Founders</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {["Technology", "Engineering", "Validation"].map(item => (
                  <div key={item} className="text-xs text-center py-1.5 px-2 rounded-lg font-medium" style={{ background: "#51AF3715", color: "#51AF37" }}>{item}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategic Objectives */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-500" /> Strategic Objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {STRATEGIC_OBJECTIVES.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: `${color}25`, background: `${color}08` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <p className="text-sm text-gray-700 font-medium">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Venture Workflow Pipeline */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <GitBranch size={16} className="text-orange-500" /> Venture Workflow Pipeline
          </CardTitle>
          <p className="text-xs text-gray-400">5-stage university venture creation process</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {WORKFLOW_STAGES.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-2">
                <div className="rounded-xl px-4 py-3 text-center min-w-[120px]" style={{ background: `${stage.color}12`, border: `1.5px solid ${stage.color}30` }}>
                  <p className="text-xs font-bold" style={{ color: stage.color }}>{stage.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{(summary?.workflowStages as Record<string, number> | undefined)?.[stage.id] ?? 0} projects</p>
                </div>
                {i < WORKFLOW_STAGES.length - 1 && <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Integration */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Globe size={16} className="text-green-500" /> Platform Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Research Database", value: summary?.totalResearch ?? 0, icon: BookOpen, color: "#3A97D3" },
              { label: "Talent Network", value: summary?.totalTalent ?? 0, icon: Users, color: "#51AF37" },
              { label: "Industry Engagements", value: summary?.totalIndustry ?? 0, icon: Building2, color: "#F49C13" },
              { label: "Governance Docs", value: `${summary?.signedDocs ?? 0}/${summary?.totalGovernance ?? 0} signed`, icon: FileText, color: "#8B5CF6" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl p-3 border text-center" style={{ background: `${color}08`, borderColor: `${color}25` }}>
                <Icon size={18} className="mx-auto mb-1" style={{ color }} />
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-lg font-bold mt-0.5" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Research Tab ───────────────────────────────────────────────────────────────
function ResearchTab({ ventureId }: { ventureId: VentureId }) {
  const utils = trpc.useUtils();
  const { data: projects } = trpc.uniResearch.list.useQuery({ ventureId });
  const upsert = trpc.uniResearch.upsert.useMutation({ onSuccess: () => { utils.uniResearch.list.invalidate(); toast.success("Saved"); setOpen(false); } });
  const del = trpc.uniResearch.delete.useMutation({ onSuccess: () => { utils.uniResearch.list.invalidate(); toast.success("Deleted"); } });
  const generateSummary = trpc.uniResearch.generateSummary.useMutation({ onSuccess: (data) => { setForm(f => ({ ...f, keyFindings: data.keyFindings.join("\n") })); toast.success("AI summary generated"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", researchType: "business", description: "", objective: "", methodology: "", status: "planned", leadResearcher: "", budget: "", keyFindings: "", trlImpact: "" });

  const TYPE_COLORS: Record<string, string> = { business: "#3A97D3", technical: "#51AF37", applied: "#F49C13" };

  function openNew() { setEditing(null); setForm({ title: "", researchType: "business", description: "", objective: "", methodology: "", status: "planned", leadResearcher: "", budget: "", keyFindings: "", trlImpact: "" }); setOpen(true); }
  function openEdit(p: typeof projects extends (infer T)[] | undefined ? T : never) {
    if (!p) return;
    setEditing((p as { id: number }).id);
    setForm({
      title: (p as { title: string }).title,
      researchType: (p as { researchType: string }).researchType,
      description: (p as { description: string | null }).description ?? "",
      objective: (p as { objective: string | null }).objective ?? "",
      methodology: (p as { methodology: string | null }).methodology ?? "",
      status: (p as { status: string }).status,
      leadResearcher: (p as { leadResearcher: string | null }).leadResearcher ?? "",
      budget: String((p as { budget: string | null }).budget ?? ""),
      keyFindings: (p as { keyFindings: string | null }).keyFindings ?? "",
      trlImpact: String((p as { trlImpact: number | null }).trlImpact ?? ""),
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Research Projects</h3>
          <p className="text-xs text-gray-400">Business, technical, and applied research linked to ventures</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#3A97D3" }}>
          <Plus size={13} /> Add Research
        </Button>
      </div>

      {/* Type legend */}
      <div className="flex gap-3">
        {[["business", "Business Research"], ["technical", "Technical Research"], ["applied", "Applied Research"]].map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS[type] }} />
            {label}
          </div>
        ))}
      </div>

      {!projects?.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">No research projects yet. Add one to get started.</div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <Card key={p.id} className="border shadow-sm hover:shadow-md transition-all" style={{ borderLeft: `4px solid ${TYPE_COLORS[p.researchType] || "#e5e7eb"}` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-gray-900">{p.title}</p>
                      <StatusBadge status={p.status} />
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${TYPE_COLORS[p.researchType]}15`, color: TYPE_COLORS[p.researchType] }}>
                        {p.researchType}
                      </span>
                    </div>
                    {p.objective && <p className="text-xs text-gray-500 mb-1">{p.objective.slice(0, 100)}{p.objective.length > 100 ? "…" : ""}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {p.leadResearcher && <span>Lead: {p.leadResearcher}</span>}
                      {p.trlImpact && <span>TRL {p.trlImpact} support</span>}
                      {p.budget && <span>Budget: £{Number(p.budget).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-3">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(p)}><Pencil size={12} /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => del.mutate({ id: p.id })}><Trash2 size={12} /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Research Project</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.researchType} onValueChange={v => setForm(f => ({ ...f, researchType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["planned", "active", "completed", "published", "paused"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Objective</Label><Textarea rows={2} value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} /></div>
            <div><Label>Methodology</Label><Input value={form.methodology} onChange={e => setForm(f => ({ ...f, methodology: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Lead Researcher</Label><Input value={form.leadResearcher} onChange={e => setForm(f => ({ ...f, leadResearcher: e.target.value }))} /></div>
              <div><Label>Budget (£)</Label><Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} /></div>
            </div>
            <div><Label>TRL Level Supported</Label><Input type="number" min={1} max={9} value={form.trlImpact} onChange={e => setForm(f => ({ ...f, trlImpact: e.target.value }))} /></div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Key Findings</Label>
                <Button size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={() => generateSummary.mutate({ title: form.title, objective: form.objective, researchType: form.researchType })} disabled={!form.title || generateSummary.isPending}>
                  <Sparkles size={11} /> AI Generate
                </Button>
              </div>
              <Textarea rows={3} value={form.keyFindings} onChange={e => setForm(f => ({ ...f, keyFindings: e.target.value }))} placeholder="Key research findings..." />
            </div>
            <Button className="w-full" style={{ background: "#3A97D3" }} onClick={() => upsert.mutate({ ...form, id: editing ?? undefined, ventureId, researchType: form.researchType as "business" | "technical" | "applied", status: form.status as "planned" | "active" | "completed" | "published" | "paused", trlImpact: form.trlImpact ? parseInt(form.trlImpact) : undefined })} disabled={!form.title || upsert.isPending}>
              {editing ? "Update" : "Add"} Research
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Talent Tab ─────────────────────────────────────────────────────────────────
function TalentTab({ ventureId }: { ventureId: VentureId }) {
  const utils = trpc.useUtils();
  const { data: talent } = trpc.uniTalent.list.useQuery({ ventureId });
  const upsert = trpc.uniTalent.upsert.useMutation({ onSuccess: () => { utils.uniTalent.list.invalidate(); toast.success("Saved"); setOpen(false); } });
  const del = trpc.uniTalent.delete.useMutation({ onSuccess: () => { utils.uniTalent.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", roleType: "student", institution: "", skills: "", availability: "part_time", assignedProject: "", stipend: "", status: "active", notes: "" });

  const ROLE_COLORS: Record<string, string> = { student: "#3A97D3", academic: "#51AF37", industry_expert: "#F49C13", venture_lead: "#8B5CF6" };
  const ROLE_ICONS: Record<string, typeof Users> = { student: GraduationCap, academic: BookOpen, industry_expert: Building2, venture_lead: Lightbulb };

  function openNew() { setEditing(null); setForm({ name: "", roleType: "student", institution: "", skills: "", availability: "part_time", assignedProject: "", stipend: "", status: "active", notes: "" }); setOpen(true); }
  function openEdit(t: NonNullable<typeof talent>[number]) {
    setEditing(t.id);
    setForm({ name: t.name, roleType: t.roleType, institution: t.institution ?? "", skills: t.skills ?? "", availability: t.availability ?? "part_time", assignedProject: t.assignedProject ?? "", stipend: String(t.stipend ?? ""), status: t.status, notes: t.notes ?? "" });
    setOpen(true);
  }

  const grouped = (talent ?? []).reduce((acc, t) => {
    if (!acc[t.roleType]) acc[t.roleType] = [];
    acc[t.roleType].push(t);
    return acc;
  }, {} as Record<string, typeof talent extends (infer T)[] | undefined ? T[] : never[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Talent Network</h3>
          <p className="text-xs text-gray-400">Students, academics, industry experts, and venture leads</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#51AF37" }}>
          <Plus size={13} /> Add Talent
        </Button>
      </div>

      {/* Role summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[["student", "Students"], ["academic", "Academics"], ["industry_expert", "Industry Experts"], ["venture_lead", "Venture Leads"]].map(([type, label]) => {
          const Icon = ROLE_ICONS[type] || Users;
          const count = (talent ?? []).filter(t => t.roleType === type).length;
          const color = ROLE_COLORS[type];
          return (
            <div key={type} className="rounded-xl p-3 border text-center" style={{ background: `${color}08`, borderColor: `${color}25` }}>
              <Icon size={18} className="mx-auto mb-1" style={{ color }} />
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-xl font-bold" style={{ color }}>{count}</p>
            </div>
          );
        })}
      </div>

      {!talent?.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">No talent enrolled yet.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([roleType, members]) => {
            const color = ROLE_COLORS[roleType] || "#6b7280";
            const Icon = ROLE_ICONS[roleType] || Users;
            return (
              <div key={roleType}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} style={{ color }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{roleType.replace(/_/g, " ")}</span>
                  <span className="text-xs text-gray-400">({members.length})</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {members.map(t => (
                    <Card key={t.id} className="border shadow-sm" style={{ borderLeft: `3px solid ${color}` }}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                            {t.institution && <p className="text-xs text-gray-400">{t.institution}</p>}
                            {t.assignedProject && <p className="text-xs text-gray-500 mt-0.5">→ {t.assignedProject}</p>}
                            <div className="flex gap-2 mt-1">
                              <StatusBadge status={t.status} />
                              {t.availability && <span className="text-xs text-gray-400">{t.availability.replace(/_/g, " ")}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(t)}><Pencil size={11} /></Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => del.mutate({ id: t.id })}><Trash2 size={11} /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Talent</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Role Type</Label>
                <Select value={form.roleType} onValueChange={v => setForm(f => ({ ...f, roleType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="industry_expert">Industry Expert</SelectItem>
                    <SelectItem value="venture_lead">Venture Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Availability</Label>
                <Select value={form.availability} onValueChange={v => setForm(f => ({ ...f, availability: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="advisory">Advisory</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Institution</Label><Input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} /></div>
            <div><Label>Skills (comma-separated)</Label><Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} /></div>
            <div><Label>Assigned Project</Label><Input value={form.assignedProject} onChange={e => setForm(f => ({ ...f, assignedProject: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Stipend (£/month)</Label><Input type="number" value={form.stipend} onChange={e => setForm(f => ({ ...f, stipend: e.target.value }))} /></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["active", "inactive", "onboarding", "completed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" style={{ background: "#51AF37" }} onClick={() => upsert.mutate({ ...form, id: editing ?? undefined, ventureId, roleType: form.roleType as "student" | "academic" | "industry_expert" | "venture_lead", availability: form.availability as "full_time" | "part_time" | "advisory" | "internship", status: form.status as "active" | "inactive" | "onboarding" | "completed", stipend: form.stipend || undefined })} disabled={!form.name || upsert.isPending}>
              {editing ? "Update" : "Add"} Talent
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Venture Workflow Tab ───────────────────────────────────────────────────────
function VentureWorkflowTab({ ventureId }: { ventureId: VentureId }) {
  const utils = trpc.useUtils();
  const { data: workflows } = trpc.uniWorkflow.list.useQuery({ ventureId });
  const upsert = trpc.uniWorkflow.upsert.useMutation({ onSuccess: () => { utils.uniWorkflow.list.invalidate(); toast.success("Saved"); setOpen(false); } });
  const advance = trpc.uniWorkflow.advanceStage.useMutation({ onSuccess: () => { utils.uniWorkflow.list.invalidate(); toast.success("Stage advanced"); } });
  const del = trpc.uniWorkflow.delete.useMutation({ onSuccess: () => { utils.uniWorkflow.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ projectName: "", stage: "problem_definition", problemStatement: "", researchFindings: "", hypothesis: "", validationMethod: "", validationResult: "", commercialisationPlan: "", notes: "" });

  const STAGES = [
    { id: "problem_definition", label: "Problem Definition", color: "#3A97D3", icon: Lightbulb },
    { id: "research_discovery", label: "Research & Discovery", color: "#F49C13", icon: BookOpen },
    { id: "hypothesis_development", label: "Hypothesis Development", color: "#8B5CF6", icon: GitBranch },
    { id: "validation", label: "Validation", color: "#51AF37", icon: CheckCircle2 },
    { id: "commercialisation", label: "Commercialisation", color: "#EF4444", icon: TrendingUp },
  ];

  function openNew() { setEditing(null); setForm({ projectName: "", stage: "problem_definition", problemStatement: "", researchFindings: "", hypothesis: "", validationMethod: "", validationResult: "", commercialisationPlan: "", notes: "" }); setOpen(true); }
  function openEdit(w: NonNullable<typeof workflows>[number]) {
    setEditing(w.id);
    setForm({ projectName: w.projectName, stage: w.stage, problemStatement: w.problemStatement ?? "", researchFindings: w.researchFindings ?? "", hypothesis: w.hypothesis ?? "", validationMethod: w.validationMethod ?? "", validationResult: w.validationResult ?? "", commercialisationPlan: w.commercialisationPlan ?? "", notes: w.notes ?? "" });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Venture Workflow</h3>
          <p className="text-xs text-gray-400">5-stage problem-to-commercialisation pipeline</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#8B5CF6" }}>
          <Plus size={13} /> Add Project
        </Button>
      </div>

      {/* Stage pipeline header */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {STAGES.map((stage, i) => {
          const count = (workflows ?? []).filter(w => w.stage === stage.id).length;
          return (
            <div key={stage.id} className="flex items-center gap-1.5 flex-shrink-0">
              <div className="rounded-xl px-3 py-2 text-center min-w-[110px]" style={{ background: `${stage.color}12`, border: `1.5px solid ${stage.color}30` }}>
                <p className="text-xs font-bold" style={{ color: stage.color }}>{stage.label}</p>
                <p className="text-xs text-gray-400">{count} project{count !== 1 ? "s" : ""}</p>
              </div>
              {i < STAGES.length - 1 && <ArrowRight size={12} className="text-gray-300" />}
            </div>
          );
        })}
      </div>

      {!workflows?.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">No venture projects yet.</div>
      ) : (
        <div className="space-y-3">
          {workflows.map(w => {
            const stageInfo = STAGES.find(s => s.id === w.stage);
            const stageIdx = STAGES.findIndex(s => s.id === w.stage);
            return (
              <Card key={w.id} className="border shadow-sm" style={{ borderLeft: `4px solid ${stageInfo?.color}` }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-gray-900">{w.projectName}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${stageInfo?.color}15`, color: stageInfo?.color }}>{stageInfo?.label}</span>
                        {w.stageGatePassed && <CheckCircle2 size={13} className="text-green-500" />}
                      </div>
                      {w.problemStatement && <p className="text-xs text-gray-500 mb-1">{w.problemStatement.slice(0, 100)}{w.problemStatement.length > 100 ? "…" : ""}</p>}
                      {w.hypothesis && <p className="text-xs text-gray-400 italic">Hypothesis: {w.hypothesis.slice(0, 80)}…</p>}
                      {w.validationResult && (
                        <div className="mt-1"><StatusBadge status={w.validationResult} /></div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-3">
                      {stageIdx < STAGES.length - 1 && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => advance.mutate({ id: w.id })}>
                          Advance <ChevronRight size={11} />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(w)}><Pencil size={12} /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => del.mutate({ id: w.id })}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Venture Project</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Project Name</Label><Input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} /></div>
            <div><Label>Stage</Label>
              <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Problem Statement</Label><Textarea rows={2} value={form.problemStatement} onChange={e => setForm(f => ({ ...f, problemStatement: e.target.value }))} /></div>
            <div><Label>Research Findings</Label><Textarea rows={2} value={form.researchFindings} onChange={e => setForm(f => ({ ...f, researchFindings: e.target.value }))} /></div>
            <div><Label>Hypothesis</Label><Textarea rows={2} value={form.hypothesis} onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Validation Method</Label><Input value={form.validationMethod} onChange={e => setForm(f => ({ ...f, validationMethod: e.target.value }))} /></div>
              <div><Label>Validation Result</Label>
                <Select value={form.validationResult || ""} onValueChange={v => setForm(f => ({ ...f, validationResult: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="refuted">Refuted</SelectItem>
                    <SelectItem value="inconclusive">Inconclusive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Commercialisation Plan</Label><Textarea rows={2} value={form.commercialisationPlan} onChange={e => setForm(f => ({ ...f, commercialisationPlan: e.target.value }))} /></div>
            <Button className="w-full" style={{ background: "#8B5CF6" }} onClick={() => upsert.mutate({ ...form, id: editing ?? undefined, ventureId, stage: form.stage as "problem_definition" | "research_discovery" | "hypothesis_development" | "validation" | "commercialisation", validationResult: (form.validationResult as "confirmed" | "refuted" | "inconclusive" | "pending") || undefined })} disabled={!form.projectName || upsert.isPending}>
              {editing ? "Update" : "Add"} Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Industry Engagement Tab ────────────────────────────────────────────────────
function IndustryTab({ ventureId }: { ventureId: VentureId }) {
  const utils = trpc.useUtils();
  const { data: engagements } = trpc.uniIndustry.list.useQuery({ ventureId });
  const upsert = trpc.uniIndustry.upsert.useMutation({ onSuccess: () => { utils.uniIndustry.list.invalidate(); toast.success("Saved"); setOpen(false); } });
  const del = trpc.uniIndustry.delete.useMutation({ onSuccess: () => { utils.uniIndustry.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ companyName: "", engagementType: "sponsored_research", description: "", contactName: "", contactEmail: "", value: "", status: "active", deliverables: "", notes: "" });

  const TYPE_COLORS: Record<string, string> = { sponsored_research: "#3A97D3", consulting: "#51AF37", venture_partnership: "#8B5CF6", internship_pipeline: "#F49C13", joint_ip: "#EF4444" };

  function openNew() { setEditing(null); setForm({ companyName: "", engagementType: "sponsored_research", description: "", contactName: "", contactEmail: "", value: "", status: "active", deliverables: "", notes: "" }); setOpen(true); }
  function openEdit(e: NonNullable<typeof engagements>[number]) {
    setEditing(e.id);
    setForm({ companyName: e.companyName, engagementType: e.engagementType, description: e.description ?? "", contactName: e.contactName ?? "", contactEmail: e.contactEmail ?? "", value: String(e.value ?? ""), status: e.status, deliverables: e.deliverables ?? "", notes: e.notes ?? "" });
    setOpen(true);
  }

  const totalValue = (engagements ?? []).reduce((sum, e) => sum + (parseFloat(String(e.value ?? "0")) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Industry Engagements</h3>
          <p className="text-xs text-gray-400">Sponsored research, consulting, partnerships, internships</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#F49C13" }}>
          <Plus size={13} /> Add Engagement
        </Button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[["sponsored_research", "Sponsored Research"], ["consulting", "Consulting"], ["venture_partnership", "Partnerships"], ["internship_pipeline", "Internships"]].map(([type, label]) => {
          const count = (engagements ?? []).filter(e => e.engagementType === type).length;
          const color = TYPE_COLORS[type];
          return (
            <div key={type} className="rounded-xl p-3 border text-center" style={{ background: `${color}08`, borderColor: `${color}25` }}>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-xl font-bold" style={{ color }}>{count}</p>
            </div>
          );
        })}
      </div>
      {totalValue > 0 && (
        <div className="text-sm text-gray-500">Total engagement value: <strong className="text-gray-900">£{totalValue.toLocaleString()}</strong></div>
      )}

      {!engagements?.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">No industry engagements yet.</div>
      ) : (
        <div className="space-y-3">
          {engagements.map(e => (
            <Card key={e.id} className="border shadow-sm" style={{ borderLeft: `4px solid ${TYPE_COLORS[e.engagementType] || "#e5e7eb"}` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-gray-900">{e.companyName}</p>
                      <StatusBadge status={e.status} />
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${TYPE_COLORS[e.engagementType]}15`, color: TYPE_COLORS[e.engagementType] }}>
                        {e.engagementType.replace(/_/g, " ")}
                      </span>
                    </div>
                    {e.description && <p className="text-xs text-gray-500">{e.description.slice(0, 100)}</p>}
                    <div className="flex gap-4 text-xs text-gray-400 mt-1">
                      {e.contactName && <span>Contact: {e.contactName}</span>}
                      {e.value && <span>Value: £{Number(e.value).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(e)}><Pencil size={12} /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => del.mutate({ id: e.id })}><Trash2 size={12} /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Industry Engagement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Company Name</Label><Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.engagementType} onValueChange={v => setForm(f => ({ ...f, engagementType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sponsored_research">Sponsored Research</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="venture_partnership">Venture Partnership</SelectItem>
                    <SelectItem value="internship_pipeline">Internship Pipeline</SelectItem>
                    <SelectItem value="joint_ip">Joint IP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["active", "completed", "negotiating", "paused", "cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contact Name</Label><Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
              <div><Label>Value (£)</Label><Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>
            </div>
            <div><Label>Deliverables</Label><Textarea rows={2} value={form.deliverables} onChange={e => setForm(f => ({ ...f, deliverables: e.target.value }))} /></div>
            <Button className="w-full" style={{ background: "#F49C13" }} onClick={() => upsert.mutate({ ...form, id: editing ?? undefined, ventureId, engagementType: form.engagementType as "sponsored_research" | "consulting" | "venture_partnership" | "internship_pipeline" | "joint_ip", status: form.status as "active" | "completed" | "negotiating" | "paused" | "cancelled", value: form.value || undefined })} disabled={!form.companyName || upsert.isPending}>
              {editing ? "Update" : "Add"} Engagement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Governance Tab ─────────────────────────────────────────────────────────────
function GovernanceTab({ ventureId }: { ventureId: VentureId }) {
  const utils = trpc.useUtils();
  const { data: docs } = trpc.uniGovernance.list.useQuery({ ventureId });
  const upsert = trpc.uniGovernance.upsert.useMutation({ onSuccess: () => { utils.uniGovernance.list.invalidate(); toast.success("Saved"); setOpen(false); } });
  const del = trpc.uniGovernance.delete.useMutation({ onSuccess: () => { utils.uniGovernance.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ docType: "student_agreement", title: "", parties: "", status: "draft", documentUrl: "", notes: "" });

  const DOC_COLORS: Record<string, string> = { student_agreement: "#3A97D3", ip_agreement: "#8B5CF6", nda: "#EF4444", ethics_approval: "#51AF37", data_protection: "#F49C13", collaboration_agreement: "#6b7280" };
  const DOC_ICONS: Record<string, typeof FileText> = { student_agreement: GraduationCap, ip_agreement: Shield, nda: FileText, ethics_approval: CheckCircle2, data_protection: Database, collaboration_agreement: Building2 };

  function openNew() { setEditing(null); setForm({ docType: "student_agreement", title: "", parties: "", status: "draft", documentUrl: "", notes: "" }); setOpen(true); }
  function openEdit(d: NonNullable<typeof docs>[number]) {
    setEditing(d.id);
    setForm({ docType: d.docType, title: d.title, parties: d.parties ?? "", status: d.status, documentUrl: d.documentUrl ?? "", notes: d.notes ?? "" });
    setOpen(true);
  }

  const grouped = (docs ?? []).reduce((acc, d) => {
    if (!acc[d.docType]) acc[d.docType] = [];
    acc[d.docType].push(d);
    return acc;
  }, {} as Record<string, NonNullable<typeof docs>>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Governance Documents</h3>
          <p className="text-xs text-gray-400">Student agreements, IP agreements, NDAs, ethics approvals</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#8B5CF6" }}>
          <Plus size={13} /> Add Document
        </Button>
      </div>

      {/* Doc type summary */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        {[["student_agreement", "Student"], ["ip_agreement", "IP"], ["nda", "NDA"], ["ethics_approval", "Ethics"], ["data_protection", "Data"], ["collaboration_agreement", "Collab"]].map(([type, label]) => {
          const count = (docs ?? []).filter(d => d.docType === type).length;
          const signed = (docs ?? []).filter(d => d.docType === type && d.status === "signed").length;
          const color = DOC_COLORS[type];
          const Icon = DOC_ICONS[type] || FileText;
          return (
            <div key={type} className="rounded-xl p-2 border text-center" style={{ background: `${color}08`, borderColor: `${color}25` }}>
              <Icon size={14} className="mx-auto mb-0.5" style={{ color }} />
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-bold" style={{ color }}>{signed}/{count}</p>
            </div>
          );
        })}
      </div>

      {!docs?.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">No governance documents yet.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([docType, items]) => {
            const color = DOC_COLORS[docType] || "#6b7280";
            const Icon = DOC_ICONS[docType] || FileText;
            return (
              <div key={docType}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} style={{ color }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{docType.replace(/_/g, " ")}</span>
                </div>
                <div className="space-y-2">
                  {items.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderLeft: `3px solid ${color}` }}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{d.title}</p>
                        {d.parties && <p className="text-xs text-gray-400">Parties: {d.parties}</p>}
                        <div className="flex gap-2 mt-0.5">
                          <StatusBadge status={d.status} />
                          {d.expiryDate && <span className="text-xs text-gray-400">Expires: {new Date(d.expiryDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(d)}><Pencil size={11} /></Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => del.mutate({ id: d.id })}><Trash2 size={11} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Governance Document</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Document Type</Label>
              <Select value={form.docType} onValueChange={v => setForm(f => ({ ...f, docType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student_agreement">Student Agreement</SelectItem>
                  <SelectItem value="ip_agreement">IP Agreement</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="ethics_approval">Ethics Approval</SelectItem>
                  <SelectItem value="data_protection">Data Protection</SelectItem>
                  <SelectItem value="collaboration_agreement">Collaboration Agreement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Parties (comma-separated)</Label><Input value={form.parties} onChange={e => setForm(f => ({ ...f, parties: e.target.value }))} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["draft", "under_review", "signed", "expired", "rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Document URL</Label><Input value={form.documentUrl} onChange={e => setForm(f => ({ ...f, documentUrl: e.target.value }))} placeholder="https://..." /></div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button className="w-full" style={{ background: "#8B5CF6" }} onClick={() => upsert.mutate({ ...form, id: editing ?? undefined, ventureId, docType: form.docType as "student_agreement" | "ip_agreement" | "nda" | "ethics_approval" | "data_protection" | "collaboration_agreement", status: form.status as "draft" | "under_review" | "signed" | "expired" | "rejected" })} disabled={!form.title || upsert.isPending}>
              {editing ? "Update" : "Add"} Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Data Strategy Tab ──────────────────────────────────────────────────────────
function DataStrategyTab({ ventureId }: { ventureId: VentureId }) {
  const utils = trpc.useUtils();
  const { data: sources } = trpc.uniData.list.useQuery({ ventureId });
  const upsert = trpc.uniData.upsert.useMutation({ onSuccess: () => { utils.uniData.list.invalidate(); toast.success("Saved"); setOpen(false); } });
  const analyse = trpc.uniData.analyseWithAI.useMutation({ onSuccess: () => { utils.uniData.list.invalidate(); toast.success("AI analysis complete"); } });
  const del = trpc.uniData.delete.useMutation({ onSuccess: () => { utils.uniData.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ sourceType: "interview", title: "", description: "", sampleSize: "", collectionMethod: "", status: "planned", keyInsights: "", linkedHypothesis: "" });

  const TYPE_COLORS: Record<string, string> = { interview: "#3A97D3", survey: "#51AF37", secondary_research: "#F49C13", ai_analysis: "#8B5CF6", focus_group: "#EF4444", observation: "#6b7280" };
  const TYPE_ICONS: Record<string, typeof Users> = { interview: Users, survey: FileText, secondary_research: BookOpen, ai_analysis: Sparkles, focus_group: Users, observation: Globe };

  function openNew() { setEditing(null); setForm({ sourceType: "interview", title: "", description: "", sampleSize: "", collectionMethod: "", status: "planned", keyInsights: "", linkedHypothesis: "" }); setOpen(true); }
  function openEdit(s: NonNullable<typeof sources>[number]) {
    setEditing(s.id);
    setForm({ sourceType: s.sourceType, title: s.title, description: s.description ?? "", sampleSize: String(s.sampleSize ?? ""), collectionMethod: s.collectionMethod ?? "", status: s.status, keyInsights: s.keyInsights ?? "", linkedHypothesis: s.linkedHypothesis ?? "" });
    setOpen(true);
  }

  const byType = (sources ?? []).reduce((acc, s) => { acc[s.sourceType] = (acc[s.sourceType] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Data Strategy</h3>
          <p className="text-xs text-gray-400">Hybrid model: interviews, surveys, secondary research, AI analysis</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#3A97D3" }}>
          <Plus size={13} /> Add Source
        </Button>
      </div>

      {/* Type breakdown */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        {[["interview", "Interviews"], ["survey", "Surveys"], ["secondary_research", "Secondary"], ["ai_analysis", "AI Analysis"], ["focus_group", "Focus Groups"], ["observation", "Observation"]].map(([type, label]) => {
          const count = byType[type] || 0;
          const color = TYPE_COLORS[type];
          const Icon = TYPE_ICONS[type] || Database;
          return (
            <div key={type} className="rounded-xl p-2 border text-center" style={{ background: `${color}08`, borderColor: `${color}25` }}>
              <Icon size={14} className="mx-auto mb-0.5" style={{ color }} />
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-bold" style={{ color }}>{count}</p>
            </div>
          );
        })}
      </div>

      {!sources?.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">No data sources yet.</div>
      ) : (
        <div className="space-y-3">
          {sources.map(s => {
            const color = TYPE_COLORS[s.sourceType] || "#6b7280";
            const Icon = TYPE_ICONS[s.sourceType] || Database;
            return (
              <Card key={s.id} className="border shadow-sm" style={{ borderLeft: `4px solid ${color}` }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={13} style={{ color }} />
                        <p className="font-semibold text-sm text-gray-900">{s.title}</p>
                        <StatusBadge status={s.status} />
                        {s.aiAnalysisDone && <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5"><Sparkles size={10} /> AI</span>}
                      </div>
                      {s.description && <p className="text-xs text-gray-500">{s.description.slice(0, 100)}</p>}
                      <div className="flex gap-4 text-xs text-gray-400 mt-1">
                        {s.sampleSize && <span>n={s.sampleSize}</span>}
                        {s.linkedHypothesis && <span>Hypothesis: {s.linkedHypothesis}</span>}
                      </div>
                      {s.aiSummary && (
                        <div className="mt-2 p-2 rounded-lg text-xs text-purple-700 bg-purple-50 border border-purple-100">
                          <Sparkles size={10} className="inline mr-1" />{s.aiSummary.slice(0, 150)}…
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-3">
                      {!s.aiAnalysisDone && s.status !== "planned" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => analyse.mutate({ id: s.id, title: s.title, description: s.description ?? "", sourceType: s.sourceType, keyInsights: s.keyInsights ?? undefined })} disabled={analyse.isPending}>
                          <Sparkles size={11} /> Analyse
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(s)}><Pencil size={12} /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => del.mutate({ id: s.id })}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Data Source</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Source Type</Label>
                <Select value={form.sourceType} onValueChange={v => setForm(f => ({ ...f, sourceType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                    <SelectItem value="secondary_research">Secondary Research</SelectItem>
                    <SelectItem value="ai_analysis">AI Analysis</SelectItem>
                    <SelectItem value="focus_group">Focus Group</SelectItem>
                    <SelectItem value="observation">Observation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["planned", "in_progress", "completed", "analysed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sample Size</Label><Input type="number" value={form.sampleSize} onChange={e => setForm(f => ({ ...f, sampleSize: e.target.value }))} /></div>
              <div><Label>Collection Method</Label><Input value={form.collectionMethod} onChange={e => setForm(f => ({ ...f, collectionMethod: e.target.value }))} /></div>
            </div>
            <div><Label>Linked Hypothesis</Label><Input value={form.linkedHypothesis} onChange={e => setForm(f => ({ ...f, linkedHypothesis: e.target.value }))} /></div>
            <div><Label>Key Insights</Label><Textarea rows={2} value={form.keyInsights} onChange={e => setForm(f => ({ ...f, keyInsights: e.target.value }))} /></div>
            <Button className="w-full" style={{ background: "#3A97D3" }} onClick={() => upsert.mutate({ ...form, id: editing ?? undefined, ventureId, sourceType: form.sourceType as "interview" | "survey" | "secondary_research" | "ai_analysis" | "focus_group" | "observation", status: form.status as "planned" | "in_progress" | "completed" | "analysed", sampleSize: form.sampleSize ? parseInt(form.sampleSize) : undefined })} disabled={!form.title || upsert.isPending}>
              {editing ? "Update" : "Add"} Source
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Roadmap Tab ────────────────────────────────────────────────────────────────
function RoadmapTab({ ventureId }: { ventureId: VentureId }) {
  const utils = trpc.useUtils();
  const { data: milestones } = trpc.uniRoadmap.list.useQuery({ ventureId });
  const upsert = trpc.uniRoadmap.upsert.useMutation({ onSuccess: () => { utils.uniRoadmap.list.invalidate(); toast.success("Saved"); setOpen(false); } });
  const complete = trpc.uniRoadmap.complete.useMutation({ onSuccess: () => { utils.uniRoadmap.list.invalidate(); toast.success("Milestone completed"); } });
  const del = trpc.uniRoadmap.delete.useMutation({ onSuccess: () => { utils.uniRoadmap.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ phase: "setup", title: "", description: "", owner: "", status: "pending", priority: "medium", notes: "" });

  const PHASES = [
    { id: "setup", label: "Phase 1: Setup (0–3 months)", color: "#3A97D3", description: "Infrastructure, agreements, partner onboarding" },
    { id: "pilot", label: "Phase 2: Pilot (3–6 months)", color: "#F49C13", description: "First ventures, initial research, talent deployment" },
    { id: "scale", label: "Phase 3: Scale (6–12 months)", color: "#51AF37", description: "Multiple ventures, industry partnerships, commercialisation" },
  ];

  function openNew() { setEditing(null); setForm({ phase: "setup", title: "", description: "", owner: "", status: "pending", priority: "medium", notes: "" }); setOpen(true); }
  function openEdit(m: NonNullable<typeof milestones>[number]) {
    setEditing(m.id);
    setForm({ phase: m.phase, title: m.title, description: m.description ?? "", owner: m.owner ?? "", status: m.status, priority: m.priority, notes: m.notes ?? "" });
    setOpen(true);
  }

  const grouped = (milestones ?? []).reduce((acc, m) => {
    if (!acc[m.phase]) acc[m.phase] = [];
    acc[m.phase].push(m);
    return acc;
  }, {} as Record<string, NonNullable<typeof milestones>>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Implementation Roadmap</h3>
          <p className="text-xs text-gray-400">3-phase university venture creation rollout</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#51AF37" }}>
          <Plus size={13} /> Add Milestone
        </Button>
      </div>

      {/* Phase overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PHASES.map(phase => {
          const items = grouped[phase.id] ?? [];
          const done = items.filter(m => m.status === "completed").length;
          const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
          return (
            <div key={phase.id} className="rounded-xl p-4 border" style={{ background: `${phase.color}08`, borderColor: `${phase.color}30` }}>
              <p className="text-sm font-bold mb-0.5" style={{ color: phase.color }}>{phase.label}</p>
              <p className="text-xs text-gray-400 mb-3">{phase.description}</p>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{done}/{items.length} milestones</span>
                <span className="text-xs font-bold" style={{ color: phase.color }}>{pct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: phase.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {!milestones?.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">No milestones yet.</div>
      ) : (
        <div className="space-y-6">
          {PHASES.map(phase => {
            const items = grouped[phase.id] ?? [];
            if (!items.length) return null;
            return (
              <div key={phase.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: phase.color }} />
                  <span className="text-sm font-bold text-gray-900">{phase.label}</span>
                </div>
                <div className="space-y-2">
                  {items.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderLeft: `3px solid ${phase.color}`, opacity: m.status === "cancelled" ? 0.5 : 1 }}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => m.status !== "completed" && complete.mutate({ id: m.id })} className="flex-shrink-0">
                          {m.status === "completed" ? <CheckCircle2 size={16} className="text-green-500" /> : <Clock size={16} className="text-gray-300" />}
                        </button>
                        <div>
                          <p className={`text-sm font-semibold ${m.status === "completed" ? "line-through text-gray-400" : "text-gray-900"}`}>{m.title}</p>
                          {m.owner && <p className="text-xs text-gray-400">Owner: {m.owner}</p>}
                          {m.targetDate && <p className="text-xs text-gray-400">Target: {new Date(m.targetDate).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={m.priority} />
                        <StatusBadge status={m.status} />
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(m)}><Pencil size={11} /></Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => del.mutate({ id: m.id })}><Trash2 size={11} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Milestone</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phase</Label>
                <Select value={form.phase} onValueChange={v => setForm(f => ({ ...f, phase: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="setup">Setup (0–3m)</SelectItem>
                    <SelectItem value="pilot">Pilot (3–6m)</SelectItem>
                    <SelectItem value="scale">Scale (6–12m)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Owner</Label><Input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} /></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending", "in_progress", "completed", "delayed", "cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" style={{ background: "#51AF37" }} onClick={() => upsert.mutate({ ...form, id: editing ?? undefined, ventureId, phase: form.phase as "setup" | "pilot" | "scale", priority: form.priority as "low" | "medium" | "high" | "critical", status: form.status as "pending" | "in_progress" | "completed" | "delayed" | "cancelled" })} disabled={!form.title || upsert.isPending}>
              {editing ? "Update" : "Add"} Milestone
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Partners Tab ───────────────────────────────────────────────────────────────
function PartnersTab({ ventureId }: { ventureId: VentureId }) {
  const utils = trpc.useUtils();
  const { data: partners } = trpc.uniPartners.list.useQuery({ ventureId });
  const upsert = trpc.uniPartners.upsert.useMutation({ onSuccess: () => { utils.uniPartners.list.invalidate(); toast.success("Saved"); setOpen(false); } });
  const del = trpc.uniPartners.delete.useMutation({ onSuccess: () => { utils.uniPartners.list.invalidate(); toast.success("Deleted"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", type: "university", country: "", department: "", contactName: "", contactEmail: "", partnershipType: "research", status: "active", notes: "" });

  const TYPE_COLORS: Record<string, string> = { university: "#3A97D3", research_institute: "#51AF37", polytechnic: "#F49C13", industry_lab: "#8B5CF6" };

  function openNew() { setEditing(null); setForm({ name: "", type: "university", country: "", department: "", contactName: "", contactEmail: "", partnershipType: "research", status: "active", notes: "" }); setOpen(true); }
  function openEdit(p: NonNullable<typeof partners>[number]) {
    setEditing(p.id);
    setForm({ name: p.name, type: p.type, country: p.country ?? "", department: p.department ?? "", contactName: p.contactName ?? "", contactEmail: p.contactEmail ?? "", partnershipType: p.partnershipType, status: p.status, notes: p.notes ?? "" });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">University Partners</h3>
          <p className="text-xs text-gray-400">Universities, research institutes, and industry labs</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#3A97D3" }}>
          <Plus size={13} /> Add Partner
        </Button>
      </div>

      {!partners?.length ? (
        <div className="text-center py-12 text-gray-400 text-sm">No partners yet.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {partners.map(p => {
            const color = TYPE_COLORS[p.type] || "#6b7280";
            return (
              <Card key={p.id} className="border shadow-sm" style={{ borderLeft: `4px solid ${color}` }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                        <StatusBadge status={p.status} />
                      </div>
                      {p.department && <p className="text-xs text-gray-400">{p.department}</p>}
                      {p.country && <p className="text-xs text-gray-400">{p.country}</p>}
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}15`, color }}>{p.type.replace(/_/g, " ")}</span>
                        <span className="text-xs text-gray-400">{p.partnershipType.replace(/_/g, " ")}</span>
                      </div>
                      {p.contactName && <p className="text-xs text-gray-400 mt-1">Contact: {p.contactName}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(p)}><Pencil size={12} /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => del.mutate({ id: p.id })}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Partner</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Institution Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="research_institute">Research Institute</SelectItem>
                    <SelectItem value="polytechnic">Polytechnic</SelectItem>
                    <SelectItem value="industry_lab">Industry Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Partnership Type</Label>
                <Select value={form.partnershipType} onValueChange={v => setForm(f => ({ ...f, partnershipType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="talent">Talent</SelectItem>
                    <SelectItem value="commercialisation">Commercialisation</SelectItem>
                    <SelectItem value="sponsored">Sponsored</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Country</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
              <div><Label>Department</Label><Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contact Name</Label><Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
              <div><Label>Contact Email</Label><Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["active", "inactive", "pending", "negotiating"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" style={{ background: "#3A97D3" }} onClick={() => upsert.mutate({ ...form, id: editing ?? undefined, ventureId, type: form.type as "university" | "research_institute" | "polytechnic" | "industry_lab", partnershipType: form.partnershipType as "research" | "talent" | "commercialisation" | "sponsored" | "internship", status: form.status as "active" | "inactive" | "pending" | "negotiating" })} disabled={!form.name || upsert.isPending}>
              {editing ? "Update" : "Add"} Partner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function UniversityPlaybook() {
  const { ventures } = useVentures();
  const [ventureId, setVentureId] = useState(ventures[0]?.id ?? "ecoblend");
  const [activeTab, setActiveTab] = useState("overview");

  const TABS = [
    { id: "overview", label: "Overview", icon: GraduationCap },
    { id: "partners", label: "Partners", icon: Building2 },
    { id: "research", label: "Research", icon: BookOpen },
    { id: "talent", label: "Talent", icon: Users },
    { id: "workflow", label: "Venture Workflow", icon: GitBranch },
    { id: "industry", label: "Industry", icon: Globe },
    { id: "governance", label: "Governance", icon: Shield },
    { id: "data", label: "Data Strategy", icon: Database },
    { id: "roadmap", label: "Roadmap", icon: Map },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ background: "linear-gradient(135deg, #1a2332 0%, #2d3f5c 100%)" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3A97D320", color: "#3A97D3" }}>
                University Venture Creation
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              University Playbook
            </h1>
            <p className="text-sm text-gray-400 max-w-xl">
              University-led venture creation system — integrating research, students, and industry to manage business risk while founders manage product risk.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={ventureId} onValueChange={setVentureId}>
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ventures.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-gray-100 p-1 rounded-xl h-auto flex-wrap gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Icon size={13} />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewTab ventureId={ventureId} /></TabsContent>
          <TabsContent value="partners"><PartnersTab ventureId={ventureId} /></TabsContent>
          <TabsContent value="research"><ResearchTab ventureId={ventureId} /></TabsContent>
          <TabsContent value="talent"><TalentTab ventureId={ventureId} /></TabsContent>
          <TabsContent value="workflow"><VentureWorkflowTab ventureId={ventureId} /></TabsContent>
          <TabsContent value="industry"><IndustryTab ventureId={ventureId} /></TabsContent>
          <TabsContent value="governance"><GovernanceTab ventureId={ventureId} /></TabsContent>
          <TabsContent value="data"><DataStrategyTab ventureId={ventureId} /></TabsContent>
          <TabsContent value="roadmap"><RoadmapTab ventureId={ventureId} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
