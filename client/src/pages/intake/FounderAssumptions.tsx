// ============================================================================
// FOUNDER ASSUMPTIONS — Venture Intake sub-section
// Captures what the founder believes to be true before evidence exists.
// Risk Score = Importance × Uncertainty (1–25). Critical ≥ 19, High ≥ 11.
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
import { ShieldAlert, Plus, Pencil, Trash2, AlertTriangle, Zap, ChevronRight } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

const CATEGORIES = [
  { value: "customer",         label: "Customer" },
  { value: "problem",          label: "Problem" },
  { value: "value_proposition",label: "Value Proposition" },
  { value: "solution",         label: "Solution" },
  { value: "pricing",          label: "Pricing" },
  { value: "channel",          label: "Channel" },
  { value: "technical",        label: "Technical" },
  { value: "manufacturing",    label: "Manufacturing" },
  { value: "supply_chain",     label: "Supply Chain" },
  { value: "sustainability",   label: "Sustainability" },
  { value: "regulatory",       label: "Regulatory" },
  { value: "data_access",      label: "Data Access" },
  { value: "operations",       label: "Operations" },
  { value: "investment",       label: "Investment" },
];

const RISK_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  critical: { border: "#dc2626", bg: "#fee2e2", text: "#dc2626" },
  high:     { border: "#f97316", bg: "#fff7ed", text: "#ea580c" },
  medium:   { border: "#f59e0b", bg: "#fffbeb", text: "#d97706" },
  low:      { border: "#22c55e", bg: "#dcfce7", text: "#16a34a" },
};

function riskScore(imp: number, unc: number) { return imp * unc; }
function riskLabel(imp: number, unc: number): string {
  const s = riskScore(imp, unc);
  if (s >= 19) return "critical";
  if (s >= 11) return "high";
  if (s >= 6)  return "medium";
  return "low";
}

const EMPTY_FORM = {
  assumptionTitle: "", assumptionStatement: "", assumptionCategory: "",
  importanceScore: 3, uncertaintyScore: 3, evidenceExists: false, evidenceSummary: "",
};

