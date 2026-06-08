// ============================================================================
// BUSINESS MODEL HYPOTHESIS — Module 4, Sub-section 3
// Revenue model, channel, delivery, costs, scalability, unfair advantage.
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
import { Layers, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";
import { calcBMReadinessScore } from "@/lib/proposition-scoring";

const REVENUE_MODELS = [
  { value: "subscription",            label: "Subscription" },
  { value: "licence",                 label: "Licence" },
  { value: "paid_pilot",              label: "Paid Pilot" },
  { value: "consultancy_plus_platform",label: "Consultancy + Platform" },
  { value: "product_sales",           label: "Product Sales" },
  { value: "service_fee",             label: "Service Fee" },
  { value: "success_fee",             label: "Success Fee" },
  { value: "data_partnership",        label: "Data Partnership" },
  { value: "co_development",          label: "Co-Development" },
  { value: "transaction_fee",         label: "Transaction Fee" },
  { value: "hybrid",                  label: "Hybrid" },
];
const STATUSES = ["draft","untested","testing","validated","invalidated","pivot_required","archived"];

const STATUS_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  draft:          { border: "#6b7280", bg: "#f3f4f6", text: "#6b7280" },
  untested:       { border: "#6b7280", bg: "#f3f4f6", text: "#6b7280" },
  testing:        { border: "#0891b2", bg: "#cffafe", text: "#0891b2" },
  validated:      { border: "#16a34a", bg: "#dcfce7", text: "#16a34a" },
  invalidated:    { border: "#dc2626", bg: "#fee2e2", text: "#dc2626" },
  pivot_required: { border: "#9333ea", bg: "#f5f3ff", text: "#9333ea" },
  archived:       { border: "#9ca3af", bg: "#f9fafb", text: "#9ca3af" },
};

const EMPTY = {
  revenueModel: "", pricingAssumption: "", deliveryModel: "", salesChannel: "",
  costDrivers: "", keyPartners: "", scalabilityAssumption: "", unfairAdvantage: "",
  dataMoatAssumption: "", sustainabilityAssumption: "", evidenceRequired: "",
  testMethod: "", successMetric: "", status: "draft", valuePropositionId: null as number | null,
};

