// ============================================================
// Operations — MRL Evidence  /operations/mrl
// Direct integration with canonical MRL Engine (BEBUS-VRL-WGM-002)
// and B-03 Evidence Ledger. Respects Profile SV-01 (N/A for
// software / social ventures).
// ============================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Gauge, Plus, Pencil, Trash2,
  CheckCircle2, Clock, FileCheck2, AlertTriangle, Info,
} from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

// ── MRL Level definitions (mirrored from mrl.engine.ts for display) ───────────

const MRL_DISPLAY = [
  { level: 1, label: "Basic Manufacturing Implications Identified",             color: "#6b7280" },
  { level: 2, label: "Manufacturing Concepts Identified",                       color: "#7c3aed" },
  { level: 3, label: "Manufacturing Proof of Concept Demonstrated",             color: "#3B85BA" },
  { level: 4, label: "Capability to Produce Technology in Laboratory",          color: "#0891b2" },
  { level: 5, label: "Capability to Produce Prototype Components",              color: "#d97706" },
  { level: 6, label: "Capability to Produce Prototype System in Pilot Line",    color: "#F69111" },
  { level: 7, label: "Capability to Produce Systems in Pre-Production",         color: "#84cc16" },
  { level: 8, label: "Pilot Line Capability Demonstrated — Production Ready",   color: "#16a34a" },
  { level: 9, label: "Low-Rate Initial Production Capability Demonstrated",     color: "#15803d" },
];

const EVAL_STATUSES = [
  { value: "draft",     label: "Draft",     color: "#6b7280", bg: "#f3f4f6", Icon: Clock },
  { value: "submitted", label: "Submitted", color: "#3B85BA", bg: "#dbeafe", Icon: AlertTriangle },
  { value: "confirmed", label: "Confirmed", color: "#16a34a", bg: "#f0fdf4", Icon: CheckCircle2 },
];

const EMPTY_FORM = {
  mrlLevel:        5,
  evaluationNotes: "",
  evidenceId:      "",
  status:          "draft" as const,
  isNa:            false,
  naJustification: "",
};
type FormState = typeof EMPTY_FORM;

function statusCfg(s: string) { return EVAL_STATUSES.find(x => x.value === s) ?? EVAL_STATUSES[0]; }
function mrlDisplay(l: number) { return MRL_DISPLAY.find(x => x.level === l) ?? MRL_DISPLAY[4]; }

// ── Eval Modal ────────────────────────────────────────────────────────────────

