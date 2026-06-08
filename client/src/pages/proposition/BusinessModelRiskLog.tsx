// ============================================================================
// BUSINESS MODEL RISK LOG — Module 4, Sub-section 6
// Risk Score = Probability × Severity × EvidenceConfidence (1–125)
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShieldAlert, Plus, Pencil, Trash2 } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";
import { calcRiskScore, riskScoreLabel, riskScoreColor } from "@/lib/proposition-scoring";

const RISK_CATEGORIES = [
  { value: "weak_value_proposition",       label: "Weak Value Proposition" },
  { value: "unclear_customer_job",         label: "Unclear Customer Job" },
  { value: "weak_differentiation",         label: "Weak Differentiation" },
  { value: "unvalidated_revenue_model",    label: "Unvalidated Revenue Model" },
  { value: "pricing_risk",                 label: "Pricing Risk" },
  { value: "weak_unit_economics",          label: "Weak Unit Economics" },
  { value: "channel_risk",                 label: "Channel Risk" },
  { value: "scalability_risk",             label: "Scalability Risk" },
  { value: "delivery_model_risk",          label: "Delivery Model Risk" },
  { value: "data_moat_risk",               label: "Data Moat Risk" },
  { value: "sustainability_claim_risk",    label: "Sustainability Claim Risk" },
  { value: "competitive_positioning_risk", label: "Competitive Positioning Risk" },
];
const STATUSES = ["open","monitoring","mitigated","escalated","closed"];

const EMPTY = {
  riskTitle: "", riskCategory: "", riskDescription: "",
  probabilityScore: 3, severityScore: 3, evidenceConfidenceScore: 3,
  mitigationPlan: "", requiredExperiment: "", owner: "", reviewDate: "",
  status: "open", linkedRecordType: null as string | null, linkedRecordId: null as number | null,
};

export default function BusinessModelRiskLog() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const vid = { ventureId: selectedVentureId! };
  const { data: risks = [], refetch } = trpc.proposition.risks.list.useQuery(vid, { enabled: !!selectedVentureId });
  const upsert = trpc.proposition.risks.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); setEditing(null); setForm(EMPTY); toast.success("Risk saved"); } });
  const del = trpc.proposition.risks.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Deleted"); } });

  function openNew() { setForm(EMPTY); setEditing(null); setOpen(true); }
  function openEdit(r: any) { setForm({ ...EMPTY, ...r }); setEditing(r.id); setOpen(true); }
  function save() { upsert.mutate({ ...form, ventureId: selectedVentureId!, id: editing ?? undefined }); }

  const liveScore = calcRiskScore(form.probabilityScore, form.severityScore, form.evidenceConfidenceScore);
  const critical = (risks as any[]).filter(r => (r.riskScore ?? 0) >= 76);
  const open_ = (risks as any[]).filter(r => r.status === "open" || r.status === "escalated");

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Business Model Risk Log"
        purpose="Capture risks that could invalidate the proposition or business model. Risk Score = Probability × Severity × Evidence Confidence (max 125)."
        icon={<ShieldAlert size={18} style={{ color: "#dc2626" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} />Add Risk</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {(risks as any[]).length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Risks",       value: (risks as any[]).length },
              { label: "Critical (76+)",    value: critical.length,  color: "#dc2626" },
              { label: "Open / Escalated",  value: open_.length,     color: "#f97316" },
              { label: "Mitigated",         value: (risks as any[]).filter(r => r.status === "mitigated").length, color: "#16a34a" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className="text-2xl font-bold" style={{ color: s.color ?? "#1a2332" }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {(risks as any[]).length === 0 ? (
          <EmptyState title="No risks logged" description="Identify risks that could invalidate the proposition or business model. Score probability, severity, and evidence confidence." action={<Button size="sm" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} className="mr-1" />Add First Risk</Button>} />
        ) : (
          <div className="space-y-3">
            {(risks as any[]).map((r) => {
              const sc = riskScoreColor(r.riskScore ?? 27);
              const label = riskScoreLabel(r.riskScore ?? 27);
              return (
                <div key={r.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline" className="text-xs capitalize" style={{ borderColor: sc.color, color: sc.color, background: sc.bg }}>{label}</Badge>
                        {r.riskCategory && <Badge variant="outline" className="text-xs">{RISK_CATEGORIES.find(c => c.value === r.riskCategory)?.label ?? r.riskCategory}</Badge>}
                        <Badge variant="outline" className="text-xs capitalize">{(r.status ?? "open").replace(/_/g, " ")}</Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{r.riskTitle}</h4>
                      {r.riskDescription && <p className="text-sm text-gray-600">{r.riskDescription}</p>}
                      <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-gray-500">
                        {r.mitigationPlan && <div><span className="font-semibold text-gray-400 block">Mitigation</span>{r.mitigationPlan}</div>}
                        {r.requiredExperiment && <div><span className="font-semibold text-gray-400 block">Required Experiment</span>{r.requiredExperiment}</div>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-center px-3 py-2 rounded-lg" style={{ background: sc.bg, minWidth: 72 }}>
                        <div className="text-2xl font-bold" style={{ color: sc.color }}>{r.riskScore ?? 27}</div>
                        <div className="text-xs text-gray-400">{r.probabilityScore}×{r.severityScore}×{r.evidenceConfidenceScore}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(r)}><Pencil size={13} /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => del.mutate({ id: r.id })}><Trash2 size={13} className="text-red-400" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Risk" : "Add Business Model Risk"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Risk Title *</label><Input value={form.riskTitle} onChange={e => setForm(p => ({ ...p, riskTitle: e.target.value }))} placeholder="e.g. Revenue model not validated by WTP evidence" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Risk Category</label><Select value={form.riskCategory} onValueChange={v => setForm(p => ({ ...p, riskCategory: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{RISK_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label><Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Risk Description</label><Textarea rows={2} value={form.riskDescription} onChange={e => setForm(p => ({ ...p, riskDescription: e.target.value }))} placeholder="Describe the risk and its source..." /></div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { k: "probabilityScore", l: "Probability (1-5)" },
                { k: "severityScore",    l: "Severity (1-5)" },
                { k: "evidenceConfidenceScore", l: "Evidence Confidence (1-5)" },
              ].map(({ k, l }) => (
                <div key={k}>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{l}</label>
                  <div className="flex gap-1">{[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setForm(p => ({ ...p, [k]: n }))}
                      className="w-8 h-8 rounded text-xs font-semibold border transition-all"
                      style={{ background: (form as any)[k] === n ? "#1a2332" : "white", color: (form as any)[k] === n ? "white" : "#6b7280", borderColor: (form as any)[k] === n ? "#1a2332" : "#e5e7eb" }}>{n}</button>
                  ))}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-3 text-sm" style={{ background: "#f9fafb" }}>
              Risk Score: <strong style={{ color: riskScoreColor(liveScore).color }}>{liveScore} — {riskScoreLabel(liveScore)}</strong>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Mitigation Plan</label><Textarea rows={2} value={form.mitigationPlan} onChange={e => setForm(p => ({ ...p, mitigationPlan: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Required Experiment</label><Textarea rows={2} value={form.requiredExperiment} onChange={e => setForm(p => ({ ...p, requiredExperiment: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Owner</label><Input value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Review Date</label><Input type="date" value={form.reviewDate} onChange={e => setForm(p => ({ ...p, reviewDate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={save} disabled={!form.riskTitle || upsert.isPending}>{upsert.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
