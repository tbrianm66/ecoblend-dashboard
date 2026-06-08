// ============================================================================
// PIVOT HISTORY — Module 4, Sub-section 7
// Reuses existing pivot_log table. Filtered by ventureId.
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
import { RotateCcw, Plus } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

const PIVOT_TYPES = [
  { value: "customer_segment",      label: "Customer Segment" },
  { value: "customer_need",         label: "Customer Need" },
  { value: "value_proposition",     label: "Value Proposition" },
  { value: "revenue_model",         label: "Revenue Model" },
  { value: "pricing",               label: "Pricing" },
  { value: "channel",               label: "Channel" },
  { value: "business_architecture", label: "Business Architecture" },
  { value: "value_capture",         label: "Value Capture" },
  { value: "platform",              label: "Platform" },
  { value: "technology",            label: "Technology" },
  { value: "delivery_model",        label: "Delivery Model" },
];

const PIVOT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  customer_segment:      { border: "#7c3aed", bg: "#ede9fe", text: "#7c3aed" },
  customer_need:         { border: "#dc2626", bg: "#fee2e2", text: "#dc2626" },
  value_proposition:     { border: "#0891b2", bg: "#cffafe", text: "#0891b2" },
  revenue_model:         { border: "#d97706", bg: "#fef3c7", text: "#d97706" },
  pricing:               { border: "#9333ea", bg: "#f5f3ff", text: "#9333ea" },
  channel:               { border: "#0ea5e9", bg: "#e0f2fe", text: "#0ea5e9" },
  business_architecture: { border: "#dc2626", bg: "#fee2e2", text: "#dc2626" },
  value_capture:         { border: "#f97316", bg: "#fff7ed", text: "#ea580c" },
};

const EMPTY = { pivotType: "value_proposition", previousHypothesis: "", newHypothesis: "", triggerEvent: "", loggedBy: "" };

export default function PivotHistory() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const vid = { ventureId: selectedVentureId! };
  const { data: pivots = [], refetch } = trpc.proposition.pivots.list.useQuery(vid, { enabled: !!selectedVentureId });
  const create = trpc.proposition.pivots.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); setForm(EMPTY); toast.success("Pivot logged"); } });

  function save() { create.mutate({ ...form, ventureId: selectedVentureId! }); }
  function f(k: string) { return (v: string) => setForm(p => ({ ...p, [k]: v })); }

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Pivot History"
        purpose="Every major change to the value proposition, customer job, revenue model, pricing model, channel, or business architecture should be recorded as a structured pivot."
        icon={<RotateCcw size={18} style={{ color: "#56A837" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={() => { setForm(EMPTY); setOpen(true); }}><Plus size={14} />Log Pivot</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {(pivots as any[]).length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Pivots", value: (pivots as any[]).length },
              { label: "VP Pivots",    value: (pivots as any[]).filter(p => p.pivotType?.includes("value_proposition")).length },
              { label: "Model Pivots", value: (pivots as any[]).filter(p => p.pivotType?.includes("revenue") || p.pivotType?.includes("business")).length },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {(pivots as any[]).length === 0 ? (
          <EmptyState
            title="No pivots recorded"
            description="When evidence contradicts the value proposition or business model, log the pivot. Pivot history demonstrates learning — not failure."
            action={<Button size="sm" style={{ background: "#56A837" }} onClick={() => { setForm(EMPTY); setOpen(true); }}><Plus size={14} className="mr-1" />Log First Pivot</Button>}
          />
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ background: "#e5e7eb" }} />
            <div className="space-y-4 pl-16">
              {(pivots as any[]).map((p, i) => {
                const tc = PIVOT_COLORS[p.pivotType] ?? { border: "#6b7280", bg: "#f3f4f6", text: "#6b7280" };
                const label = PIVOT_TYPES.find(t => t.value === p.pivotType)?.label ?? p.pivotType;
                return (
                  <div key={p.id} className="relative bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
                    {/* Timeline dot */}
                    <div className="absolute -left-10 top-5 w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ background: "white", borderColor: tc.border, left: "-2.75rem" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: tc.border }} />
                    </div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs" style={{ borderColor: tc.border, color: tc.text, background: tc.bg }}>{label}</Badge>
                        <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        {p.loggedBy && <span className="text-xs text-gray-400">— {p.loggedBy}</span>}
                        {p.canvasVersion && <span className="text-xs text-gray-400">Canvas v{p.canvasVersion}</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {p.previousHypothesis && (
                        <div>
                          <span className="text-xs font-semibold text-gray-400 block mb-1">Before</span>
                          <p className="text-gray-700 text-sm leading-relaxed p-3 rounded" style={{ background: "#fee2e2" }}>{p.previousHypothesis}</p>
                        </div>
                      )}
                      {p.newHypothesis && (
                        <div>
                          <span className="text-xs font-semibold text-gray-400 block mb-1">After</span>
                          <p className="text-gray-700 text-sm leading-relaxed p-3 rounded" style={{ background: "#dcfce7" }}>{p.newHypothesis}</p>
                        </div>
                      )}
                    </div>
                    {p.triggerEvent && (
                      <div className="mt-3 pt-3 border-t text-xs text-gray-500" style={{ borderColor: "#f3f4f6" }}>
                        <span className="font-semibold text-gray-400">Evidence trigger: </span>{p.triggerEvent}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log a Pivot</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Pivot Type *</label>
              <Select value={form.pivotType} onValueChange={f("pivotType")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PIVOT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Previous Hypothesis/Model</label>
              <Textarea rows={3} value={form.previousHypothesis} onChange={e => f("previousHypothesis")(e.target.value)} placeholder="What did you believe before the evidence changed your view?" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">New Hypothesis/Model</label>
              <Textarea rows={3} value={form.newHypothesis} onChange={e => f("newHypothesis")(e.target.value)} placeholder="What do you now believe based on the evidence?" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Trigger</label>
              <Textarea rows={2} value={form.triggerEvent} onChange={e => f("triggerEvent")(e.target.value)} placeholder="What evidence or event triggered this pivot?" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Logged By</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.loggedBy} onChange={e => f("loggedBy")(e.target.value)} placeholder="Name or role..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={save} disabled={create.isPending}>{create.isPending ? "Saving…" : "Log Pivot"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
