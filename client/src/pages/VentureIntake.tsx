// ============================================================
// VENTURE INTAKE MODULE — Lean Startup Hypothesis Workflow
// Architecture Module 2 — Full Rebuild
// Sub-sections: Idea Capture, Assumptions, Hypotheses,
//               Riskiest Assumption, Lean Canvas, Intake Decision
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Rocket, Target, FlaskConical, AlertTriangle, CheckCircle2,
  Plus, Pencil, Trash2, ChevronRight, BarChart3, Lightbulb,
  FileText, Shield, BookOpen, TrendingUp, X, RefreshCw,
} from "lucide-react";

// ── Colour helpers ──────────────────────────────────────────
const RISK_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#7c3aed",
};

const STATUS_COLORS: Record<string, string> = {
  untested: "#6b7280",
  testing: "#3b82f6",
  validated: "#22c55e",
  invalidated: "#ef4444",
  pivot_required: "#f59e0b",
  paused: "#9ca3af",
};

const READINESS_COLOR = (score: number) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
};

const READINESS_LABEL = (score: number) => {
  if (score >= 80) return "Strong Intake Package";
  if (score >= 60) return "Ready for Initial Discovery";
  if (score >= 40) return "Needs More Definition";
  return "Not Ready";
};

// ── Shared sub-components ───────────────────────────────────

