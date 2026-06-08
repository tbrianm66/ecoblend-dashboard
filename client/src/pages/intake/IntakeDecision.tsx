// ============================================================================
// INTAKE DECISION — Venture Intake sub-section
// Readiness scorecard + decision form. Approved decisions update venture stage.
// Intake Readiness = Idea 15% + Segment 15% + Problem 20% + VP 15% + BM 10% + Riskiest 15% + Hyps 10%
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
import { CheckSquare, AlertTriangle, CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

const DECISION_TYPES = [
  { value: "reject",                          label: "Reject" },
  { value: "archive",                         label: "Archive" },
  { value: "research_more",                   label: "Research More" },
  { value: "begin_customer_discovery",        label: "Begin Customer Discovery" },
  { value: "begin_market_discovery",          label: "Begin Market Discovery" },
  { value: "create_experiment",               label: "Create First Experiment" },
  { value: "pivot_before_discovery",          label: "Pivot Before Discovery" },
  { value: "proceed_to_discovery_and_market", label: "Proceed to Discovery & Market" },
];

const DECISION_STATUS_CFG: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  recommended:    { icon: ChevronRight, label: "Recommended",    color: "#d97706", bg: "#fef3c7" },
  pending_review: { icon: Clock,        label: "Pending Review", color: "#6b7280", bg: "#f3f4f6" },
  approved:       { icon: CheckCircle2, label: "Approved",       color: "#16a34a", bg: "#dcfce7" },
  rejected:       { icon: XCircle,      label: "Rejected",       color: "#dc2626", bg: "#fee2e2" },
  implemented:    { icon: CheckCircle2, label: "Implemented",    color: "#0891b2", bg: "#cffafe" },
};

const READINESS_BREAKDOWN = [
  { key: "ideaCompleteness",  label: "Idea Completeness",      weight: "15%" },
  { key: "segmentClarity",    label: "Segment Clarity",        weight: "15%" },
  { key: "problemDefinition", label: "Problem Definition",     weight: "20%" },
  { key: "vpQuality",         label: "Value Proposition",      weight: "15%" },
  { key: "bmReadiness",       label: "Business Model",         weight: "10%" },
  { key: "riskiestDefined",   label: "Riskiest Assumption",    weight: "15%" },
];

function readinessColor(score: number) {
  if (score >= 80) return { color: "#16a34a", bg: "#dcfce7", label: "Strong intake package" };
  if (score >= 60) return { color: "#0891b2", bg: "#cffafe", label: "Ready for initial discovery" };
  if (score >= 40) return { color: "#d97706", bg: "#fef3c7", label: "Needs more definition" };
  return { color: "#dc2626", bg: "#fee2e2", label: "Not ready" };
}

const EMPTY_FORM = { decisionType: "", decisionSummary: "", reviewerNotes: "" };