export default function BusinessModelHypothesis() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const vid = { ventureId: selectedVentureId! };
  const { data: bms = [], refetch } = trpc.proposition.bm.list.useQuery(vid, { enabled: !!selectedVentureId });
  const { data: vps = [] } = trpc.proposition.vp.list.useQuery(vid, { enabled: !!selectedVentureId });
  const upsert = trpc.proposition.bm.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); setEditing(null); setForm(EMPTY); toast.success("Business model hypothesis saved"); } });
  const del = trpc.proposition.bm.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Deleted"); } });

  function openNew() { setForm(EMPTY); setEditing(null); setOpen(true); }
  function openEdit(b: any) { setForm({ ...EMPTY, ...b }); setEditing(b.id); setOpen(true); }
  function save() { upsert.mutate({ ...form, ventureId: selectedVentureId!, id: editing ?? undefined }); }
  function f(k: string) { return (v: any) => setForm(p => ({ ...p, [k]: v })); }

  const liveScore = calcBMReadinessScore(form);

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Business Model Hypothesis"
        purpose="Define how the venture creates, delivers, and captures value. Every assumption must be testable through an experiment."
        icon={<Layers size={18} style={{ color: "#56A837" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} />Add BM Hypothesis</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {(bms as any[]).length === 0 ? (
          <EmptyState title="No business model hypotheses" description="Define how the venture creates, delivers, and captures value. Start with the revenue model assumption." action={<Button size="sm" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} className="mr-1" />Add First Hypothesis</Button>} />
        ) : (
          <div className="space-y-4">
            {(bms as any[]).map((bm) => {
              const score = calcBMReadinessScore(bm);
              const sc = STATUS_COLORS[bm.status] ?? STATUS_COLORS.draft;
              return (
                <div key={bm.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize" style={{ borderColor: sc.border, color: sc.text, background: sc.bg }}>{bm.status}</Badge>
                      {bm.revenueModel && <Badge variant="outline" className="text-xs">{REVENUE_MODELS.find(r => r.value === bm.revenueModel)?.label ?? bm.revenueModel}</Badge>}
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: score >= 60 ? "rgba(86,168,55,0.1)" : "rgba(245,158,11,0.1)", color: score >= 60 ? "#56A837" : "#d97706" }}>
                        Readiness: {score}/100
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(bm)}><Pencil size={13} /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => del.mutate({ id: bm.id })}><Trash2 size={13} className="text-red-400" /></Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-600">
                    {[
                      { l: "Revenue Model",    v: REVENUE_MODELS.find(r => r.value === bm.revenueModel)?.label },
                      { l: "Pricing Assumption", v: bm.pricingAssumption },
                      { l: "Delivery Model",   v: bm.deliveryModel },
                      { l: "Sales Channel",    v: bm.salesChannel },
                      { l: "Cost Drivers",     v: bm.costDrivers },
                      { l: "Key Partners",     v: bm.keyPartners },
                      { l: "Scalability",      v: bm.scalabilityAssumption },
                      { l: "Unfair Advantage", v: bm.unfairAdvantage },
                      { l: "Data Moat",        v: bm.dataMoatAssumption },
                    ].filter(x => x.v).map(x => (
                      <div key={x.l}><span className="font-semibold text-gray-400 block mb-0.5">{x.l}</span><p className="line-clamp-2">{x.v}</p></div>
                    ))}
                  </div>

                  {score < 60 && (
                    <div className="mt-4 flex items-start gap-2 text-xs p-2 rounded" style={{ background: "#fef3c7", color: "#92400e" }}>
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />Business model hypothesis is incomplete — readiness score {score}/100.
                    </div>
                  )}
                  {!bm.evidenceRequired && (
                    <div className="mt-2 flex items-start gap-2 text-xs p-2 rounded" style={{ background: "#fee2e2", color: "#991b1b" }}>
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />Business model cannot be tested until evidence criteria are defined.
                    </div>
                  )}

                  {(bm.evidenceRequired || bm.successMetric) && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-xs" style={{ borderColor: "#f3f4f6" }}>
                      {bm.evidenceRequired && <div><span className="font-semibold text-gray-400 block mb-0.5">Evidence Required</span>{bm.evidenceRequired}</div>}
                      {bm.successMetric && <div><span className="font-semibold text-gray-400 block mb-0.5">Success Metric</span>{bm.successMetric}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Business Model Hypothesis" : "Add Business Model Hypothesis"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {vps.length > 0 && (
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Linked Value Proposition</label>
                <Select value={form.valuePropositionId?.toString() ?? ""} onValueChange={v => setForm(p => ({ ...p, valuePropositionId: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select VP..." /></SelectTrigger>
                  <SelectContent>{(vps as any[]).map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Revenue Model</label><Select value={form.revenueModel} onValueChange={f("revenueModel")}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{REVENUE_MODELS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label><Select value={form.status} onValueChange={f("status")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">Pricing Assumption</label><Textarea rows={2} value={form.pricingAssumption} onChange={e => f("pricingAssumption")(e.target.value)} placeholder="What do you believe customers will pay and why?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Delivery Model</label><Textarea rows={2} value={form.deliveryModel} onChange={e => f("deliveryModel")(e.target.value)} placeholder="How is the product/service delivered?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Sales Channel</label><Textarea rows={2} value={form.salesChannel} onChange={e => f("salesChannel")(e.target.value)} placeholder="How does the customer find and buy?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Cost Drivers</label><Textarea rows={2} value={form.costDrivers} onChange={e => f("costDrivers")(e.target.value)} placeholder="Key cost components..." /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Key Partners</label><Textarea rows={2} value={form.keyPartners} onChange={e => f("keyPartners")(e.target.value)} placeholder="Who must this work rely on?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Scalability Assumption</label><Textarea rows={2} value={form.scalabilityAssumption} onChange={e => f("scalabilityAssumption")(e.target.value)} placeholder="How does this scale economically?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Unfair Advantage</label><Textarea rows={2} value={form.unfairAdvantage} onChange={e => f("unfairAdvantage")(e.target.value)} placeholder="What cannot be easily copied?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Data Moat Assumption</label><Textarea rows={2} value={form.dataMoatAssumption} onChange={e => f("dataMoatAssumption")(e.target.value)} placeholder="Proprietary data advantage potential?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Sustainability Assumption</label><Textarea rows={2} value={form.sustainabilityAssumption} onChange={e => f("sustainabilityAssumption")(e.target.value)} placeholder="ESG/circular economy angle..." /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Required *</label><Textarea rows={2} value={form.evidenceRequired} onChange={e => f("evidenceRequired")(e.target.value)} placeholder="What evidence is needed to validate this model?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Test Method</label><Textarea rows={2} value={form.testMethod} onChange={e => f("testMethod")(e.target.value)} placeholder="How will you test this?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Success Metric</label><Textarea rows={2} value={form.successMetric} onChange={e => f("successMetric")(e.target.value)} placeholder="How will you know it is validated?" /></div>
          </div>
          <div className="text-xs text-gray-400 pb-1">Readiness score: <strong className="text-gray-700">{liveScore}/100</strong></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
