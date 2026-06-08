// ============================================================================
// REVENUE MODEL TEST — Module 4, Sub-section 4
// Tests commercial plausibility: conversion rate × WTP evidence × budget validation
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
import { BarChart2, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";
import { calcRevenueEvidenceScore } from "@/lib/proposition-scoring";

const REVENUE_MODELS = [
  "subscription","licence","paid_pilot","consultancy_plus_platform","product_sales",
  "service_fee","success_fee","data_partnership","co_development","transaction_fee","hybrid",
];
const TEST_METHODS = [
  { value: "pricing_interview",        label: "Pricing Interview" },
  { value: "paid_pilot_offer",         label: "Paid Pilot Offer" },
  { value: "proposal_test",            label: "Proposal Test" },
  { value: "loi_test",                 label: "LOI Test" },
  { value: "landing_page_test",        label: "Landing Page Test" },
  { value: "concierge_offer",          label: "Concierge Offer" },
  { value: "procurement_conversation", label: "Procurement Conversation" },
  { value: "subscription_offer",       label: "Subscription Offer" },
  { value: "licence_offer",            label: "Licence Offer" },
];
const STATUSES = ["planned","in_progress","complete","inconclusive","pivoted"];

function scoreColor(n: number) {
  if (n >= 70) return { color: "#16a34a", bg: "#dcfce7" };
  if (n >= 50) return { color: "#0891b2", bg: "#cffafe" };
  if (n >= 30) return { color: "#d97706", bg: "#fef3c7" };
  return { color: "#dc2626", bg: "#fee2e2" };
}

const EMPTY = {
  revenueModelTested: "", testMethod: "", targetSegment: "", pricePointTested: "", valueMetric: "",
  expectedBehaviour: "", sampleSize: 0, positiveResponses: 0, negativeResponses: 0,
  conversionRate: 0, revenueSignalScore: 0, learningSummary: "", recommendedNextTest: "",
  status: "planned", bmHypothesisId: null as number | null,
};

export default function RevenueModelTest() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const vid = { ventureId: selectedVentureId! };
  const { data: tests = [], refetch } = trpc.proposition.revenue.list.useQuery(vid, { enabled: !!selectedVentureId });
  const { data: bms = [] } = trpc.proposition.bm.list.useQuery(vid, { enabled: !!selectedVentureId });
  const upsert = trpc.proposition.revenue.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); setEditing(null); setForm(EMPTY); toast.success("Revenue test saved"); } });
  const del = trpc.proposition.revenue.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Deleted"); } });

  function openNew() { setForm(EMPTY); setEditing(null); setOpen(true); }
  function openEdit(t: any) { setForm({ ...EMPTY, ...t }); setEditing(t.id); setOpen(true); }
  function save() { upsert.mutate({ ...form, ventureId: selectedVentureId!, id: editing ?? undefined }); }
  function n(k: string) { return (v: string) => setForm(p => ({ ...p, [k]: parseInt(v) || 0 })); }
  function s(k: string) { return (v: string) => setForm(p => ({ ...p, [k]: v })); }

  const liveScore = calcRevenueEvidenceScore(form);

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Revenue Model Test"
        purpose="Test whether the selected revenue model is commercially plausible. Link to WTP evidence. Warning: fewer than 5 interactions = unreliable conversion signal."
        icon={<BarChart2 size={18} style={{ color: "#56A837" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} />Add Revenue Test</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {(tests as any[]).length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Tests Run",       value: (tests as any[]).length },
              { label: "Best Conv Rate",  value: `${Math.max(...(tests as any[]).map(t => t.conversionRate ?? 0))}%`, color: "#56A837" },
              { label: "Avg Signal",      value: `${Math.round((tests as any[]).reduce((s, t) => s + (t.revenueSignalScore ?? 0), 0) / (tests as any[]).length)}` },
              { label: "Total Sample",    value: (tests as any[]).reduce((s, t) => s + (t.sampleSize ?? 0), 0) },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                <div className="text-2xl font-bold" style={{ color: stat.color ?? "#1a2332" }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {(tests as any[]).length === 0 ? (
          <EmptyState title="No revenue tests run yet" description="Test whether customers will actually pay using your selected revenue model. Use paid pilots, LOI tests, or pricing interviews." action={<Button size="sm" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} className="mr-1" />Add First Test</Button>} />
        ) : (
          <div className="space-y-4">
            {(tests as any[]).map((t) => {
              const sc = scoreColor(calcRevenueEvidenceScore(t));
              const cr = t.sampleSize > 0 ? Math.round((t.positiveResponses / t.sampleSize) * 100) : t.conversionRate;
              return (
                <div key={t.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <Badge variant="outline" className="text-xs capitalize">{(t.status ?? "planned").replace(/_/g, " ")}</Badge>
                        {t.revenueModelTested && <Badge variant="outline" className="text-xs capitalize">{t.revenueModelTested.replace(/_/g, " ")}</Badge>}
                        {t.testMethod && <Badge variant="outline" className="text-xs">{TEST_METHODS.find(m => m.value === t.testMethod)?.label ?? t.testMethod}</Badge>}
                        {(t.sampleSize ?? 0) > 0 && (t.sampleSize < 5) && (
                          <span className="text-xs flex items-center gap-1" style={{ color: "#d97706" }}><AlertTriangle size={11} />Sample &lt;5</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                        {[
                          { l: "Sample Size",      v: t.sampleSize },
                          { l: "Positive",         v: t.positiveResponses },
                          { l: "Negative",         v: t.negativeResponses },
                          { l: "Conversion Rate",  v: `${cr ?? 0}%` },
                        ].map(x => (
                          <div key={x.l} className="rounded-lg p-3 text-center" style={{ background: "#f9fafb" }}>
                            <div className="text-lg font-bold text-gray-900">{x.v}</div>
                            <div className="text-gray-400">{x.l}</div>
                          </div>
                        ))}
                      </div>
                      {t.pricePointTested && <p className="text-xs text-gray-500 mb-2"><span className="font-semibold">Price tested:</span> {t.pricePointTested}</p>}
                      {t.learningSummary && <p className="text-xs text-gray-600 mt-2 p-3 rounded" style={{ background: "#f9fafb" }}><span className="font-semibold text-gray-400 block mb-1">Learning:</span>{t.learningSummary}</p>}
                      {t.recommendedNextTest && <p className="text-xs mt-2" style={{ color: "#56A837" }}>→ {t.recommendedNextTest}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-center px-3 py-2 rounded-lg" style={{ background: sc.bg, minWidth: 72 }}>
                        <div className="text-xs" style={{ color: sc.color }}>Evidence Score</div>
                        <div className="text-2xl font-bold" style={{ color: sc.color }}>{calcRevenueEvidenceScore(t)}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(t)}><Pencil size={13} /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => del.mutate({ id: t.id })}><Trash2 size={13} className="text-red-400" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Revenue Test" : "Add Revenue Model Test"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {bms.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Linked Business Model Hypothesis</label>
                <Select value={form.bmHypothesisId?.toString() ?? ""} onValueChange={v => setForm(p => ({ ...p, bmHypothesisId: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{(bms as any[]).map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.revenueModel?.replace(/_/g, " ") ?? `BM #${b.id}`}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Revenue Model Tested</label><Select value={form.revenueModelTested} onValueChange={s("revenueModelTested")}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{REVENUE_MODELS.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Test Method</label><Select value={form.testMethod} onValueChange={s("testMethod")}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{TEST_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Target Segment</label><Input value={form.targetSegment} onChange={e => s("targetSegment")(e.target.value)} placeholder="Who was this test run with?" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Price Point Tested</label><Input value={form.pricePointTested} onChange={e => s("pricePointTested")(e.target.value)} placeholder="e.g. £500/month, £12k pilot" /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Value Metric</label><Input value={form.valueMetric} onChange={e => s("valueMetric")(e.target.value)} placeholder="e.g. per seat, per kg, per site" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Sample Size</label><Input type="number" min={0} value={form.sampleSize} onChange={e => n("sampleSize")(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Positive</label><Input type="number" min={0} value={form.positiveResponses} onChange={e => n("positiveResponses")(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Negative</label><Input type="number" min={0} value={form.negativeResponses} onChange={e => n("negativeResponses")(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Conversion Rate %</label><Input type="number" min={0} max={100} value={form.conversionRate} onChange={e => n("conversionRate")(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Revenue Signal Score (0-100)</label><Input type="number" min={0} max={100} value={form.revenueSignalScore} onChange={e => n("revenueSignalScore")(e.target.value)} /></div>
            </div>
            <div className="rounded-lg p-3 text-sm" style={{ background: "#f9fafb" }}>
              Evidence Score: <strong>{liveScore}</strong>
              {form.sampleSize < 5 && form.sampleSize > 0 && <span className="ml-2 text-xs" style={{ color: "#d97706" }}>⚠ Sample size too small for reliable confidence</span>}
            </div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Learning Summary</label><Textarea rows={3} value={form.learningSummary} onChange={e => s("learningSummary")(e.target.value)} placeholder="What did you learn from this test?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Recommended Next Test</label><Textarea rows={2} value={form.recommendedNextTest} onChange={e => s("recommendedNextTest")(e.target.value)} placeholder="What should be tested next based on this result?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label><Select value={form.status} onValueChange={s("status")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(st => <SelectItem key={st} value={st} className="capitalize">{st.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
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