export default function IntakeDecision() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const vid = { ventureId: selectedVentureId! };
  const { data: score, refetch: refetchScore } = trpc.intake.readiness.score.useQuery(vid, { enabled: !!selectedVentureId });
  const { data: existing, refetch: refetchDecision } = trpc.intake.decisions.get.useQuery(vid, { enabled: !!selectedVentureId });
  const upsert = trpc.intake.decisions.upsert.useMutation({
    onSuccess: () => { refetchDecision(); refetchScore(); setOpen(false); setForm(EMPTY_FORM); toast.success("Decision saved"); }
  });
  const approve = trpc.intake.decisions.approve.useMutation({
    onSuccess: () => { refetchDecision(); refetchScore(); toast.success("Decision approved — venture stage updated"); }
  });

  function openDecision() {
    setForm({ decisionType: existing?.decisionType ?? "", decisionSummary: existing?.decisionSummary ?? "", reviewerNotes: existing?.reviewerNotes ?? "" });
    setOpen(true);
  }
  function save() {
    upsert.mutate({ ...form, ventureId: selectedVentureId!, id: existing?.id ?? undefined, readinessScore: score?.total ?? 0 });
  }

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  const rc = score ? readinessColor(score.total) : readinessColor(0);
  const ds = existing ? DECISION_STATUS_CFG[existing.decisionStatus ?? "pending_review"] ?? DECISION_STATUS_CFG.pending_review : null;
  const DecisionIcon = ds?.icon ?? Clock;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Intake Decision"
        purpose="Review the venture's intake readiness and make a structured decision on whether to proceed, research more, or reject."
        icon={<CheckSquare size={18} style={{ color: "#56A837" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openDecision}><CheckSquare size={14} />{existing ? "Update Decision" : "Make Decision"}</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {/* Readiness Score Card */}
        {score && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Intake Readiness Score</h3>
                <p className="text-xs text-gray-500 mt-0.5">Weighted across idea, hypotheses, riskiest assumption, and definitions</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold" style={{ color: rc.color }}>{score.total}</div>
                <div className="text-xs mt-1 font-semibold px-2 py-0.5 rounded" style={{ color: rc.color, background: rc.bg }}>{rc.label}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 rounded-full mb-6" style={{ background: "#f3f4f6" }}>
              <div className="h-3 rounded-full transition-all" style={{ width: `${score.total}%`, background: rc.color }} />
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {READINESS_BREAKDOWN.map(({ key, label, weight }) => {
                const val = score.breakdown[key as keyof typeof score.breakdown] ?? 0;
                const col = val >= 70 ? "#16a34a" : val >= 40 ? "#d97706" : "#dc2626";
                return (
                  <div key={key} className="rounded-lg p-3" style={{ background: "#f9fafb" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-xs text-gray-400">{weight}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#e5e7eb" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${val}%`, background: col }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: col, minWidth: 28 }}>{val}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary stats */}
            {score.counts && (
              <div className="grid grid-cols-5 gap-3 mt-4 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
                {[
                  { label: "Ideas",        value: score.counts.ideas },
                  { label: "Assumptions",  value: score.counts.assumptions },
                  { label: "Hypotheses",   value: score.counts.hypotheses },
                  { label: "Riskiest",     value: score.counts.riskiest },
                  { label: "Critical (no evidence)", value: score.counts.criticalUntested, danger: score.counts.criticalUntested > 0 },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-lg font-bold" style={{ color: s.danger ? "#dc2626" : "#1a2332" }}>{s.value}</div>
                    <div className="text-xs text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Warning panels */}
        {score?.hasCriticalUntested && (
          <div className="flex items-start gap-3 rounded-xl p-4 border" style={{ background: "#fee2e2", borderColor: "#fca5a5" }}>
            <AlertTriangle size={16} style={{ color: "#dc2626", marginTop: 2, flexShrink: 0 }} />
            <p className="text-sm font-medium" style={{ color: "#991b1b" }}>
              Critical assumptions without evidence exist. Override: define riskiest assumption test before approving a discovery decision.
            </p>
          </div>
        )}

        {score && score.total < 40 && (
          <div className="flex items-start gap-3 rounded-xl p-4 border" style={{ background: "#fee2e2", borderColor: "#fca5a5" }}>
            <AlertTriangle size={16} style={{ color: "#dc2626", marginTop: 2, flexShrink: 0 }} />
            <p className="text-sm" style={{ color: "#991b1b" }}>
              Readiness score is below 40. Recommended decision: <strong>Reject, Archive, or Redefine the idea.</strong>
            </p>
          </div>
        )}

        {/* Recommended action */}
        {score && (
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">System Recommendation</h3>
            <p className="text-sm text-gray-600">
              {score.total >= 80 && !score.hasCriticalUntested ? "✅ Proceed to Discovery & Market and create the first experiment." :
               score.total >= 60 && !score.hasCriticalUntested ? "🔵 Ready for initial customer discovery. Begin with the riskiest assumption test." :
               score.hasCriticalUntested ? "🔴 Define the riskiest assumption test before proceeding. Critical assumptions are untested." :
               score.total >= 40 ? "🟡 Research more and complete missing hypotheses before beginning discovery." :
               "❌ Not ready for discovery. Revisit the idea, strengthen assumptions and hypotheses."}
            </p>
          </div>
        )}

        {/* Existing decision */}
        {existing && ds && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Current Decision</h3>
              <Badge variant="outline" className="text-xs" style={{ borderColor: ds.color, color: ds.color, background: ds.bg }}>
                <DecisionIcon size={10} className="mr-1 inline" />{ds.label}
              </Badge>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-gray-400 block mb-0.5">Decision Type</span>
                <span className="text-gray-800">{DECISION_TYPES.find(d => d.value === existing.decisionType)?.label ?? existing.decisionType}</span>
              </div>
              {existing.decisionSummary && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 block mb-0.5">Summary</span>
                  <p className="text-gray-700">{existing.decisionSummary}</p>
                </div>
              )}
              {existing.reviewerNotes && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 block mb-0.5">Reviewer Notes</span>
                  <p className="text-gray-700">{existing.reviewerNotes}</p>
                </div>
              )}
            </div>
            {existing.decisionStatus !== "approved" && existing.decisionType && (
              <div className="mt-4 pt-4 border-t flex gap-3" style={{ borderColor: "#f3f4f6" }}>
                <Button size="sm" style={{ background: "#16a34a", color: "white" }} onClick={() => approve.mutate({ id: existing.id, ventureId: selectedVentureId!, decisionType: existing.decisionType! })} disabled={approve.isPending}>
                  <CheckCircle2 size={13} className="mr-1" />{approve.isPending ? "Approving…" : "Approve Decision"}
                </Button>
                <Button size="sm" variant="outline" onClick={openDecision}>Edit</Button>
              </div>
            )}
          </div>
        )}

        {!existing && <EmptyState title="No decision made yet" description="Complete the readiness scorecard sections first, then make an intake decision." action={<Button size="sm" style={{ background: "#56A837" }} onClick={openDecision}><CheckSquare size={14} className="mr-1" />Make Decision</Button>} />}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Intake Decision</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {score && (
              <div className="rounded-lg p-3 text-sm" style={{ background: rc.bg }}>
                Readiness Score: <strong style={{ color: rc.color }}>{score.total} — {rc.label}</strong>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Decision Type *</label>
              <Select value={form.decisionType} onValueChange={v => setForm(p => ({ ...p, decisionType: v }))}>
                <SelectTrigger><SelectValue placeholder="Select decision..." /></SelectTrigger>
                <SelectContent>{DECISION_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Decision Summary</label>
              <Textarea rows={3} value={form.decisionSummary} onChange={e => setForm(p => ({ ...p, decisionSummary: e.target.value }))} placeholder="Rationale for this decision..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Reviewer Notes</label>
              <Textarea rows={2} value={form.reviewerNotes} onChange={e => setForm(p => ({ ...p, reviewerNotes: e.target.value }))} placeholder="Additional notes from the intake reviewer..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={save} disabled={!form.decisionType || upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