function EvalModal({ open, onClose, ventureId, editId, initialForm, onSaved }: {
  open: boolean; onClose: () => void; ventureId: string;
  editId?: number; initialForm: FormState; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const upsert = trpc.operations.mrlEval.upsert.useMutation({
    onSuccess: () => { toast.success(editId ? "Evaluation updated." : "MRL evaluation recorded."); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }));
  const mrl = mrlDisplay(form.mrlLevel);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit MRL Evaluation" : "Record MRL Evaluation"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Profile SV-01 N/A toggle */}
          <div className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: "#e5e7eb", background: "#fafafa" }}>
            <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600">Profile SV-01 — Software / Social Ventures</p>
              <p className="text-[11px] text-gray-400 mt-0.5">If this venture is a software or social enterprise with no physical manufacturing, you may mark MRL as N/A.</p>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={form.isNa} onChange={e => set("isNa", e.target.checked)} className="w-4 h-4 accent-green-600" />
                <span className="text-xs font-medium text-gray-700">Mark MRL as N/A for this venture</span>
              </label>
            </div>
          </div>

          {!form.isNa && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">MRL Level *</label>
                <Select value={form.mrlLevel.toString()} onValueChange={v => set("mrlLevel", Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MRL_DISPLAY.map(m => (
                      <SelectItem key={m.level} value={m.level.toString()}>
                        <span className="font-bold mr-2">MRL {m.level}</span>
                        <span className="text-xs text-gray-500">{m.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: mrl.color + "18", color: mrl.color }}>
                  <span className="font-bold">MRL {mrl.level}:</span> {mrl.label}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Evidence ID (B-03 Ledger)</label>
                <Input value={form.evidenceId} onChange={e => set("evidenceId", e.target.value)} placeholder="e.g. EV-0055" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                <Select value={form.status} onValueChange={v => set("status", v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVAL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {form.isNa && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">N/A Justification *</label>
              <Textarea value={form.naJustification} onChange={e => set("naJustification", e.target.value)} placeholder="Explain why MRL is not applicable (e.g. SaaS platform, no physical product)…" rows={3} className="mt-1" />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Evaluation Notes</label>
            <Textarea value={form.evaluationNotes} onChange={e => set("evaluationNotes", e.target.value)} placeholder="Evidence summary, constraints, next steps to reach next MRL level…" rows={3} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={upsert.isPending}
            onClick={() => upsert.mutate({ id: editId, ventureId, ...form })}
            style={{ background: "#56A837" }}
          >
            {upsert.isPending ? "Saving…" : editId ? "Save Changes" : "Record Evaluation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OpsMrlEvidence() {
  const { selectedVentureId } = useSelectedVenture();
  const [modalOpen, setModalOpen] = useState(false);
  const [editEval, setEditEval]   = useState<{ id: number; form: FormState } | null>(null);

  const { data: evals = [], refetch } = trpc.operations.mrlEval.list.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );
  const { data: summary } = trpc.operations.mrlEval.summary.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );

  const deleteEval = trpc.operations.mrlEval.delete.useMutation({
    onSuccess: () => { toast.success("Evaluation deleted."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const confirmed   = evals.filter(e => e.status === "confirmed").length;
  const submitted   = evals.filter(e => e.status === "submitted").length;
  const vrlPct      = summary ? Math.round(summary.vrlContribution * 100) : 0;

  const openAdd = () => { setEditEval(null); setModalOpen(true); };
  const openEdit = (e: typeof evals[0]) => {
    setEditEval({ id: e.id, form: {
      mrlLevel:        e.mrlLevel,
      evaluationNotes: e.evaluationNotes ?? "",
      evidenceId:      e.evidenceId ?? "",
      status:          e.status as any,
      isNa:            false,
      naJustification: "",
    }});
    setModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <ModuleHeader
        icon={<Gauge size={20} />}
        title="MRL Evidence"
        purpose="Manufacturing Readiness Level assessments linked to the B-03 Evidence Ledger. Confirmed MRL level feeds VRL Product × 0.35 and Execution × 0.40 dimensions."
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openAdd}><Plus size={14} /> Record Evaluation</Button>}
      />

      <div className="space-y-6">
        <VentureSelector />

        {!selectedVentureId ? <NoVentureState /> : (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Evaluations",     value: evals.length,    color: "#56A837", Icon: Gauge },
                { label: "Confirmed",       value: confirmed,        color: "#16a34a", Icon: CheckCircle2 },
                { label: "Submitted",       value: submitted,        color: "#3B85BA", Icon: FileCheck2 },
                { label: "VRL Contribution", value: `${vrlPct}%`,   color: vrlPct >= 50 ? "#16a34a" : "#F69111", Icon: AlertTriangle },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <c.Icon size={14} style={{ color: c.color }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{c.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Confirmed MRL level banner */}
            {summary?.highestConfirmed && (
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb", borderLeft: "4px solid #16a34a" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl font-black" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                    {summary.highestConfirmed}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Highest Confirmed MRL Level</p>
                    <p className="text-sm font-bold text-gray-900">MRL {summary.highestConfirmed}: {mrlDisplay(summary.highestConfirmed).label}</p>
                    {summary.levelDef && (
                      <p className="text-xs text-gray-500 mt-1">{(summary.levelDef as any).description ?? ""}</p>
                    )}
                    <p className="text-xs mt-2" style={{ color: "#16a34a" }}>
                      VRL contribution: {vrlPct}% (normalised 0–1 × Product ×0.35 + Execution ×0.40)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* MRL level progress ladder */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">MRL Readiness Ladder</p>
              <div className="space-y-1.5">
                {MRL_DISPLAY.map(m => {
                  const isConfirmed = evals.some(e => e.mrlLevel === m.level && e.status === "confirmed");
                  const isSubmitted = evals.some(e => e.mrlLevel === m.level && e.status === "submitted");
                  const isDraft     = evals.some(e => e.mrlLevel === m.level && e.status === "draft");
                  return (
                    <div key={m.level} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: isConfirmed ? m.color + "12" : "#fafafa" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: m.color, color: "#fff" }}>
                        {m.level}
                      </div>
                      <p className="flex-1 text-xs text-gray-700">{m.label}</p>
                      {isConfirmed && <CheckCircle2 size={14} style={{ color: "#16a34a" }} />}
                      {isSubmitted && !isConfirmed && <Clock size={14} style={{ color: "#3B85BA" }} />}
                      {isDraft && !isSubmitted && !isConfirmed && <FileCheck2 size={14} style={{ color: "#9ca3af" }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evaluations list */}
            {evals.length === 0 ? (
              <EmptyState
                icon={<Gauge size={32} />}
                title="No MRL evaluations recorded"
                description="Record your Manufacturing Readiness Level with supporting evidence. Confirmed MRL levels feed directly into your VRL Product and Execution dimension scores."
                action={<Button size="sm" onClick={openAdd} style={{ background: "#56A837" }}><Plus size={14} className="mr-1" /> Record Evaluation</Button>}
              />
            ) : (
              <div className="space-y-3">
                {evals.map(e => {
                  const sc  = statusCfg(e.status);
                  const mrl = mrlDisplay(e.mrlLevel);
                  return (
                    <div key={e.id} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${mrl.color}` }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-black text-white" style={{ background: mrl.color }}>
                            {e.mrlLevel}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">MRL {e.mrlLevel}</span>
                              <Badge variant="outline" className="text-[10px] gap-1" style={{ borderColor: sc.color, color: sc.color, background: sc.bg }}>
                                <sc.Icon size={9} />{sc.label}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-1">{mrl.label}</p>
                            {e.evidenceId && (
                              <p className="text-[10px] font-mono text-gray-400">Evidence: {e.evidenceId}</p>
                            )}
                            {e.evaluationNotes && (
                              <p className="text-xs text-gray-500 mt-1">{e.evaluationNotes}</p>
                            )}
                            {(e as any).vrlContribution > 0 && e.status === "confirmed" && (
                              <p className="text-[10px] mt-1 font-medium" style={{ color: "#16a34a" }}>
                                VRL contribution: {Math.round((e as any).vrlContribution * 100)}%
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-3 shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(e)}><Pencil size={12} /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            onClick={() => { if (confirm("Delete this evaluation?")) deleteEval.mutate({ id: e.id }); }}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <EvalModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditEval(null); }}
        ventureId={selectedVentureId ?? ""}
        editId={editEval?.id}
        initialForm={editEval?.form ?? EMPTY_FORM}
        onSaved={refetch}
      />
    </div>
  );
}
