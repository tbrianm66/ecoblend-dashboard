// ============================================================================
// JOBS-TO-BE-DONE — Module 4, Sub-section 2
// Opportunity Score = Importance + (Importance - Satisfaction), 0-100
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
import { Target, Plus, Pencil, Trash2 } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";
import { calcJTBDOpportunityScore, jtbdOpportunityLabel } from "@/lib/proposition-scoring";

const STATUSES = ["untested","testing","validated","invalidated","pivot_required"];

function oppColor(score: number) {
  if (score >= 80) return { color: "#16a34a", bg: "#dcfce7" };
  if (score >= 60) return { color: "#0891b2", bg: "#cffafe" };
  if (score >= 40) return { color: "#d97706", bg: "#fef3c7" };
  return { color: "#dc2626", bg: "#fee2e2" };
}

const EMPTY = {
  jobTitle: "", jobStatement: "", functionalJob: "", emotionalJob: "", socialJob: "",
  currentSolution: "", desiredOutcome: "", outcomeMetric: "",
  importanceScore: 3, satisfactionScore: 3, evidenceSummary: "", status: "untested",
};

export default function JobsToBeDone() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const vid = { ventureId: selectedVentureId! };
  const { data: jobs = [], refetch } = trpc.proposition.jtbd.list.useQuery(vid, { enabled: !!selectedVentureId });
  const upsert = trpc.proposition.jtbd.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); setEditing(null); setForm(EMPTY); toast.success("Job saved"); } });
  const del = trpc.proposition.jtbd.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Deleted"); } });

  function openNew() { setForm(EMPTY); setEditing(null); setOpen(true); }
  function openEdit(j: any) { setForm({ ...EMPTY, ...j }); setEditing(j.id); setOpen(true); }
  function save() { upsert.mutate({ ...form, ventureId: selectedVentureId!, id: editing ?? undefined }); }

  const liveScore = calcJTBDOpportunityScore(form.importanceScore, form.satisfactionScore);
  const noJtbd = (jobs as any[]).length === 0;

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Jobs-to-be-Done"
        purpose="Define what the customer is trying to achieve — independent of the proposed solution. Opportunity Score = Importance + (Importance − Satisfaction)."
        icon={<Target size={18} style={{ color: "#56A837" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} />Add Job</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {(jobs as any[]).length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Jobs Defined",          value: (jobs as any[]).length },
              { label: "Strong Unmet Needs",     value: (jobs as any[]).filter(j => j.opportunityScore >= 80).length, color: "#16a34a" },
              { label: "Validated",              value: (jobs as any[]).filter(j => j.status === "validated").length, color: "#0891b2" },
              { label: "Top Opp Score",          value: Math.max(...(jobs as any[]).map(j => j.opportunityScore ?? 0)), color: "#56A837" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className="text-2xl font-bold" style={{ color: s.color ?? "#1a2332" }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {noJtbd ? (
          <EmptyState title="No jobs defined yet" description="Start by identifying what the customer is fundamentally trying to achieve. Avoid solution bias." action={<Button size="sm" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} className="mr-1" />Add First Job</Button>} />
        ) : (
          <div className="space-y-4">
            {(jobs as any[]).map((j) => {
              const oc = oppColor(j.opportunityScore ?? 0);
              return (
                <div key={j.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline" className="text-xs capitalize">{j.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{j.jobTitle}</h4>
                      <p className="text-sm text-gray-600">{j.jobStatement}</p>
                      <div className="grid grid-cols-3 gap-4 mt-4 text-xs text-gray-500">
                        {[
                          { l: "Functional Job",   v: j.functionalJob },
                          { l: "Emotional Job",    v: j.emotionalJob },
                          { l: "Social Job",       v: j.socialJob },
                          { l: "Current Solution", v: j.currentSolution },
                          { l: "Desired Outcome",  v: j.desiredOutcome },
                          { l: "Outcome Metric",   v: j.outcomeMetric },
                        ].filter(x => x.v).map(x => (
                          <div key={x.l}><span className="font-semibold text-gray-400 block">{x.l}</span>{x.v}</div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-center px-4 py-3 rounded-xl" style={{ background: oc.bg, minWidth: 80 }}>
                        <div className="text-2xl font-bold" style={{ color: oc.color }}>{j.opportunityScore ?? 0}</div>
                        <div className="text-xs mt-0.5" style={{ color: oc.color }}>{jtbdOpportunityLabel(j.opportunityScore ?? 0)}</div>
                        <div className="text-xs text-gray-400 mt-1">I:{j.importanceScore} S:{j.satisfactionScore}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(j)}><Pencil size={13} /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => del.mutate({ id: j.id })}><Trash2 size={13} className="text-red-400" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Job" : "Add Job-to-be-Done"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Job Title *</label><Input value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} placeholder="e.g. Diagnose recurring vehicle reliability failures" /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Job Statement *</label><Textarea rows={2} value={form.jobStatement} onChange={e => setForm(p => ({ ...p, jobStatement: e.target.value }))} placeholder="When [situation], I want to [motivation], so I can [outcome]." /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Functional Job</label><Textarea rows={2} value={form.functionalJob} onChange={e => setForm(p => ({ ...p, functionalJob: e.target.value }))} placeholder="Practical task..." /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Emotional Job</label><Textarea rows={2} value={form.emotionalJob} onChange={e => setForm(p => ({ ...p, emotionalJob: e.target.value }))} placeholder="Feeling achieved..." /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Social Job</label><Textarea rows={2} value={form.socialJob} onChange={e => setForm(p => ({ ...p, socialJob: e.target.value }))} placeholder="Status/perception..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Current Solution</label><Textarea rows={2} value={form.currentSolution} onChange={e => setForm(p => ({ ...p, currentSolution: e.target.value }))} placeholder="How do they solve it now?" /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Desired Outcome</label><Textarea rows={2} value={form.desiredOutcome} onChange={e => setForm(p => ({ ...p, desiredOutcome: e.target.value }))} placeholder="What outcome do they want?" /></div>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Outcome Metric</label><Input value={form.outcomeMetric} onChange={e => setForm(p => ({ ...p, outcomeMetric: e.target.value }))} placeholder="e.g. Reduce downtime incidents by >20%" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Importance Score (1–5)</label>
                <div className="flex gap-2">{[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm(p => ({ ...p, importanceScore: n }))}
                    className="w-9 h-9 rounded-lg text-sm font-semibold border transition-all"
                    style={{ background: form.importanceScore === n ? "#1a2332" : "white", color: form.importanceScore === n ? "white" : "#6b7280", borderColor: form.importanceScore === n ? "#1a2332" : "#e5e7eb" }}>{n}</button>
                ))}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Satisfaction Score (1–5)</label>
                <div className="flex gap-2">{[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm(p => ({ ...p, satisfactionScore: n }))}
                    className="w-9 h-9 rounded-lg text-sm font-semibold border transition-all"
                    style={{ background: form.satisfactionScore === n ? "#1a2332" : "white", color: form.satisfactionScore === n ? "white" : "#6b7280", borderColor: form.satisfactionScore === n ? "#1a2332" : "#e5e7eb" }}>{n}</button>
                ))}</div>
              </div>
            </div>
            <div className="rounded-lg p-3 text-sm" style={{ background: "#f9fafb" }}>
              Opportunity Score: <strong>{liveScore}</strong> — <span className="font-semibold" style={{ color: oppColor(liveScore).color }}>{jtbdOpportunityLabel(liveScore)}</span>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Summary</label><Textarea rows={2} value={form.evidenceSummary} onChange={e => setForm(p => ({ ...p, evidenceSummary: e.target.value }))} placeholder="Existing evidence for this job..." /></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label><Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={save} disabled={!form.jobTitle || !form.jobStatement || upsert.isPending}>{upsert.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
