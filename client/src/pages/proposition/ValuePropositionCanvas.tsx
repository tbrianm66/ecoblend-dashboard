// ============================================================================
// VALUE PROPOSITION CANVAS — Module 4, Sub-section 1
// Customer Profile (jobs/pains/gains) + Value Map (products/relievers/creators)
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
import { Sparkles, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";
import { calcVPQualityScore, vpWarnings } from "@/lib/proposition-scoring";

const VP_STATUSES = ["draft","untested","testing","validated","invalidated","pivot_required","archived"];

const STATUS_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  draft:          { border: "#6b7280", bg: "#f3f4f6",  text: "#6b7280" },
  untested:       { border: "#6b7280", bg: "#f3f4f6",  text: "#6b7280" },
  testing:        { border: "#0891b2", bg: "#cffafe",  text: "#0891b2" },
  validated:      { border: "#16a34a", bg: "#dcfce7",  text: "#16a34a" },
  invalidated:    { border: "#dc2626", bg: "#fee2e2",  text: "#dc2626" },
  pivot_required: { border: "#9333ea", bg: "#f5f3ff",  text: "#9333ea" },
  archived:       { border: "#9ca3af", bg: "#f9fafb",  text: "#9ca3af" },
};

const EMPTY = {
  title: "", statement: "", customerJob: "", painsRelieved: "", gainsCreated: "",
  measurableOutcome: "", differentiationClaim: "", evidenceRequired: "",
  productsServices: "", currentAlternatives: "", buyingTriggers: "", adoptionBarriers: "",
  status: "draft",
};

