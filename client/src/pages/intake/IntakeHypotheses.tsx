// ============================================================================
// INTAKE HYPOTHESES — Venture Intake sub-section
// Shows cc_hypotheses filtered by moduleSource='venture_intake'.
// Supports all hypothesis types: customer_segment, problem, value_proposition, business_model, etc.
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FlaskConical, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

const HYPOTHESIS_TYPES = [
  { value: "customer_segment",    label: "Customer Segment" },
  { value: "problem",             label: "Problem" },
  { value: "value_proposition",   label: "Value Proposition" },
  { value: "solution",            label: "Solution" },
  { value: "business_model",      label: "Business Model" },
  { value: "pricing",             label: "Pricing" },
  { value: "channel",             label: "Channel" },
  { value: "operational",         label: "Operational" },
  { value: "manufacturing",       label: "Manufacturing" },
  { value: "sustainability",      label: "Sustainability" },
  { value: "data_access",         label: "Data Access" },
  { value: "regulatory",          label: "Regulatory" },
];

const TYPE_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  customer_segment:  { border: "#7c3aed", bg: "#ede9fe", text: "#7c3aed" },
  problem:           { border: "#dc2626", bg: "#fee2e2", text: "#dc2626" },
  value_proposition: { border: "#0891b2", bg: "#cffafe", text: "#0891b2" },
  solution:          { border: "#16a34a", bg: "#dcfce7", text: "#16a34a" },
  business_model:    { border: "#d97706", bg: "#fef3c7", text: "#d97706" },
  pricing:           { border: "#9333ea", bg: "#f5f3ff", text: "#9333ea" },
  channel:           { border: "#0ea5e9", bg: "#e0f2fe", text: "#0ea5e9" },
};

const STATUS_CFG: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  untested:         { icon: Clock,         label: "Untested",         color: "#6b7280", bg: "#f3f4f6" },
  testing:          { icon: AlertTriangle, label: "Testing",          color: "#d97706", bg: "#fef3c7" },
  validated:        { icon: CheckCircle2,  label: "Validated",        color: "#16a34a", bg: "#dcfce7" },
  invalidated:      { icon: AlertTriangle, label: "Invalidated",      color: "#dc2626", bg: "#fee2e2" },
  pivot_required:   { icon: AlertTriangle, label: "Pivot Required",   color: "#9333ea", bg: "#f5f3ff" },
  paused:           { icon: Clock,         label: "Paused",           color: "#6b7280", bg: "#f3f4f6" },
};

const RISK_LEVELS = ["low", "medium", "high", "critical"];
const STATUSES = ["untested", "testing", "validated", "invalidated", "pivot_required", "paused"];

const EMPTY_FORM = { hypothesisType: "problem", hypothesisStatement: "", assumptionRiskLevel: "medium", status: "untested", evidenceSummary: "" };

