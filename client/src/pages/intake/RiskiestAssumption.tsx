// ============================================================================
// RISKIEST ASSUMPTION — Venture Intake sub-section
// Identifies the assumption most likely to invalidate the venture.
// Test Priority Score = RiskScore×50% + ImpactIfFalse×30% + EvidenceGap×20%
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
import { AlertTriangle, Plus, Pencil, Trash2, FlaskConical, Target, CheckCircle2 } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

const EMPTY_FORM = {
  assumptionStatement: "", assumptionId: null as number | null, hypothesisId: null as number | null,
  reasonItIsRisky: "", impactIfFalse: "", evidenceRequired: "",
  proposedTest: "", testPriorityScore: 0, recommendedFirstExperiment: "",
};

function scoreColor(score: number) {
  if (score >= 70) return { color: "#dc2626", bg: "#fee2e2", label: "Critical Priority" };
  if (score >= 50) return { color: "#f97316", bg: "#fff7ed", label: "High Priority" };
  if (score >= 30) return { color: "#d97706", bg: "#fffbeb", label: "Medium Priority" };
  return { color: "#6b7280", bg: "#f3f4f6", label: "Low Priority" };
}

export default function RiskiestAssumption() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const vid = { ventureId: selectedVentureId! };
  const { data: riskiest = [], refetch } = trpc.intake.riskiest.list.useQuery(vid, { enabled: !!selectedVentureId });
  const { data: assumptions = [] } = trpc.intake.assumptions.list.useQuery(vid, { enabled: !!selectedVentureId });
  const { data: hyps = [] } = trpc.intake.hypotheses.list.useQuery(vid, { enabled: !!selectedVentureId });
  const upsert = trpc.intake.riskiest.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); setEditing(null); setForm(EMPTY_FORM); toast.success("Riskiest assumption saved"); } });
  const del = trpc.intake.riskiest.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Record deleted"); } });
  const createExp = trpc.intake.riskiest.createExperiment.useMutation({ onSuccess: () => toast.success("Lean experiment created — visible in Command Centre") });

  function openNew() { setForm(EMPTY_FORM); setEditing(null); setOpen(true); }
  function openEdit(r: any) {
    setForm({ assumptionStatement: r.assumptionStatement, assumptionId: r.assumptionId, hypothesisId: r.hypothesisId, reasonItIsRisky: r.reasonItIsRisky ?? "", impactIfFalse: r.impactIfFalse ?? "", evidenceRequired: r.evidenceRequired ?? "", proposedTest: r.proposedTest ?? "", testPriorityScore: r.testPriorityScore ?? 0, recommendedFirstExperiment: r.recommendedFirstExperiment ?? "" });
    setEditing(r.id);
    setOpen(true);
  }
  function save() { upsert.mutate({ ...form, ventureId: selectedVentureId!, id: editing ?? undefined }); }

  // Ranked assumptions from vi_assumptions
  const rankedAssumptions = [...assumptions].sort((a: any, b: any) =>
    ((b.importanceScore ?? 3) * (b.uncertaintyScore ?? 3)) - ((a.importanceScore ?? 3) * (a.uncertaintyScore ?? 3))
  ).slice(0, 5);

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Riskiest Assumption"
        purpose="Identify the single assumption most likely to kill the venture. This is the first thing that must be tested before entering Discovery & Market."
        icon={<AlertTriangle size={18} style={{ color: "#dc2626" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} />Define Riskiest</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {/* Ranked assumptions panel */}
        {rankedAssumptions.length > 0 && (
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={14} style={{ color: "#dc2626" }} />
              Top 5 Assumptions by Risk Score
            </h3>
            <div className="space-y-2">
              {rankedAssumptions.map((a: any, i) => {
                const rs = (a.importanceScore ?? 3) * (a.uncertaintyScore ?? 3);
                const sc = scoreColor(rs * 4);
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: i === 0 ? "#fef2f2" : "#f9fafb" }}>
                    <span className="text-xs font-bold w-6 text-center" style={{ color: sc.color }}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{a.assumptionTitle}</p>
                      <p className="text-xs text-gray-500 truncate">{a.assumptionStatement}</p>
                    </div>
                    <div className="text-center shrink-0">
                      <div className="text-sm font-bold" style={{ color: sc.color }}>{rs}</div>
                      <div className="text-xs text-gray-400">risk</div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2 gap-1 shrink-0" style={{ color: "#56A837" }}
                      onClick={() => { setForm({ ...EMPTY_FORM, assumptionStatement: a.assumptionStatement, assumptionId: a.id }); setEditing(null); setOpen(true); }}>
                      <Plus size={11} />Define
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Riskiest assumption records */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Defined Riskiest Assumptions</h3>
          {riskiest.length === 0 ? (
            <EmptyState
              title="No riskiest assumption defined"
              description="Select the assumption that would most invalidate the venture and define what test must be run first."
              action={<Button size="sm" style={{ background: "#56A837" }} onClick={openNew}><Plus size={14} className="mr-1" />Define Now</Button>}
            />
          ) : (
            <div className="space-y-4">
              {riskiest.map((r: any, i) => {
                const sc = scoreColor(r.testPriorityScore ?? 0);
                return (
                  <div key={r.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow" style={{ borderColor: i === 0 ? "#fca5a5" : "#e5e7eb" }}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        {i === 0 && (
                          <Badge className="mb-2 text-xs" style={{ background: "#fee2e2", color: "#dc2626", border: "none" }}>
                            <AlertTriangle size={10} className="mr-1 inline" />Top Riskiest
                          </Badge>
                        )}
                        <p className="text-sm font-semibold text-gray-900 leading-relaxed">"{r.assumptionStatement}"</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-center px-3 py-2 rounded-lg" style={{ background: sc.bg, minWidth: 72 }}>
                          <div className="text-xs" style={{ color: sc.color }}>{sc.label}</div>
                          <div className="text-2xl font-bold" style={{ color: sc.color }}>{r.testPriorityScore ?? 0}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(r)}><Pencil size={13} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => del.mutate({ id: r.id })}><Trash2 size={13} className="text-red-400" /></Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-4">
                      {r.reasonItIsRisky && (
                        <div><span className="font-semibold text-gray-400 block mb-0.5">Why It's Risky</span>{r.reasonItIsRisky}</div>
                      )}
                      {r.impactIfFalse && (
                        <div><span className="font-semibold text-gray-400 block mb-0.5">Impact If False</span>{r.impactIfFalse}</div>
                      )}
                      {r.evidenceRequired && (
                        <div><span className="font-semibold text-gray-400 block mb-0.5">Evidence Required</span>{r.evidenceRequired}</div>
                      )}
                      {r.proposedTest && (
                        <div><span className="font-semibold text-gray-400 block mb-0.5">Proposed Test</span>{r.proposedTest}</div>
                      )}
                    </div>

                    {r.recommendedFirstExperiment && (
                      <div className="rounded-lg p-3 mb-4" style={{ background: "rgba(86,168,55,0.06)", border: "1px solid rgba(86,168,55,0.2)" }}>
                        <span className="text-xs font-semibold block mb-1" style={{ color: "#56A837" }}>Recommended First Experiment</span>
                        <p className="text-xs text-gray-700">{r.recommendedFirstExperiment}</p>
                      </div>
                    )}

                    <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={() => createExp.mutate({ id: r.id })} disabled={createExp.isPending}>
                      <FlaskConical size={12} />Create Lean Experiment
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Riskiest Assumption" : "Define Riskiest Assumption"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {assumptions.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Link to Assumption (optional)</label>
                <Select value={form.assumptionId?.toString() ?? ""} onValueChange={v => {
                  const a = (assumptions as any[]).find(a => a.id === parseInt(v));
                  setForm(p => ({ ...p, assumptionId: parseInt(v), assumptionStatement: a?.assumptionStatement ?? p.assumptionStatement }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select existing assumption..." /></SelectTrigger>
                  <SelectContent>{(assumptions as any[]).map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.assumptionTitle}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Assumption Statement *</label>
              <Textarea rows={3} value={form.assumptionStatement} onChange={e => setForm(p => ({ ...p, assumptionStatement: e.target.value }))} placeholder="We believe that..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Why Is This the Riskiest?</label>
              <Textarea rows={2} value={form.reasonItIsRisky} onChange={e => setForm(p => ({ ...p, reasonItIsRisky: e.target.value }))} placeholder="If this assumption is wrong, the venture cannot exist because..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Impact If False</label>
              <Textarea rows={2} value={form.impactIfFalse} onChange={e => setForm(p => ({ ...p, impactIfFalse: e.target.value }))} placeholder="Business model collapse / no addressable market / no willingness to pay..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Required</label>
              <Textarea rows={2} value={form.evidenceRequired} onChange={e => setForm(p => ({ ...p, evidenceRequired: e.target.value }))} placeholder="We need to see X confirmations from Y customer interviews before we can proceed..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Proposed Test Method</label>
              <Textarea rows={2} value={form.proposedTest} onChange={e => setForm(p => ({ ...p, proposedTest: e.target.value }))} placeholder="Customer interview / smoke test / concierge MVP / wizard of oz..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Recommended First Experiment</label>
              <Textarea rows={2} value={form.recommendedFirstExperiment} onChange={e => setForm(p => ({ ...p, recommendedFirstExperiment: e.target.value }))} placeholder="The specific experiment we should run first..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Test Priority Score (0–100)</label>
              <Input type="number" min={0} max={100} value={form.testPriorityScore} onChange={e => setForm(p => ({ ...p, testPriorityScore: parseInt(e.target.value) || 0 }))} />
              <p className="text-xs text-gray-400 mt-1">Formula: Assumption Risk Score×50% + Impact×30% + Evidence Gap×20%</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={save} disabled={!form.assumptionStatement || upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