export default function ValuePropositionCanvas() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);

  const vid = { ventureId: selectedVentureId! };
  const { data: vps = [], refetch } = trpc.proposition.vp.list.useQuery(vid, { enabled: !!selectedVentureId });
  const upsert = trpc.proposition.vp.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); setEditing(null); setForm(EMPTY); toast.success("Value proposition saved"); } });
  const del = trpc.proposition.vp.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Deleted"); } });

  function openNew()    { setForm(EMPTY); setEditing(null); setOpen(true); }
  function openEdit(v: any) { setForm({ ...EMPTY, ...v }); setEditing(v.id); setOpen(true); }
  function save()       { upsert.mutate({ ...form, ventureId: selectedVentureId!, id: editing ?? undefined }); }
  function f(k: string) { return (v: string) => setForm(p => ({ ...p, [k]: v })); }

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Value Proposition Canvas"
        purpose="Connect the customer's jobs, pains, and gains to the venture's proposed products, pain relievers, and gain creators. Define measurable outcomes."
        icon={<Sparkles size={18} style={{ color: "#56A837" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} />Add Value Proposition</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {vps.length === 0 ? (
          <EmptyState title="No value propositions defined" description="Start by defining how the venture's solution relieves customer pains and creates gains." action={<Button size="sm" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} className="mr-1" />Add First VP</Button>} />
        ) : (
          <div className="space-y-6">
            {(vps as any[]).map((vp) => {
              const score = calcVPQualityScore(vp);
              const warns = vpWarnings(vp);
              const sc = STATUS_COLORS[vp.status] ?? STATUS_COLORS.draft;
              return (
                <div key={vp.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                  {/* VP header */}
                  <div className="p-5 border-b" style={{ borderColor: "#f3f4f6" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant="outline" className="text-xs capitalize" style={{ borderColor: sc.border, color: sc.text, background: sc.bg }}>{vp.status}</Badge>
                          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: score >= 70 ? "rgba(86,168,55,0.1)" : "rgba(245,158,11,0.1)", color: score >= 70 ? "#56A837" : "#d97706" }}>
                            Quality Score: {score}/100
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{vp.title}</h3>
                        {vp.statement && <p className="text-sm text-gray-600 mt-1">{vp.statement}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(vp)}><Pencil size={13} /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => del.mutate({ id: vp.id })}><Trash2 size={13} className="text-red-400" /></Button>
                      </div>
                    </div>
                    {warns.map((w, i) => (
                      <div key={i} className="mt-2 flex items-start gap-2 text-xs p-2 rounded" style={{ background: "#fef3c7", color: "#92400e" }}>
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />{w}
                      </div>
                    ))}
                  </div>

                  {/* Two-panel canvas */}
                  <div className="grid grid-cols-2 divide-x" style={{ borderColor: "#f3f4f6" }}>
                    {/* Customer Profile */}
                    <div className="p-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer Profile</p>
                      <div className="space-y-3">
                        {[
                          { l: "Customer Job",        v: vp.customerJob },
                          { l: "Pains Relieved",      v: vp.painsRelieved },
                          { l: "Gains Created",       v: vp.gainsCreated },
                          { l: "Current Alternatives",v: vp.currentAlternatives },
                          { l: "Buying Triggers",     v: vp.buyingTriggers },
                          { l: "Adoption Barriers",   v: vp.adoptionBarriers },
                        ].map(({ l, v }) => (
                          <div key={l}>
                            <span className="text-xs font-semibold text-gray-400 block mb-0.5">{l}</span>
                            {v ? <p className="text-sm text-gray-700">{v}</p> : <p className="text-xs text-gray-300 italic">Not defined</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Value Map */}
                    <div className="p-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Value Map</p>
                      <div className="space-y-3">
                        {[
                          { l: "Products / Services",         v: vp.productsServices },
                          { l: "Measurable Customer Outcome", v: vp.measurableOutcome },
                          { l: "Differentiation Claim",       v: vp.differentiationClaim },
                          { l: "Evidence Required",           v: vp.evidenceRequired },
                        ].map(({ l, v }) => (
                          <div key={l}>
                            <span className="text-xs font-semibold text-gray-400 block mb-0.5">{l}</span>
                            {v ? <p className="text-sm text-gray-700">{v}</p> : <p className="text-xs text-gray-300 italic">Not defined</p>}
                          </div>
                        ))}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Value Proposition" : "Add Value Proposition"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">Title *</label><Input value={form.title} onChange={e => f("title")(e.target.value)} placeholder="e.g. Reliability intelligence for bus operators" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">VP Statement *</label><Textarea rows={2} value={form.statement} onChange={e => f("statement")(e.target.value)} placeholder="We help [customer] who want to [job] by [value] unlike [alternative]." /></div>
            <div className="col-span-2 border-t pt-4"><p className="text-xs font-bold text-gray-700 mb-3">CUSTOMER PROFILE</p></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">Customer Job</label><Textarea rows={2} value={form.customerJob} onChange={e => f("customerJob")(e.target.value)} placeholder="What is the customer trying to achieve?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Pains Relieved</label><Textarea rows={3} value={form.painsRelieved} onChange={e => f("painsRelieved")(e.target.value)} placeholder="Pains your product removes..." /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Gains Created</label><Textarea rows={3} value={form.gainsCreated} onChange={e => f("gainsCreated")(e.target.value)} placeholder="Positive outcomes your product creates..." /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Current Alternatives</label><Textarea rows={2} value={form.currentAlternatives} onChange={e => f("currentAlternatives")(e.target.value)} placeholder="How is the customer solving this today?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Buying Triggers</label><Textarea rows={2} value={form.buyingTriggers} onChange={e => f("buyingTriggers")(e.target.value)} placeholder="What events trigger the buying decision?" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">Adoption Barriers</label><Textarea rows={2} value={form.adoptionBarriers} onChange={e => f("adoptionBarriers")(e.target.value)} placeholder="What stops customers from switching?" /></div>
            <div className="col-span-2 border-t pt-4"><p className="text-xs font-bold text-gray-700 mb-3">VALUE MAP</p></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">Products / Services</label><Textarea rows={2} value={form.productsServices} onChange={e => f("productsServices")(e.target.value)} placeholder="What products or services are you offering?" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">Measurable Customer Outcome</label><Textarea rows={2} value={form.measurableOutcome} onChange={e => f("measurableOutcome")(e.target.value)} placeholder="e.g. Reduce avoidable downtime by >15% within 12 months" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">Differentiation Claim</label><Textarea rows={2} value={form.differentiationClaim} onChange={e => f("differentiationClaim")(e.target.value)} placeholder="What makes this genuinely different? Be specific." /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Required</label><Textarea rows={2} value={form.evidenceRequired} onChange={e => f("evidenceRequired")(e.target.value)} placeholder="What evidence would validate this VP?" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label><Select value={form.status} onValueChange={f("status")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VP_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="text-xs text-gray-400 pb-1">Live score: <strong className="text-gray-700">{calcVPQualityScore(form)}/100</strong></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={save} disabled={!form.title || !form.statement || upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