function ScoreCard({ label, score, warning, warningThreshold = 60 }: {
  label: string;
  score: number;
  warning?: string;
  warningThreshold?: number;
}) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="bg-white border rounded-xl p-4 flex flex-col gap-2" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
        <span className="text-2xl font-bold" style={{ color, fontFamily: "'Prompt', sans-serif" }}>{score}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
      {warning && score < warningThreshold && (
        <div className="flex items-start gap-1.5 mt-1 p-2 rounded-lg" style={{ background: "#fef3c7" }}>
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
          <span className="text-xs" style={{ color: "#92400e" }}>{warning}</span>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#f3f4f6" }}>
        <Icon size={24} style={{ color: "#9ca3af" }} />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}

function VentureSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: ventures = [] } = trpc.ventures.list.useQuery();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-56 h-8 text-xs">
        <SelectValue placeholder="Select venture…" />
      </SelectTrigger>
      <SelectContent>
        {(ventures as any[]).map((v: any) => (
          <SelectItem key={v.id} value={v.id} className="text-xs">{v.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Tab: Idea Capture ───────────────────────────────────────

function IdeaCaptureTab({ ventureId }: { ventureId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    ideaTitle: "", ideaSummary: "", originSource: "founder_idea",
    targetSector: "", targetCustomer: "", problemArea: "",
    proposedSolution: "", whyNow: "", strategicRelevance: "",
    sustainabilityRelevance: "", dataMoatPotential: "", founderNotes: "",
  });

  const { data: ideas = [], refetch } = trpc["ventureIntake"]["ideas.list"].useQuery(
    { ventureId },
    { enabled: !!ventureId }
  );

  const createMut = trpc["ventureIntake"]["ideas.create"].useMutation({
    onSuccess: () => { toast.success("Idea captured"); refetch(); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc["ventureIntake"]["ideas.update"].useMutation({
    onSuccess: () => { toast.success("Idea updated"); refetch(); setShowForm(false); setEditId(null); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc["ventureIntake"]["ideas.delete"].useMutation({
    onSuccess: () => { toast.success("Idea deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ ideaTitle: "", ideaSummary: "", originSource: "founder_idea", targetSector: "", targetCustomer: "", problemArea: "", proposedSolution: "", whyNow: "", strategicRelevance: "", sustainabilityRelevance: "", dataMoatPotential: "", founderNotes: "" });
  }

  function handleEdit(idea: any) {
    setEditId(idea.id);
    setForm({
      ideaTitle: idea.idea_title ?? "",
      ideaSummary: idea.idea_summary ?? "",
      originSource: idea.origin_source ?? "founder_idea",
      targetSector: idea.target_sector ?? "",
      targetCustomer: idea.target_customer ?? "",
      problemArea: idea.problem_area ?? "",
      proposedSolution: idea.proposed_solution ?? "",
      whyNow: idea.why_now ?? "",
      strategicRelevance: idea.strategic_relevance ?? "",
      sustainabilityRelevance: idea.sustainability_relevance ?? "",
      dataMoatPotential: idea.data_moat_potential ?? "",
      founderNotes: idea.founder_notes ?? "",
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.ideaTitle.trim()) { toast.error("Idea title is required"); return; }
    if (editId) {
      updateMut.mutate({ id: editId, ...form });
    } else {
      createMut.mutate({ ventureId, ...form });
    }
  }

  const ORIGIN_OPTIONS = [
    { value: "founder_idea", label: "Founder Idea" },
    { value: "customer_problem", label: "Customer Problem" },
    { value: "university_research", label: "University Research" },
    { value: "supplier_signal", label: "Supplier Signal" },
    { value: "market_signal", label: "Market Signal" },
    { value: "regulatory_signal", label: "Regulatory Signal" },
    { value: "portfolio_extension", label: "Portfolio Extension" },
    { value: "partner_request", label: "Partner Request" },
    { value: "operational_problem", label: "Operational Problem" },
  ];

  if (!ventureId) {
    return <EmptyState icon={Rocket} title="Select a venture" description="Choose a venture from the selector above to capture and manage ideas." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Idea Capture</h3>
          <p className="text-xs text-gray-400 mt-0.5">Define the venture concept before any assumptions are tested.</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" style={{ background: "#51AF37" }} onClick={() => { setShowForm(true); setEditId(null); resetForm(); }}>
          <Plus size={13} /> New Idea
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-5" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-800">{editId ? "Edit Idea" : "Capture New Idea"}</h4>
            <button onClick={() => { setShowForm(false); setEditId(null); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Idea Title *</label>
              <Input value={form.ideaTitle} onChange={e => setForm(f => ({ ...f, ideaTitle: e.target.value }))} placeholder="e.g. Reliability intelligence for zero-emission bus operators" className="text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Idea Summary</label>
              <Textarea value={form.ideaSummary} onChange={e => setForm(f => ({ ...f, ideaSummary: e.target.value }))} placeholder="Brief description of the venture concept…" className="text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Origin Source</label>
              <Select value={form.originSource} onValueChange={v => setForm(f => ({ ...f, originSource: v }))}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{ORIGIN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Target Sector</label>
              <Input value={form.targetSector} onChange={e => setForm(f => ({ ...f, targetSector: e.target.value }))} placeholder="e.g. Transport, Manufacturing…" className="text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Target Customer</label>
              <Input value={form.targetCustomer} onChange={e => setForm(f => ({ ...f, targetCustomer: e.target.value }))} placeholder="e.g. Engineering directors at bus operators" className="text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Problem Area</label>
              <Textarea value={form.problemArea} onChange={e => setForm(f => ({ ...f, problemArea: e.target.value }))} placeholder="What problem does this venture address?" className="text-sm" rows={2} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Proposed Solution</label>
              <Textarea value={form.proposedSolution} onChange={e => setForm(f => ({ ...f, proposedSolution: e.target.value }))} placeholder="Initial solution hypothesis (not validated yet)…" className="text-sm" rows={2} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Why Now?</label>
              <Textarea value={form.whyNow} onChange={e => setForm(f => ({ ...f, whyNow: e.target.value }))} placeholder="What market, regulatory, or technology conditions make this timely?" className="text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Strategic Relevance</label>
              <Textarea value={form.strategicRelevance} onChange={e => setForm(f => ({ ...f, strategicRelevance: e.target.value }))} placeholder="How does this fit the EcoBlend portfolio strategy?" className="text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Sustainability Relevance</label>
              <Textarea value={form.sustainabilityRelevance} onChange={e => setForm(f => ({ ...f, sustainabilityRelevance: e.target.value }))} placeholder="What is the sustainability angle?" className="text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Data Moat Potential</label>
              <Textarea value={form.dataMoatPotential} onChange={e => setForm(f => ({ ...f, dataMoatPotential: e.target.value }))} placeholder="What proprietary data could this venture generate?" className="text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Founder Notes</label>
              <Textarea value={form.founderNotes} onChange={e => setForm(f => ({ ...f, founderNotes: e.target.value }))} placeholder="Any additional context or notes…" className="text-sm" rows={2} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="text-xs h-8" style={{ background: "#51AF37" }} onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editId ? "Update Idea" : "Save Idea"}
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }}>Cancel</Button>
          </div>
        </div>
      )}

      {(ideas as any[]).length === 0 && !showForm ? (
        <EmptyState icon={Lightbulb} title="No ideas captured yet" description="Capture the venture concept before defining assumptions and hypotheses." />
      ) : (
        <div className="space-y-3">
          {(ideas as any[]).map((idea: any) => {
            const fields = [idea.idea_title, idea.idea_summary, idea.target_sector, idea.target_customer, idea.problem_area, idea.proposed_solution, idea.why_now];
            const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);
            return (
              <div key={idea.id} className="bg-white border rounded-xl p-5 group" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">{idea.idea_title}</span>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: "#51AF37", color: "#51AF37", background: "#51AF3710" }}>
                        {idea.origin_source?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {idea.idea_summary && <p className="text-xs text-gray-500 mb-2">{idea.idea_summary}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      {idea.target_sector && <span>Sector: <span className="text-gray-600">{idea.target_sector}</span></span>}
                      {idea.target_customer && <span>Customer: <span className="text-gray-600">{idea.target_customer}</span></span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right">
                      <div className="text-xs font-semibold" style={{ color: READINESS_COLOR(completeness) }}>{completeness}%</div>
                      <div className="text-xs text-gray-400">complete</div>
                    </div>
                    <button onClick={() => handleEdit(idea)} className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100">
                      <Pencil size={13} style={{ color: "#6b7280" }} />
                    </button>
                    <button onClick={() => { if (confirm("Delete this idea?")) deleteMut.mutate({ id: idea.id }); }} className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100">
                      <Trash2 size={13} style={{ color: "#ef4444" }} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
                  {idea.problem_area && (
                    <div><span className="text-xs font-semibold text-gray-400 block mb-0.5">Problem Area</span><p className="text-xs text-gray-600">{idea.problem_area}</p></div>
                  )}
                  {idea.why_now && (
                    <div><span className="text-xs font-semibold text-gray-400 block mb-0.5">Why Now</span><p className="text-xs text-gray-600">{idea.why_now}</p></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Founder Assumptions ────────────────────────────────

function FounderAssumptionsTab({ ventureId }: { ventureId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    assumptionTitle: "", assumptionStatement: "", assumptionCategory: "customer",
    importanceScore: 3, uncertaintyScore: 3, evidenceExists: false, evidenceSummary: "",
  });

  const { data: assumptions = [], refetch } = trpc["ventureIntake"]["assumptions.list"].useQuery(
    { ventureId },
    { enabled: !!ventureId }
  );
  const { data: summary } = trpc["ventureIntake"]["assumptions.summary"].useQuery(
    { ventureId },
    { enabled: !!ventureId }
  );

  const createMut = trpc["ventureIntake"]["assumptions.create"].useMutation({
    onSuccess: () => { toast.success("Assumption captured"); refetch(); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc["ventureIntake"]["assumptions.update"].useMutation({
    onSuccess: () => { toast.success("Assumption updated"); refetch(); setShowForm(false); setEditId(null); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc["ventureIntake"]["assumptions.delete"].useMutation({
    onSuccess: () => { toast.success("Assumption deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const convertMut = trpc["ventureIntake"]["assumptions.convertToHypothesis"].useMutation({
    onSuccess: () => { toast.success("Converted to hypothesis"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ assumptionTitle: "", assumptionStatement: "", assumptionCategory: "customer", importanceScore: 3, uncertaintyScore: 3, evidenceExists: false, evidenceSummary: "" });
  }

  function handleEdit(a: any) {
    setEditId(a.id);
    setForm({
      assumptionTitle: a.assumption_title ?? "",
      assumptionStatement: a.assumption_statement ?? "",
      assumptionCategory: a.assumption_category ?? "customer",
      importanceScore: a.importance_score ?? 3,
      uncertaintyScore: a.uncertainty_score ?? 3,
      evidenceExists: !!a.evidence_exists,
      evidenceSummary: a.evidence_summary ?? "",
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.assumptionTitle.trim() || !form.assumptionStatement.trim()) {
      toast.error("Title and statement are required"); return;
    }
    if (editId) {
      updateMut.mutate({ id: editId, ...form });
    } else {
      createMut.mutate({ ventureId, ...form });
    }
  }

  const CATEGORIES = [
    "customer", "problem", "value_proposition", "solution", "pricing",
    "channel", "technical", "manufacturing", "supply_chain", "sustainability",
    "regulatory", "data_access", "operations", "investment",
  ];

  if (!ventureId) {
    return <EmptyState icon={Shield} title="Select a venture" description="Choose a venture to capture and manage founder assumptions." />;
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white border rounded-xl p-4" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{(summary as any).total}</div>
          </div>
          <div className="bg-white border rounded-xl p-4" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">High Risk</div>
            <div className="text-2xl font-bold" style={{ color: "#ef4444", fontFamily: "'Prompt', sans-serif" }}>{(summary as any).high}</div>
          </div>
          <div className="bg-white border rounded-xl p-4" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Critical</div>
            <div className="text-2xl font-bold" style={{ color: "#7c3aed", fontFamily: "'Prompt', sans-serif" }}>{(summary as any).critical}</div>
          </div>
          <div className="bg-white border rounded-xl p-4" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">No Evidence</div>
            <div className="text-2xl font-bold" style={{ color: "#f59e0b", fontFamily: "'Prompt', sans-serif" }}>{(summary as any).noEvidence}</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Founder Assumptions</h3>
          <p className="text-xs text-gray-400 mt-0.5">Capture all founder beliefs as explicit assumptions. These are beliefs to be tested — not evidence.</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" style={{ background: "#51AF37" }} onClick={() => { setShowForm(true); setEditId(null); resetForm(); }}>
          <Plus size={13} /> Add Assumption
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-5" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-800">{editId ? "Edit Assumption" : "Add Founder Assumption"}</h4>
            <button onClick={() => { setShowForm(false); setEditId(null); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Assumption Title *</label>
              <Input value={form.assumptionTitle} onChange={e => setForm(f => ({ ...f, assumptionTitle: e.target.value }))} placeholder="Short label for this assumption" className="text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Assumption Statement *</label>
              <Textarea value={form.assumptionStatement} onChange={e => setForm(f => ({ ...f, assumptionStatement: e.target.value }))} placeholder="We believe that… [specific, testable statement]" className="text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
              <Select value={form.assumptionCategory} onValueChange={v => setForm(f => ({ ...f, assumptionCategory: v }))}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Importance (1–5)</label>
                <Input type="number" min={1} max={5} value={form.importanceScore} onChange={e => setForm(f => ({ ...f, importanceScore: Number(e.target.value) }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Uncertainty (1–5)</label>
                <Input type="number" min={1} max={5} value={form.uncertaintyScore} onChange={e => setForm(f => ({ ...f, uncertaintyScore: Number(e.target.value) }))} className="text-sm" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer">
                <input type="checkbox" checked={form.evidenceExists} onChange={e => setForm(f => ({ ...f, evidenceExists: e.target.checked }))} className="rounded" />
                Evidence exists for this assumption
              </label>
            </div>
            {form.evidenceExists && (
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Summary</label>
                <Textarea value={form.evidenceSummary} onChange={e => setForm(f => ({ ...f, evidenceSummary: e.target.value }))} placeholder="Describe the evidence that supports this assumption…" className="text-sm" rows={2} />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="text-xs h-8" style={{ background: "#51AF37" }} onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editId ? "Update" : "Save Assumption"}
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }}>Cancel</Button>
          </div>
        </div>
      )}

      {(assumptions as any[]).length === 0 && !showForm ? (
        <EmptyState icon={Shield} title="No assumptions captured yet" description="Capture all founder beliefs as explicit assumptions before defining hypotheses." />
      ) : (
        <div className="space-y-2">
          {(assumptions as any[]).map((a: any) => {
            const riskScore = a.importance_score * a.uncertainty_score;
            return (
              <div key={a.id} className="bg-white border rounded-xl p-4 group" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${RISK_COLORS[a.risk_level] ?? "#e5e7eb"}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{a.assumption_title}</span>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: RISK_COLORS[a.risk_level], color: RISK_COLORS[a.risk_level], background: `${RISK_COLORS[a.risk_level]}10` }}>
                        {a.risk_level} risk
                      </Badge>
                      <Badge variant="outline" className="text-xs text-gray-400">{a.assumption_category?.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{a.assumption_statement}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Importance: <span className="font-semibold text-gray-600">{a.importance_score}/5</span></span>
                      <span>Uncertainty: <span className="font-semibold text-gray-600">{a.uncertainty_score}/5</span></span>
                      <span>Risk Score: <span className="font-semibold" style={{ color: RISK_COLORS[a.risk_level] }}>{riskScore}/25</span></span>
                      {a.evidence_exists ? (
                        <span className="flex items-center gap-1" style={{ color: "#22c55e" }}><CheckCircle2 size={11} /> Evidence exists</span>
                      ) : (
                        <span className="flex items-center gap-1" style={{ color: "#f59e0b" }}><AlertTriangle size={11} /> No evidence</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => convertMut.mutate({ assumptionId: a.id, hypothesisType: a.assumption_category === "customer" ? "customer_segment" : a.assumption_category })}
                      className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center gap-1"
                      title="Convert to hypothesis"
                    >
                      <ChevronRight size={12} /> Convert
                    </button>
                    <button onClick={() => handleEdit(a)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                      <Pencil size={13} style={{ color: "#6b7280" }} />
                    </button>
                    <button onClick={() => { if (confirm("Delete this assumption?")) deleteMut.mutate({ id: a.id }); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                      <Trash2 size={13} style={{ color: "#ef4444" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Hypotheses ─────────────────────────────────────────

function HypothesesTab({ ventureId }: { ventureId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>("all");
  const [form, setForm] = useState({
    hypothesisType: "customer_segment", hypothesisStatement: "", targetCustomer: "",
    expectedBehaviour: "", successMetric: "", testMethod: "", assumptionRiskLevel: "medium",
  });

  const { data: hypotheses = [], refetch } = trpc["ventureIntake"]["hypotheses.list"].useQuery(
    { ventureId },
    { enabled: !!ventureId }
  );

  const createMut = trpc["ventureIntake"]["hypotheses.create"].useMutation({
    onSuccess: () => { toast.success("Hypothesis created"); refetch(); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc["ventureIntake"]["hypotheses.update"].useMutation({
    onSuccess: () => { toast.success("Hypothesis updated"); refetch(); setShowForm(false); setEditId(null); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc["ventureIntake"]["hypotheses.delete"].useMutation({
    onSuccess: () => { toast.success("Hypothesis deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ hypothesisType: "customer_segment", hypothesisStatement: "", targetCustomer: "", expectedBehaviour: "", successMetric: "", testMethod: "", assumptionRiskLevel: "medium" });
  }

  function handleEdit(h: any) {
    setEditId(h.id);
    setForm({
      hypothesisType: h.hypothesis_type ?? "customer_segment",
      hypothesisStatement: h.hypothesis_statement ?? "",
      targetCustomer: h.target_customer ?? "",
      expectedBehaviour: h.expected_behaviour ?? "",
      successMetric: h.success_metric ?? "",
      testMethod: h.test_method ?? "",
      assumptionRiskLevel: h.assumption_risk_level ?? "medium",
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.hypothesisStatement.trim()) { toast.error("Hypothesis statement is required"); return; }
    if (editId) {
      updateMut.mutate({ id: editId, ...form });
    } else {
      createMut.mutate({ ventureId, ...form });
    }
  }

  const HYPOTHESIS_TYPES = [
    { value: "customer_segment", label: "Customer Segment" },
    { value: "problem", label: "Problem" },
    { value: "value_proposition", label: "Value Proposition" },
    { value: "solution", label: "Solution" },
    { value: "business_model", label: "Business Model" },
    { value: "pricing", label: "Pricing" },
    { value: "channel", label: "Channel" },
    { value: "operational", label: "Operational" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "sustainability", label: "Sustainability" },
    { value: "data_access", label: "Data Access" },
    { value: "regulatory", label: "Regulatory" },
  ];

  const filtered = activeType === "all" ? (hypotheses as any[]) : (hypotheses as any[]).filter((h: any) => h.hypothesis_type === activeType);

  if (!ventureId) {
    return <EmptyState icon={FlaskConical} title="Select a venture" description="Choose a venture to define and manage hypotheses." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Hypothesis Register</h3>
          <p className="text-xs text-gray-400 mt-0.5">Define testable hypotheses for customer, problem, value proposition, and business model.</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" style={{ background: "#51AF37" }} onClick={() => { setShowForm(true); setEditId(null); resetForm(); }}>
          <Plus size={13} /> New Hypothesis
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["all", ...HYPOTHESIS_TYPES.map(t => t.value)].map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className="text-xs px-2.5 py-1 rounded-full border transition-colors"
            style={{
              background: activeType === type ? "#51AF37" : "white",
              color: activeType === type ? "white" : "#6b7280",
              borderColor: activeType === type ? "#51AF37" : "#e5e7eb",
            }}
          >
            {type === "all" ? "All" : type.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-5" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-800">{editId ? "Edit Hypothesis" : "New Hypothesis"}</h4>
            <button onClick={() => { setShowForm(false); setEditId(null); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Hypothesis Type</label>
              <Select value={form.hypothesisType} onValueChange={v => setForm(f => ({ ...f, hypothesisType: v }))}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{HYPOTHESIS_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Assumption Risk Level</label>
              <Select value={form.assumptionRiskLevel} onValueChange={v => setForm(f => ({ ...f, assumptionRiskLevel: v }))}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Hypothesis Statement *</label>
              <Textarea value={form.hypothesisStatement} onChange={e => setForm(f => ({ ...f, hypothesisStatement: e.target.value }))} placeholder="We hypothesise that… [specific, testable statement]" className="text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Target Customer</label>
              <Input value={form.targetCustomer} onChange={e => setForm(f => ({ ...f, targetCustomer: e.target.value }))} placeholder="Who is this hypothesis about?" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Expected Behaviour</label>
              <Input value={form.expectedBehaviour} onChange={e => setForm(f => ({ ...f, expectedBehaviour: e.target.value }))} placeholder="What behaviour do we expect to see?" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Success Metric</label>
              <Input value={form.successMetric} onChange={e => setForm(f => ({ ...f, successMetric: e.target.value }))} placeholder="How will we know it is validated?" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Test Method</label>
              <Input value={form.testMethod} onChange={e => setForm(f => ({ ...f, testMethod: e.target.value }))} placeholder="e.g. Customer interviews, survey, prototype" className="text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="text-xs h-8" style={{ background: "#51AF37" }} onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editId ? "Update" : "Save Hypothesis"}
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }}>Cancel</Button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !showForm ? (
        <EmptyState icon={FlaskConical} title="No hypotheses defined yet" description="Define testable hypotheses for customer segment, problem, value proposition, and business model." />
      ) : (
        <div className="space-y-2">
          {filtered.map((h: any) => (
            <div key={h.id} className="bg-white border rounded-xl p-4 group" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${RISK_COLORS[h.assumption_risk_level] ?? "#e5e7eb"}` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs" style={{ borderColor: "#3b82f6", color: "#3b82f6", background: "#3b82f610" }}>
                      {h.hypothesis_type?.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: STATUS_COLORS[h.status], color: STATUS_COLORS[h.status], background: `${STATUS_COLORS[h.status]}10` }}>
                      {h.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: RISK_COLORS[h.assumption_risk_level], color: RISK_COLORS[h.assumption_risk_level], background: `${RISK_COLORS[h.assumption_risk_level]}10` }}>
                      {h.assumption_risk_level} risk
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-800 mb-2">{h.hypothesis_statement}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    {h.target_customer && <span>Customer: <span className="text-gray-600">{h.target_customer}</span></span>}
                    {h.success_metric && <span>Success: <span className="text-gray-600">{h.success_metric}</span></span>}
                    {h.test_method && <span>Method: <span className="text-gray-600">{h.test_method}</span></span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(h)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                    <Pencil size={13} style={{ color: "#6b7280" }} />
                  </button>
                  <button onClick={() => { if (confirm("Delete this hypothesis?")) deleteMut.mutate({ id: h.id }); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                    <Trash2 size={13} style={{ color: "#ef4444" }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Riskiest Assumption ────────────────────────────────

function RiskiestAssumptionTab({ ventureId }: { ventureId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    assumptionStatement: "", reasonItIsRisky: "", impactIfFalse: "",
    evidenceRequired: "", proposedTest: "", recommendedFirstExperiment: "",
    impactIfFalseScore: 3, evidenceGapScore: 3, assumptionRiskScore: 9,
  });

  const { data: riskiest = [], refetch } = trpc["ventureIntake"]["riskiest.list"].useQuery(
    { ventureId },
    { enabled: !!ventureId }
  );

  const createMut = trpc["ventureIntake"]["riskiest.create"].useMutation({
    onSuccess: () => { toast.success("Riskiest assumption defined"); refetch(); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc["ventureIntake"]["riskiest.delete"].useMutation({
    onSuccess: () => { toast.success("Deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const createExpMut = trpc["ventureIntake"]["riskiest.createExperiment"].useMutation({
    onSuccess: () => toast.success("Lean experiment created"),
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ assumptionStatement: "", reasonItIsRisky: "", impactIfFalse: "", evidenceRequired: "", proposedTest: "", recommendedFirstExperiment: "", impactIfFalseScore: 3, evidenceGapScore: 3, assumptionRiskScore: 9 });
  }

  function handleSubmit() {
    if (!form.assumptionStatement.trim()) { toast.error("Assumption statement is required"); return; }
    createMut.mutate({ ventureId, ...form });
  }

  if (!ventureId) {
    return <EmptyState icon={AlertTriangle} title="Select a venture" description="Choose a venture to define its riskiest assumption." />;
  }

  const top = (riskiest as any[])[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Riskiest Assumption Test</h3>
          <p className="text-xs text-gray-400 mt-0.5">Identify the assumption most likely to invalidate the venture. This is central to Lean Startup methodology.</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" style={{ background: "#ef4444" }} onClick={() => { setShowForm(true); resetForm(); }}>
          <Plus size={13} /> Define Riskiest Assumption
        </Button>
      </div>

      {top && (
        <div className="bg-white border-2 rounded-xl p-5" style={{ borderColor: "#ef4444" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} style={{ color: "#ef4444" }} />
            <span className="text-sm font-bold text-gray-900">Top Riskiest Assumption</span>
            <Badge className="text-xs ml-auto" style={{ background: "#ef444415", color: "#ef4444", border: "1px solid #ef4444" }}>
              Priority Score: {top.test_priority_score}
            </Badge>
          </div>
          <p className="text-sm text-gray-800 mb-3">{top.assumption_statement}</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {top.reason_it_is_risky && <div><span className="font-semibold text-gray-400 block mb-0.5">Why It Is Risky</span><p className="text-gray-600">{top.reason_it_is_risky}</p></div>}
            {top.impact_if_false && <div><span className="font-semibold text-gray-400 block mb-0.5">Impact If False</span><p className="text-gray-600">{top.impact_if_false}</p></div>}
            {top.evidence_required && <div><span className="font-semibold text-gray-400 block mb-0.5">Evidence Required</span><p className="text-gray-600">{top.evidence_required}</p></div>}
            {top.recommended_first_experiment && <div><span className="font-semibold text-gray-400 block mb-0.5">Recommended First Experiment</span><p className="text-gray-600">{top.recommended_first_experiment}</p></div>}
          </div>
          <div className="mt-4">
            <Button size="sm" className="text-xs h-8 gap-1.5" style={{ background: "#3b82f6" }}
              onClick={() => createExpMut.mutate({
                ventureId,
                riskiestAssumptionId: top.id,
                experimentName: `Test: ${top.assumption_statement.slice(0, 60)}…`,
                experimentType: "interview",
                method: top.proposed_test ?? undefined,
                successThreshold: top.evidence_required ?? undefined,
              })}
              disabled={createExpMut.isPending}
            >
              <FlaskConical size={12} /> Create Lean Experiment
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border rounded-xl p-5" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-800">Define Riskiest Assumption</h4>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Assumption Statement *</label>
              <Textarea value={form.assumptionStatement} onChange={e => setForm(f => ({ ...f, assumptionStatement: e.target.value }))} placeholder="The assumption that could kill this venture fastest…" className="text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Why It Is Risky</label>
              <Textarea value={form.reasonItIsRisky} onChange={e => setForm(f => ({ ...f, reasonItIsRisky: e.target.value }))} placeholder="What makes this assumption dangerous?" className="text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Impact If False</label>
              <Textarea value={form.impactIfFalse} onChange={e => setForm(f => ({ ...f, impactIfFalse: e.target.value }))} placeholder="What happens to the venture if this is wrong?" className="text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Required</label>
              <Textarea value={form.evidenceRequired} onChange={e => setForm(f => ({ ...f, evidenceRequired: e.target.value }))} placeholder="What evidence would validate or invalidate this?" className="text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Proposed Test</label>
              <Textarea value={form.proposedTest} onChange={e => setForm(f => ({ ...f, proposedTest: e.target.value }))} placeholder="How should we test this assumption?" className="text-sm" rows={2} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Recommended First Experiment</label>
              <Input value={form.recommendedFirstExperiment} onChange={e => setForm(f => ({ ...f, recommendedFirstExperiment: e.target.value }))} placeholder="e.g. 5 customer discovery interviews with engineering directors" className="text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2 col-span-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Assumption Risk Score (1–25)</label>
                <Input type="number" min={1} max={25} value={form.assumptionRiskScore} onChange={e => setForm(f => ({ ...f, assumptionRiskScore: Number(e.target.value) }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Impact If False (1–5)</label>
                <Input type="number" min={1} max={5} value={form.impactIfFalseScore} onChange={e => setForm(f => ({ ...f, impactIfFalseScore: Number(e.target.value) }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Gap (1–5)</label>
                <Input type="number" min={1} max={5} value={form.evidenceGapScore} onChange={e => setForm(f => ({ ...f, evidenceGapScore: Number(e.target.value) }))} className="text-sm" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="text-xs h-8" style={{ background: "#ef4444" }} onClick={handleSubmit} disabled={createMut.isPending}>
              Save Riskiest Assumption
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
          </div>
        </div>
      )}

      {(riskiest as any[]).length === 0 && !showForm && (
        <EmptyState icon={AlertTriangle} title="No riskiest assumption defined" description="Define the assumption most likely to invalidate the venture before proceeding to discovery." />
      )}
      {(riskiest as any[]).length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">All Ranked Assumptions</h4>
          {(riskiest as any[]).slice(1).map((r: any) => (
            <div key={r.id} className="bg-white border rounded-xl p-4 group flex items-start justify-between" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="text-xs" style={{ background: "#ef444415", color: "#ef4444", border: "1px solid #ef4444" }}>Score: {r.test_priority_score}</Badge>
                </div>
                <p className="text-xs text-gray-700">{r.assumption_statement}</p>
              </div>
              <button onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: r.id }); }} className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 ml-3">
                <Trash2 size={13} style={{ color: "#ef4444" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Lean Canvas ────────────────────────────────────────

function LeanCanvasTab({ ventureId }: { ventureId: string }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: canvas, refetch } = trpc["ventureIntake"]["canvas.get"].useQuery(
    { ventureId },
    { enabled: !!ventureId }
  );
  const { data: versions = [] } = trpc["ventureIntake"]["canvas.listVersions"].useQuery(
    { ventureId },
    { enabled: !!ventureId }
  );

  const saveMut = trpc["ventureIntake"]["canvas.save"].useMutation({
    onSuccess: () => { toast.success("Canvas saved"); refetch(); setEditing(false); },
    onError: (e) => toast.error(e.message),
  });

  function startEdit() {
    setForm({
      customerSegments: (canvas as any)?.customer_segments ?? "",
      problem: (canvas as any)?.problem ?? "",
      existingAlternatives: (canvas as any)?.existing_alternatives ?? "",
      uniqueValueProposition: (canvas as any)?.unique_value_proposition ?? "",
      solution: (canvas as any)?.solution ?? "",
      channels: (canvas as any)?.channels ?? "",
      revenueStreams: (canvas as any)?.revenue_streams ?? "",
      costStructure: (canvas as any)?.cost_structure ?? "",
      keyMetrics: (canvas as any)?.key_metrics ?? "",
      unfairAdvantage: (canvas as any)?.unfair_advantage ?? "",
      highLevelConcept: (canvas as any)?.high_level_concept ?? "",
    });
    setEditing(true);
  }

  const BLOCKS = [
    { key: "customerSegments", label: "Customer Segments", col: "col-span-1" },
    { key: "problem", label: "Problem", col: "col-span-1" },
    { key: "existingAlternatives", label: "Existing Alternatives", col: "col-span-1" },
    { key: "uniqueValueProposition", label: "Unique Value Proposition", col: "col-span-1" },
    { key: "solution", label: "Solution", col: "col-span-1" },
    { key: "channels", label: "Channels", col: "col-span-1" },
    { key: "revenueStreams", label: "Revenue Streams", col: "col-span-1" },
    { key: "costStructure", label: "Cost Structure", col: "col-span-1" },
    { key: "keyMetrics", label: "Key Metrics", col: "col-span-1" },
    { key: "unfairAdvantage", label: "Unfair Advantage", col: "col-span-1" },
    { key: "highLevelConcept", label: "High-Level Concept", col: "col-span-2" },
  ];

  const dbKeys: Record<string, string> = {
    customerSegments: "customer_segments", problem: "problem",
    existingAlternatives: "existing_alternatives", uniqueValueProposition: "unique_value_proposition",
    solution: "solution", channels: "channels", revenueStreams: "revenue_streams",
    costStructure: "cost_structure", keyMetrics: "key_metrics",
    unfairAdvantage: "unfair_advantage", highLevelConcept: "high_level_concept",
  };

  if (!ventureId) {
    return <EmptyState icon={BookOpen} title="Select a venture" description="Choose a venture to create and manage its Lean Canvas." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Initial Lean Canvas</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            First-pass canvas — versioned as evidence is gathered.
            {(versions as any[]).length > 0 && ` Version ${(canvas as any)?.version_number ?? 1} of ${(versions as any[]).length}`}
          </p>
        </div>
        <div className="flex gap-2">
          {canvas && (
            <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5"
              onClick={() => saveMut.mutate({
                ventureId,
                ...Object.fromEntries(BLOCKS.map(b => [b.key, (canvas as any)[dbKeys[b.key]]])),
                createNewVersion: true,
              })}
            >
              <RefreshCw size={12} /> New Version
            </Button>
          )}
          <Button size="sm" className="text-xs h-8 gap-1.5" style={{ background: "#51AF37" }} onClick={startEdit}>
            <Pencil size={12} /> {canvas ? "Edit Canvas" : "Create Canvas"}
          </Button>
        </div>
      </div>

      {canvas && (
        <ScoreCard
          label="Canvas Completeness"
          score={(canvas as any).completenessScore ?? 0}
          warning="Lean Canvas is incomplete. Do not progress to Discovery & Market until core blocks are defined."
          warningThreshold={70}
        />
      )}

      {editing ? (
        <div className="bg-white border rounded-xl p-5" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-800">Edit Lean Canvas</h4>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {BLOCKS.map(b => (
              <div key={b.key} className={b.col}>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{b.label}</label>
                <Textarea
                  value={form[b.key] ?? ""}
                  onChange={e => setForm(f => ({ ...f, [b.key]: e.target.value }))}
                  placeholder={`Define ${b.label.toLowerCase()}…`}
                  className="text-sm"
                  rows={3}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="text-xs h-8" style={{ background: "#51AF37" }} onClick={() => saveMut.mutate({ ventureId, ...form })} disabled={saveMut.isPending}>
              Save Canvas
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : canvas ? (
        <div className="grid grid-cols-2 gap-3">
          {BLOCKS.map(b => {
            const value = (canvas as any)[dbKeys[b.key]];
            return (
              <div key={b.key} className={`bg-white border rounded-xl p-4 ${b.col}`} style={{ borderColor: value ? "#e5e7eb" : "#fef3c7", background: value ? "white" : "#fffbeb" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  {value ? <CheckCircle2 size={12} style={{ color: "#22c55e" }} /> : <AlertTriangle size={12} style={{ color: "#f59e0b" }} />}
                  <span className="text-xs font-semibold text-gray-500">{b.label}</span>
                </div>
                {value ? (
                  <p className="text-xs text-gray-700">{value}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">Not defined</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={BookOpen} title="No canvas created yet" description="Create the first version of the Lean Canvas to structure the venture concept." />
      )}
    </div>
  );
}

// ── Tab: Intake Decision ────────────────────────────────────

function IntakeDecisionTab({ ventureId }: { ventureId: string }) {
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [decisionType, setDecisionType] = useState("research_more");
  const [reviewerNotes, setReviewerNotes] = useState("");

  const { data: computed, refetch: refetchComputed } = trpc["ventureIntake"]["decision.compute"].useQuery(
    { ventureId },
    { enabled: !!ventureId }
  );
  const { data: latestDecision } = trpc["ventureIntake"]["decision.get"].useQuery(
    { ventureId },
    { enabled: !!ventureId }
  );

  const saveMut = trpc["ventureIntake"]["decision.save"].useMutation({
    onSuccess: () => { toast.success("Decision saved"); setShowDecisionForm(false); refetchComputed(); },
    onError: (e) => toast.error(e.message),
  });
  const approveMut = trpc["ventureIntake"]["decision.approve"].useMutation({
    onSuccess: () => toast.success("Decision approved — venture stage updated"),
    onError: (e) => toast.error(e.message),
  });

  const DECISION_OPTIONS = [
    { value: "reject", label: "Reject" },
    { value: "archive", label: "Archive" },
    { value: "research_more", label: "Research More" },
    { value: "begin_customer_discovery", label: "Begin Customer Discovery" },
    { value: "begin_market_discovery", label: "Begin Market Discovery" },
    { value: "create_experiment", label: "Create First Experiment" },
    { value: "pivot_before_discovery", label: "Pivot Before Discovery" },
    { value: "proceed_to_discovery_and_market", label: "Proceed to Discovery & Market" },
  ];

  if (!ventureId) {
    return <EmptyState icon={BarChart3} title="Select a venture" description="Choose a venture to compute and record the Intake Decision." />;
  }

  const c = computed as any;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Intake Decision</h3>
          <p className="text-xs text-gray-400 mt-0.5">Decide whether the venture should proceed to validation based on the Intake Readiness Score.</p>
        </div>
        <Button size="sm" className="text-xs h-8 gap-1.5" style={{ background: "#51AF37" }} onClick={() => setShowDecisionForm(true)}>
          <CheckCircle2 size={12} /> Record Decision
        </Button>
      </div>

      {c && (
        <>
          <div className="bg-white border-2 rounded-xl p-5" style={{ borderColor: READINESS_COLOR(c.readinessScore) }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Intake Readiness Score</div>
                <div className="text-4xl font-bold" style={{ color: READINESS_COLOR(c.readinessScore), fontFamily: "'Prompt', sans-serif" }}>
                  {c.readinessScore}
                </div>
                <div className="text-sm font-semibold mt-1" style={{ color: READINESS_COLOR(c.readinessScore) }}>
                  {READINESS_LABEL(c.readinessScore)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-400 mb-1">Recommendation</div>
                <div className="text-sm font-bold text-gray-800">{c.recommendation?.label}</div>
                <p className="text-xs text-gray-500 max-w-xs mt-1">{c.recommendation?.description}</p>
              </div>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.readinessScore}%`, background: READINESS_COLOR(c.readinessScore) }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ScoreCard label="Idea Completeness" score={c.ideaCompleteness} />
            <ScoreCard label="Segment Clarity" score={c.segmentClarity} warning="Customer segment is not sufficiently defined for discovery interviews." />
            <ScoreCard label="Problem Definition" score={c.problemDefinition} warning="Problem hypothesis is too vague to validate." />
            <ScoreCard label="Value Proposition" score={c.valuePropQuality} warning="Value proposition is not measurable." />
            <ScoreCard label="Business Model" score={c.bizModelReadiness} warning="Business model hypothesis is incomplete." />
            <ScoreCard label="Canvas Completeness" score={c.canvasCompleteness} warning="Lean Canvas is incomplete." warningThreshold={70} />
          </div>

          {c.hasCriticalUndefined && (
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "#fef3c7", border: "1px solid #f59e0b" }}>
              <AlertTriangle size={16} style={{ color: "#f59e0b" }} className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold" style={{ color: "#92400e" }}>Critical Assumptions Without Tests</div>
                <p className="text-xs mt-0.5" style={{ color: "#92400e" }}>
                  {c.criticalAssumptions} critical assumption{c.criticalAssumptions !== 1 ? "s" : ""} exist with no evidence. Define and test the riskiest assumption first.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white border rounded-xl p-4" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold text-gray-400 mb-1">Assumptions</div>
              <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{c.totalAssumptions}</div>
            </div>
            <div className="bg-white border rounded-xl p-4" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold text-gray-400 mb-1">Hypotheses</div>
              <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{c.totalHypotheses}</div>
            </div>
            <div className="bg-white border rounded-xl p-4" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold text-gray-400 mb-1">Riskiest Defined</div>
              <div className="text-2xl font-bold" style={{ color: c.riskiestDefined ? "#22c55e" : "#ef4444", fontFamily: "'Prompt', sans-serif" }}>
                {c.riskiestDefined ? "Yes" : "No"}
              </div>
            </div>
          </div>
        </>
      )}

      {latestDecision && (
        <div className="bg-white border rounded-xl p-5" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-900">Latest Decision</span>
            <Badge variant="outline" className="text-xs" style={{ borderColor: "#51AF37", color: "#51AF37" }}>
              {(latestDecision as any).decision_status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="font-semibold text-gray-400 block mb-0.5">Decision</span><p className="text-gray-700">{(latestDecision as any).decision_type?.replace(/_/g, " ")}</p></div>
            <div><span className="font-semibold text-gray-400 block mb-0.5">Readiness Score</span><p className="font-bold" style={{ color: READINESS_COLOR((latestDecision as any).readiness_score) }}>{(latestDecision as any).readiness_score}</p></div>
            {(latestDecision as any).decision_summary && <div className="col-span-2"><span className="font-semibold text-gray-400 block mb-0.5">Summary</span><p className="text-gray-700">{(latestDecision as any).decision_summary}</p></div>}
          </div>
          {(latestDecision as any).decision_status === "pending_review" && (
            <Button size="sm" className="mt-3 text-xs h-8 gap-1.5" style={{ background: "#22c55e" }}
              onClick={() => approveMut.mutate({
                decisionId: (latestDecision as any).id,
                ventureId,
                newStage: (latestDecision as any).decision_type === "proceed_to_discovery_and_market" ? "Validation" : undefined,
                newStatus: (latestDecision as any).decision_type === "reject" ? "Paused" : "Active",
              })}
              disabled={approveMut.isPending}
            >
              <CheckCircle2 size={12} /> Approve Decision
            </Button>
          )}
        </div>
      )}

      {showDecisionForm && c && (
        <div className="bg-white border rounded-xl p-5" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-800">Record Intake Decision</h4>
            <button onClick={() => setShowDecisionForm(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Decision</label>
              <Select value={decisionType} onValueChange={setDecisionType}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{DECISION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Reviewer Notes</label>
              <Textarea value={reviewerNotes} onChange={e => setReviewerNotes(e.target.value)} placeholder="Additional context or rationale for this decision…" className="text-sm" rows={3} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="text-xs h-8" style={{ background: "#51AF37" }}
              onClick={() => saveMut.mutate({
                ventureId,
                decisionType,
                readinessScore: c.readinessScore,
                assumptionRiskScore: c.criticalAssumptions * 20,
                reviewerNotes,
                recommendation: c.recommendation?.decision,
                decisionStatus: "pending_review",
              })}
              disabled={saveMut.isPending}
            >
              Save Decision
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setShowDecisionForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

const TABS = [
  { id: "idea", label: "Idea Capture", icon: Lightbulb },
  { id: "assumptions", label: "Assumptions", icon: Shield },
  { id: "hypotheses", label: "Hypotheses", icon: FlaskConical },
  { id: "riskiest", label: "Riskiest Assumption", icon: AlertTriangle },
  { id: "canvas", label: "Lean Canvas", icon: BookOpen },
  { id: "decision", label: "Intake Decision", icon: BarChart3 },
];

export default function VentureIntake() {
  const [activeTab, setActiveTab] = useState("idea");
  const [ventureId, setVentureId] = useState("bebus");

  const { data: summary } = trpc["ventureIntake"]["dashboard.summary"].useQuery(
    { ventureId },
    { enabled: !!ventureId }
  );

  const s = summary as any;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#51AF3715", color: "#51AF37" }}>
                Module 2
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">Lean Startup Hypothesis Workflow</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Venture Intake
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Structure every venture idea before validation. Capture assumptions, define hypotheses, identify the riskiest assumption, and decide whether to proceed.
            </p>
          </div>
          <VentureSelector value={ventureId} onChange={setVentureId} />
        </div>

        {s && (
          <div className="flex gap-6 mt-4 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{s.totalIdeas}</div>
              <div className="text-xs text-gray-400">Ideas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{s.totalAssumptions}</div>
              <div className="text-xs text-gray-400">Assumptions</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: s.criticalAssumptions > 0 ? "#7c3aed" : "#22c55e", fontFamily: "'Prompt', sans-serif" }}>{s.criticalAssumptions}</div>
              <div className="text-xs text-gray-400">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{s.totalHypotheses}</div>
              <div className="text-xs text-gray-400">Hypotheses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: s.riskiestDefined ? "#22c55e" : "#ef4444", fontFamily: "'Prompt', sans-serif" }}>
                {s.riskiestDefined ? "✓" : "✗"}
              </div>
              <div className="text-xs text-gray-400">Riskiest Defined</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{s.totalExperiments}</div>
              <div className="text-xs text-gray-400">Experiments</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-8 pt-4 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors"
                style={{
                  background: activeTab === tab.id ? "white" : "transparent",
                  color: activeTab === tab.id ? "#1a2332" : "#9ca3af",
                  borderBottom: activeTab === tab.id ? "2px solid #51AF37" : "2px solid transparent",
                }}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-8">
        {activeTab === "idea" && <IdeaCaptureTab ventureId={ventureId} />}
        {activeTab === "assumptions" && <FounderAssumptionsTab ventureId={ventureId} />}
        {activeTab === "hypotheses" && <HypothesesTab ventureId={ventureId} />}
        {activeTab === "riskiest" && <RiskiestAssumptionTab ventureId={ventureId} />}
        {activeTab === "canvas" && <LeanCanvasTab ventureId={ventureId} />}
        {activeTab === "decision" && <IntakeDecisionTab ventureId={ventureId} />}
      </div>
    </div>
  );
}