export default function FounderAssumptions() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);

  const vid = { ventureId: selectedVentureId! };
  const { data: assumptions = [], refetch } = trpc.intake.assumptions.list.useQuery(vid, { enabled: !!selectedVentureId });
  const upsert = trpc.intake.assumptions.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); setEditing(null); setForm(EMPTY_FORM); toast.success("Assumption saved"); } });
  const del = trpc.intake.assumptions.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Assumption deleted"); } });
  const convert = trpc.intake.assumptions.convertToHypothesis.useMutation({ onSuccess: () => { toast.success("Converted to hypothesis — visible in Hypotheses tab"); } });

  function openNew() { setForm(EMPTY_FORM); setEditing(null); setOpen(true); }
  function openEdit(a: any) { setForm({ assumptionTitle: a.assumptionTitle, assumptionStatement: a.assumptionStatement, assumptionCategory: a.assumptionCategory ?? "", importanceScore: a.importanceScore ?? 3, uncertaintyScore: a.uncertaintyScore ?? 3, evidenceExists: a.evidenceExists ?? false, evidenceSummary: a.evidenceSummary ?? "" }); setEditing(a.id); setOpen(true); }
  function save() { upsert.mutate({ ...form, ventureId: selectedVentureId!, id: editing ?? undefined }); }

  const critical = assumptions.filter((a: any) => a.riskLevel === "critical");
  const high = assumptions.filter((a: any) => a.riskLevel === "high");
  const noEvidence = assumptions.filter((a: any) => !a.evidenceExists);

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Founder Assumptions"
        purpose="Capture what the founding team believes to be true before evidence exists. Every assumption must be scored for importance and uncertainty."
        icon={<ShieldAlert size={18} style={{ color: "#56A837" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} />Add Assumption</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {/* Summary stats */}
        {assumptions.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Assumptions", value: assumptions.length, color: "#1a2332" },
              { label: "Critical Risk", value: critical.length, color: "#dc2626" },
              { label: "High Risk", value: high.length, color: "#f97316" },
              { label: "No Evidence", value: noEvidence.length, color: "#d97706" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {critical.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl p-4 border" style={{ background: "#fee2e2", borderColor: "#fca5a5" }}>
            <AlertTriangle size={16} style={{ color: "#dc2626", marginTop: 2, flexShrink: 0 }} />
            <p className="text-sm font-medium" style={{ color: "#991b1b" }}>
              {critical.length} critical assumption{critical.length > 1 ? "s" : ""} with no evidence. Define riskiest assumption tests before proceeding to Discovery.
            </p>
          </div>
        )}

        {assumptions.length === 0 ? (
          <EmptyState title="No assumptions defined yet" description="Capture the founding team's beliefs before evidence exists. Every venture has hidden assumptions." action={<Button size="sm" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} className="mr-1" />Add First Assumption</Button>} />
        ) : (
          <div className="space-y-3">
            {[...assumptions].sort((a: any, b: any) => riskScore(b.importanceScore, b.uncertaintyScore) - riskScore(a.importanceScore, a.uncertaintyScore)).map((a: any) => {
              const rs = riskScore(a.importanceScore ?? 3, a.uncertaintyScore ?? 3);
              const rl = a.riskLevel ?? riskLabel(a.importanceScore ?? 3, a.uncertaintyScore ?? 3);
              const rc = RISK_COLORS[rl] ?? RISK_COLORS.medium;
              return (
                <div key={a.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline" className="text-xs capitalize" style={{ borderColor: rc.border, color: rc.text, background: rc.bg }}>
                          {rl} risk
                        </Badge>
                        {a.assumptionCategory && (
                          <Badge variant="outline" className="text-xs capitalize">{a.assumptionCategory.replace(/_/g, " ")}</Badge>
                        )}
                        <Badge variant="outline" className="text-xs" style={{ borderColor: a.evidenceExists ? "#22c55e" : "#dc2626", color: a.evidenceExists ? "#16a34a" : "#dc2626", background: a.evidenceExists ? "#dcfce7" : "#fee2e2" }}>
                          {a.evidenceExists ? "Evidence exists" : "No evidence"}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{a.assumptionTitle}</h4>
                      <p className="text-sm text-gray-600">{a.assumptionStatement}</p>
                      {a.evidenceSummary && <p className="text-xs text-gray-400 mt-2 italic">Evidence: {a.evidenceSummary}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-center px-3 py-2 rounded-lg" style={{ background: rc.bg, minWidth: 64 }}>
                        <div className="text-xs text-gray-500">Risk Score</div>
                        <div className="text-xl font-bold" style={{ color: rc.text }}>{rs}</div>
                        <div className="text-xs text-gray-400">{a.importanceScore}×{a.uncertaintyScore}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 px-2" style={{ color: "#56A837" }} onClick={() => convert.mutate({ id: a.id })} title="Convert to hypothesis">
                          <Zap size={11} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(a)}><Pencil size={12} /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => del.mutate({ id: a.id })}><Trash2 size={12} className="text-red-400" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Assumption" : "Add Founder Assumption"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Assumption Title *</label>
              <Input value={form.assumptionTitle} onChange={e => setForm(p => ({ ...p, assumptionTitle: e.target.value }))} placeholder="e.g. Customers will share operational data" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Assumption Statement *</label>
              <Textarea rows={3} value={form.assumptionStatement} onChange={e => setForm(p => ({ ...p, assumptionStatement: e.target.value }))} placeholder="We believe that..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
              <Select value={form.assumptionCategory} onValueChange={v => setForm(p => ({ ...p, assumptionCategory: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Importance Score (1–5)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setForm(p => ({ ...p, importanceScore: n }))}
                      className="w-9 h-9 rounded-lg text-sm font-semibold border transition-all"
                      style={{ background: form.importanceScore === n ? "#1a2332" : "white", color: form.importanceScore === n ? "white" : "#6b7280", borderColor: form.importanceScore === n ? "#1a2332" : "#e5e7eb" }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Uncertainty Score (1–5)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setForm(p => ({ ...p, uncertaintyScore: n }))}
                      className="w-9 h-9 rounded-lg text-sm font-semibold border transition-all"
                      style={{ background: form.uncertaintyScore === n ? "#1a2332" : "white", color: form.uncertaintyScore === n ? "white" : "#6b7280", borderColor: form.uncertaintyScore === n ? "#1a2332" : "#e5e7eb" }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-lg p-3 text-sm" style={{ background: "#f9fafb", borderColor: "#e5e7eb" }}>
              Risk Score: <strong>{form.importanceScore * form.uncertaintyScore}</strong> — <span className="capitalize font-semibold" style={{ color: RISK_COLORS[riskLabel(form.importanceScore, form.uncertaintyScore)].text }}>{riskLabel(form.importanceScore, form.uncertaintyScore)} risk</span>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.evidenceExists} onChange={e => setForm(p => ({ ...p, evidenceExists: e.target.checked }))} />
                Evidence already exists for this assumption
              </label>
            </div>
            {form.evidenceExists && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Summary</label>
                <Textarea rows={2} value={form.evidenceSummary} onChange={e => setForm(p => ({ ...p, evidenceSummary: e.target.value }))} placeholder="Briefly describe the existing evidence..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={save} disabled={!form.assumptionTitle || !form.assumptionStatement || upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save Assumption"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
