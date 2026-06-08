// ============================================================================
// UNIT ECONOMICS — Module 4, Sub-section 5
// CAC, LTV, Margin, Payback. Warns when LTV < CAC or payback > 18 months.
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
import { PieChart, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";
import { calcUnitEconomicsScore, ueWarnings } from "@/lib/proposition-scoring";

const CONFIDENCE_LEVELS = [
  { value: "assumption_only",     label: "Assumption Only" },
  { value: "early_estimate",      label: "Early Estimate" },
  { value: "partially_validated", label: "Partially Validated" },
  { value: "validated",           label: "Validated" },
  { value: "high_confidence",     label: "High Confidence" },
];

function scoreColor(n: number) {
  if (n >= 70) return { color: "#16a34a", bg: "#dcfce7" };
  if (n >= 50) return { color: "#0891b2", bg: "#cffafe" };
  if (n >= 30) return { color: "#d97706", bg: "#fef3c7" };
  return { color: "#dc2626", bg: "#fee2e2" };
}

const EMPTY = {
  modelName: "", bmHypothesisId: null as number | null,
  customerAcquisitionCost: null as number | null, lifetimeValue: null as number | null,
  grossMarginPct: null as number | null, contributionMargin: null as number | null,
  deliveryCost: null as number | null, supportCost: null as number | null,
  setupCost: null as number | null, expectedPaybackMonths: null as number | null,
  averageContractValue: null as number | null, expectedChurnRate: null as number | null,
  repeatPurchaseRate: null as number | null, assumptionsSummary: "",
  confidenceLevel: "assumption_only",
};

export default function UnitEconomics() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const vid = { ventureId: selectedVentureId! };
  const { data: models = [], refetch } = trpc.proposition.unitEcon.list.useQuery(vid, { enabled: !!selectedVentureId });
  const { data: bms = [] } = trpc.proposition.bm.list.useQuery(vid, { enabled: !!selectedVentureId });
  const upsert = trpc.proposition.unitEcon.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); setEditing(null); setForm(EMPTY); toast.success("Unit economics model saved"); } });
  const del = trpc.proposition.unitEcon.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Deleted"); } });

  function openNew() { setForm(EMPTY); setEditing(null); setOpen(true); }
  function openEdit(m: any) { setForm({ ...EMPTY, ...m }); setEditing(m.id); setOpen(true); }
  function save() { upsert.mutate({ ...form, modelName: form.modelName || "Unit Economics Model", ventureId: selectedVentureId!, id: editing ?? undefined }); }
  function ni(k: string) { return (v: string) => setForm(p => ({ ...p, [k]: v === "" ? null : parseInt(v) })); }
  function st(k: string) { return (v: string) => setForm(p => ({ ...p, [k]: v })); }

  const liveScore = calcUnitEconomicsScore(form);
  const warns = ueWarnings(form);

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Unit Economics"
        purpose="Model whether the business can become economically viable. Start with assumptions — these become more evidence-based as discovery progresses."
        icon={<PieChart size={18} style={{ color: "#56A837" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} />Add Model</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {(models as any[]).length === 0 ? (
          <EmptyState title="No unit economics model defined" description="Model CAC, LTV, gross margin, and payback period. Start with assumptions — flag them clearly." action={<Button size="sm" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} className="mr-1" />Add Model</Button>} />
        ) : (
          <div className="space-y-6">
            {(models as any[]).map((m) => {
              const score = calcUnitEconomicsScore(m);
              const sc = scoreColor(score);
              const warnings = ueWarnings(m);
              const ltv = m.lifetimeValue;
              const cac = m.customerAcquisitionCost;
              const ratio = ltv && cac && cac > 0 ? (ltv / cac).toFixed(1) : null;
              return (
                <div key={m.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                  <div className="p-5 border-b" style={{ borderColor: "#f3f4f6" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{m.modelName}</h3>
                        <Badge variant="outline" className="text-xs capitalize">{CONFIDENCE_LEVELS.find(c => c.value === m.confidenceLevel)?.label ?? m.confidenceLevel}</Badge>
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: sc.bg, color: sc.color }}>Confidence: {score}/100</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(m)}><Pencil size={13} /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => del.mutate({ id: m.id })}><Trash2 size={13} className="text-red-400" /></Button>
                      </div>
                    </div>
                    {warnings.map((w, i) => (
                      <div key={i} className="mt-2 flex items-start gap-2 text-xs p-2 rounded" style={{ background: "#fee2e2", color: "#991b1b" }}>
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />{w}
                      </div>
                    ))}
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[
                        { l: "CAC",              v: cac != null ? `£${cac.toLocaleString()}` : null,       col: "#6b7280" },
                        { l: "LTV",              v: ltv != null ? `£${ltv.toLocaleString()}` : null,       col: ratio && parseFloat(ratio) >= 3 ? "#16a34a" : "#dc2626" },
                        { l: "LTV:CAC",          v: ratio ? `${ratio}:1` : null,                           col: ratio && parseFloat(ratio) >= 3 ? "#16a34a" : "#dc2626" },
                        { l: "Gross Margin",     v: m.grossMarginPct != null ? `${m.grossMarginPct}%` : null, col: (m.grossMarginPct ?? 0) >= 40 ? "#16a34a" : "#d97706" },
                        { l: "Avg Contract",     v: m.averageContractValue != null ? `£${m.averageContractValue.toLocaleString()}` : null },
                        { l: "Payback Months",   v: m.expectedPaybackMonths != null ? `${m.expectedPaybackMonths}mo` : null, col: (m.expectedPaybackMonths ?? 99) <= 18 ? "#16a34a" : "#d97706" },
                        { l: "Churn Rate",       v: m.expectedChurnRate != null ? `${m.expectedChurnRate}%` : null },
                        { l: "Repeat Purchase",  v: m.repeatPurchaseRate != null ? `${m.repeatPurchaseRate}%` : null },
                      ].filter(x => x.v != null).map(x => (
                        <div key={x.l} className="rounded-lg p-3 text-center" style={{ background: "#f9fafb" }}>
                          <div className="text-xl font-bold" style={{ color: x.col ?? "#1a2332" }}>{x.v}</div>
                          <div className="text-xs text-gray-400">{x.l}</div>
                        </div>
                      ))}
                    </div>
                    {m.assumptionsSummary && (
                      <p className="text-xs text-gray-500 italic border-t pt-3" style={{ borderColor: "#f3f4f6" }}>{m.assumptionsSummary}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Unit Economics Model" : "Add Unit Economics Model"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Model Name *</label><Input value={form.modelName} onChange={e => st("modelName")(e.target.value)} placeholder="e.g. Year 1 Base Case" /></div>
            {bms.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Linked BM Hypothesis</label>
                <Select value={form.bmHypothesisId?.toString() ?? ""} onValueChange={v => setForm(p => ({ ...p, bmHypothesisId: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{(bms as any[]).map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.revenueModel?.replace(/_/g, " ") ?? `BM #${b.id}`}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">CAC (£)</label><Input type="number" min={0} value={form.customerAcquisitionCost ?? ""} onChange={e => ni("customerAcquisitionCost")(e.target.value)} placeholder="Customer acquisition cost" /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">LTV (£)</label><Input type="number" min={0} value={form.lifetimeValue ?? ""} onChange={e => ni("lifetimeValue")(e.target.value)} placeholder="Lifetime value" /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Gross Margin %</label><Input type="number" min={0} max={100} value={form.grossMarginPct ?? ""} onChange={e => ni("grossMarginPct")(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Average Contract Value (£)</label><Input type="number" min={0} value={form.averageContractValue ?? ""} onChange={e => ni("averageContractValue")(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Delivery Cost (£)</label><Input type="number" min={0} value={form.deliveryCost ?? ""} onChange={e => ni("deliveryCost")(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Support Cost (£)</label><Input type="number" min={0} value={form.supportCost ?? ""} onChange={e => ni("supportCost")(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Setup Cost (£)</label><Input type="number" min={0} value={form.setupCost ?? ""} onChange={e => ni("setupCost")(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Payback Months</label><Input type="number" min={0} value={form.expectedPaybackMonths ?? ""} onChange={e => ni("expectedPaybackMonths")(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Churn Rate %</label><Input type="number" min={0} max={100} value={form.expectedChurnRate ?? ""} onChange={e => ni("expectedChurnRate")(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Repeat Purchase Rate %</label><Input type="number" min={0} max={100} value={form.repeatPurchaseRate ?? ""} onChange={e => ni("repeatPurchaseRate")(e.target.value)} /></div>
            </div>
            {warns.length > 0 && (
              <div className="space-y-1">
                {warns.map((w, i) => (
                  <div key={i} className="text-xs p-2 rounded flex items-start gap-2" style={{ background: "#fee2e2", color: "#991b1b" }}>
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />{w}
                  </div>
                ))}
              </div>
            )}
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Assumptions Summary</label><Textarea rows={2} value={form.assumptionsSummary} onChange={e => st("assumptionsSummary")(e.target.value)} placeholder="Key assumptions behind these figures..." /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Confidence Level</label><Select value={form.confidenceLevel} onValueChange={st("confidenceLevel")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONFIDENCE_LEVELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="rounded-lg p-3 text-sm" style={{ background: "#f9fafb" }}>Confidence Score: <strong>{liveScore}/100</strong></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