export default function IntakeHypotheses() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState<string>("all");

  const vid = { ventureId: selectedVentureId! };
  const { data: hyps = [], refetch } = trpc.intake.hypotheses.list.useQuery(vid, { enabled: !!selectedVentureId });
  const upsert = trpc.intake.hypotheses.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); setEditing(null); setForm(EMPTY_FORM); toast.success("Hypothesis saved"); } });
  const del = trpc.intake.hypotheses.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Hypothesis deleted"); } });

  function openNew() { setForm(EMPTY_FORM); setEditing(null); setOpen(true); }
  function openEdit(h: any) { setForm({ hypothesisType: h.hypothesisType, hypothesisStatement: h.hypothesisStatement, assumptionRiskLevel: h.assumptionRiskLevel ?? "medium", status: h.status, evidenceSummary: h.evidenceSummary ?? "" }); setEditing(h.id); setOpen(true); }
  function save() { upsert.mutate({ ...form, ventureId: selectedVentureId!, id: editing ?? undefined }); }

  const typeGroups = HYPOTHESIS_TYPES.map(t => t.value);
  const filtered = filter === "all" ? hyps : hyps.filter((h: any) => h.hypothesisType === filter);

  const coverageTypes = new Set(hyps.map((h: any) => h.hypothesisType));
  const missingCritical = ["customer_segment", "problem", "value_proposition"].filter(t => !coverageTypes.has(t));

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Hypotheses"
        purpose="Define testable hypotheses for each key assumption. Customer segment, problem, value proposition, and business model hypotheses are required before Discovery."
        icon={<FlaskConical size={18} style={{ color: "#56A837" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} />Add Hypothesis</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {/* Coverage stats */}
        {hyps.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total", value: hyps.length },
              { label: "Validated", value: hyps.filter((h: any) => h.status === "validated").length, color: "#16a34a" },
              { label: "Testing", value: hyps.filter((h: any) => h.status === "testing").length, color: "#d97706" },
              { label: "Untested", value: hyps.filter((h: any) => h.status === "untested").length, color: "#6b7280" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className="text-2xl font-bold" style={{ color: s.color ?? "#1a2332" }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Missing critical hypotheses */}
        {missingCritical.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl p-4 border" style={{ background: "#fffbeb", borderColor: "#fcd34d" }}>
            <AlertTriangle size={16} style={{ color: "#d97706", marginTop: 2, flexShrink: 0 }} />
            <p className="text-sm" style={{ color: "#92400e" }}>
              Missing required hypotheses: <strong>{missingCritical.map(t => t.replace(/_/g, " ")).join(", ")}</strong>. These must be defined before proceeding to Discovery &amp; Market.
            </p>
          </div>
        )}

        {/* Type filter */}
        {hyps.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {["all", ...typeGroups.filter(t => hyps.some((h: any) => h.hypothesisType === t))].map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize"
                style={{ background: filter === t ? "#1a2332" : "white", color: filter === t ? "white" : "#6b7280", borderColor: filter === t ? "#1a2332" : "#e5e7eb" }}>
                {t === "all" ? `All (${hyps.length})` : t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState title="No hypotheses defined" description="Convert assumptions into testable hypotheses. Start with customer segment, problem, and value proposition." action={<Button size="sm" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} className="mr-1" />Add Hypothesis</Button>} />
        ) : (
          <div className="space-y-3">
            {filtered.map((h: any) => {
              const tc = TYPE_COLORS[h.hypothesisType] ?? { border: "#6b7280", bg: "#f3f4f6", text: "#6b7280" };
              const sc = STATUS_CFG[h.status] ?? STATUS_CFG.untested;
              const StatusIcon = sc.icon;
              return (
                <div key={h.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <Badge variant="outline" className="text-xs capitalize" style={{ borderColor: tc.border, color: tc.text, background: tc.bg }}>
                          {h.hypothesisType.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs" style={{ borderColor: sc.color, color: sc.color, background: sc.bg }}>
                          <StatusIcon size={10} className="mr-1 inline" />{sc.label}
                        </Badge>
                        {h.assumptionRiskLevel && (
                          <Badge variant="outline" className="text-xs capitalize">{h.assumptionRiskLevel} risk</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">"{h.hypothesisStatement}"</p>
                      {h.evidenceSummary && <p className="text-xs text-gray-400 mt-2 italic">Evidence: {h.evidenceSummary}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(h)}><Pencil size={13} /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => del.mutate({ id: h.id })}><Trash2 size={13} className="text-red-400" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Hypothesis" : "Add Intake Hypothesis"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Hypothesis Type *</label>
              <Select value={form.hypothesisType} onValueChange={v => setForm(p => ({ ...p, hypothesisType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{HYPOTHESIS_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Hypothesis Statement *</label>
              <Textarea rows={4} value={form.hypothesisStatement} onChange={e => setForm(p => ({ ...p, hypothesisStatement: e.target.value }))} placeholder="We believe that [customer] will [behaviour] because [reason]. We will know this is true when [success metric]." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Assumption Risk Level</label>
                <Select value={form.assumptionRiskLevel} onValueChange={v => setForm(p => ({ ...p, assumptionRiskLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Summary</label>
              <Textarea rows={2} value={form.evidenceSummary} onChange={e => setForm(p => ({ ...p, evidenceSummary: e.target.value }))} placeholder="Any existing evidence for or against this hypothesis..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={save} disabled={!form.hypothesisStatement || upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save Hypothesis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
