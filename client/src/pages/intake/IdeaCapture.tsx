// ============================================================================
// IDEA CAPTURE — Venture Intake sub-section
// Captures structured venture ideas — all labelled assumption-led / unvalidated
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
import { Lightbulb, Plus, Pencil, Trash2, AlertTriangle, ChevronRight } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

const ORIGIN_SOURCES = [
  { value: "founder_idea",           label: "Founder Idea" },
  { value: "customer_problem",       label: "Customer Problem" },
  { value: "university_research",    label: "University Research" },
  { value: "supplier_signal",        label: "Supplier Signal" },
  { value: "market_signal",          label: "Market Signal" },
  { value: "regulatory_signal",      label: "Regulatory Signal" },
  { value: "portfolio_extension",    label: "Portfolio Extension" },
  { value: "partner_request",        label: "Partner Request" },
  { value: "operational_problem",    label: "Operational Problem" },
];

const EMPTY_FORM = {
  ideaTitle: "", ideaSummary: "", originSource: "", targetSector: "",
  targetCustomer: "", problemArea: "", proposedSolution: "", whyNow: "",
  strategicRelevance: "", sustainabilityRelevance: "", dataMoatPotential: "", founderNotes: "",
};

function ideaCompleteness(idea: typeof EMPTY_FORM | Record<string, any>) {
  const fields = [idea.ideaSummary, idea.targetCustomer, idea.problemArea, idea.proposedSolution, idea.whyNow, idea.strategicRelevance];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

export default function IdeaCapture() {
  const { selectedVentureId, selectedVenture } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const vid = { ventureId: selectedVentureId! };
  const { data: ideas = [], refetch } = trpc.intake.ideas.list.useQuery(vid, { enabled: !!selectedVentureId });
  const upsert = trpc.intake.ideas.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); setEditing(null); setForm(EMPTY_FORM); toast.success("Idea saved"); } });
  const del = trpc.intake.ideas.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Idea deleted"); } });

  function openNew() { setForm(EMPTY_FORM); setEditing(null); setOpen(true); }
  function openEdit(idea: any) { setForm({ ...EMPTY_FORM, ...idea }); setEditing(idea.id); setOpen(true); }
  function save() { upsert.mutate({ ...form, ventureId: selectedVentureId!, id: editing ?? undefined }); }
  function f(k: string) { return (v: string) => setForm(p => ({ ...p, [k]: v })); }

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Idea Capture"
        purpose="Structure the venture idea before validation begins. All ideas are labelled assumption-led and unvalidated until evidence exists."
        icon={<Lightbulb size={18} style={{ color: "#56A837" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} />Add Idea</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {/* Stats bar */}
        {ideas.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Ideas", value: ideas.length },
              { label: "Avg Completeness", value: `${Math.round(ideas.reduce((s, i) => s + ideaCompleteness(i), 0) / ideas.length)}%` },
              { label: "Status", value: "Assumption-led" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className="text-xl font-bold text-gray-900">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-xl p-4 border" style={{ background: "#fffbeb", borderColor: "#fcd34d" }}>
          <AlertTriangle size={16} style={{ color: "#d97706", marginTop: 2, flexShrink: 0 }} />
          <p className="text-sm" style={{ color: "#92400e" }}>
            All ideas captured here are <strong>assumption-led and unvalidated</strong>. They must pass through Assumptions → Hypotheses → Riskiest Assumption before proceeding to Discovery &amp; Market.
          </p>
        </div>

        {/* Ideas list */}
        {ideas.length === 0 ? (
          <EmptyState title="No ideas captured yet" description="Add the venture's first structured idea to begin the intake process." action={<Button size="sm" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} className="mr-1" />Add First Idea</Button>} />
        ) : (
          <div className="space-y-4">
            {ideas.map((idea: any) => {
              const pct = ideaCompleteness(idea);
              return (
                <div key={idea.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs" style={{ borderColor: "#d97706", color: "#d97706", background: "#fef3c7" }}>
                        Assumption-led
                      </Badge>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: "#6b7280", color: "#6b7280", background: "#f3f4f6" }}>
                        Unvalidated
                      </Badge>
                      {idea.originSource && (
                        <Badge variant="outline" className="text-xs">{ORIGIN_SOURCES.find(o => o.value === idea.originSource)?.label ?? idea.originSource}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: pct >= 70 ? "rgba(86,168,55,0.1)" : "rgba(245,158,11,0.1)", color: pct >= 70 ? "#56A837" : "#d97706" }}>
                        {pct}% complete
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(idea)}><Pencil size={13} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => del.mutate({ id: idea.id })}><Trash2 size={13} className="text-red-400" /></Button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{idea.ideaTitle}</h3>
                  {idea.ideaSummary && <p className="text-sm text-gray-600 mb-4">{idea.ideaSummary}</p>}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-500">
                    {[
                      { label: "Target Sector",   val: idea.targetSector },
                      { label: "Target Customer", val: idea.targetCustomer },
                      { label: "Problem Area",    val: idea.problemArea },
                      { label: "Why Now?",        val: idea.whyNow },
                      { label: "Strategic Fit",   val: idea.strategicRelevance },
                      { label: "Sustainability",  val: idea.sustainabilityRelevance },
                    ].filter(x => x.val).map(x => (
                      <div key={x.label}>
                        <span className="font-semibold text-gray-400 block mb-0.5">{x.label}</span>
                        <span className="line-clamp-2">{x.val}</span>
                      </div>
                    ))}
                  </div>

                  {pct < 70 && (
                    <div className="mt-4 pt-3 border-t flex items-center gap-2 text-xs" style={{ borderColor: "#f3f4f6", color: "#d97706" }}>
                      <AlertTriangle size={12} />
                      Idea is {pct}% complete — fill in more fields before defining assumptions.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Idea" : "Capture New Venture Idea"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Idea Title *</label>
              <Input value={form.ideaTitle} onChange={e => f("ideaTitle")(e.target.value)} placeholder="e.g. Reliability intelligence for zero-emission bus operators" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Idea Summary</label>
              <Textarea rows={3} value={form.ideaSummary} onChange={e => f("ideaSummary")(e.target.value)} placeholder="One-paragraph description of the venture idea..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Origin Source</label>
              <Select value={form.originSource} onValueChange={f("originSource")}>
                <SelectTrigger><SelectValue placeholder="Select source..." /></SelectTrigger>
                <SelectContent>{ORIGIN_SOURCES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Target Sector</label>
              <Input value={form.targetSector} onChange={e => f("targetSector")(e.target.value)} placeholder="e.g. Transport, Manufacturing..." />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Target Customer</label>
              <Input value={form.targetCustomer} onChange={e => f("targetCustomer")(e.target.value)} placeholder="e.g. Fleet maintenance managers at UK bus operators" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Problem Area</label>
              <Textarea rows={2} value={form.problemArea} onChange={e => f("problemArea")(e.target.value)} placeholder="What core problem does this venture address?" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Proposed Solution</label>
              <Textarea rows={2} value={form.proposedSolution} onChange={e => f("proposedSolution")(e.target.value)} placeholder="Initial solution hypothesis (not validated)..." />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Why Now?</label>
              <Textarea rows={2} value={form.whyNow} onChange={e => f("whyNow")(e.target.value)} placeholder="What market, regulatory, or technical conditions make this the right time?" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Strategic Relevance</label>
              <Textarea rows={2} value={form.strategicRelevance} onChange={e => f("strategicRelevance")(e.target.value)} placeholder="How does this fit the EcoRACE portfolio strategy?" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Sustainability Relevance</label>
              <Textarea rows={2} value={form.sustainabilityRelevance} onChange={e => f("sustainabilityRelevance")(e.target.value)} placeholder="Sustainability angle or circular economy contribution..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Data Moat Potential</label>
              <Textarea rows={2} value={form.dataMoatPotential} onChange={e => f("dataMoatPotential")(e.target.value)} placeholder="Could this venture create a proprietary data advantage?" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Founder Notes</label>
              <Textarea rows={2} value={form.founderNotes} onChange={e => f("founderNotes")(e.target.value)} placeholder="Additional context, personal conviction, or caveats..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={save} disabled={!form.ideaTitle || upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save Idea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
