// ============================================================================
// COMMAND CENTRE — Venture Status & Stage-Gate Readiness
// Per-venture validation cockpit: readiness scores, stage-gate checklist,
// stage-gate review log and pivot log.
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gauge, GitBranch, Plus, Trash2, Flag } from "lucide-react";
import {
  ModuleHeader, ScoreBar, StatTile, StageBadge, VentureStatusBadge, DecisionBadge,
  RiskBadge, StageGateChecklist, NextBestActionPanel, SectionHead, EmptyState, FormModal,
  toneForHealth, type Tone,
} from "@/components/command/primitives";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import {
  humanise, STAGE_LABELS, VENTURE_STAGES, REVIEW_STATUSES, APPROVAL_DECISIONS, PIVOT_TYPES,
} from "@shared/commandCentre";

export default function VentureStatus() {
  const { availableVentures: ventures, selectedVentureId, setSelectedVentureId } = useSelectedVenture();
  const ventureId = selectedVentureId ?? "";
  const setVentureId = setSelectedVentureId;

  const statusQ = trpc.commandCentreLean.ventureStatus.useQuery({ ventureId }, { enabled: !!ventureId });
  const reviewsQ = trpc.commandCentreLean.reviews.list.useQuery({ ventureId }, { enabled: !!ventureId });
  const pivotsQ = trpc.commandCentreLean.pivots.list.useQuery({ ventureId }, { enabled: !!ventureId });
  const utils = trpc.useUtils();

  const s = statusQ.data?.[0];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <ModuleHeader
        title="Venture Status & Stage-Gate"
        purpose="Evidence-based stage-gate readiness for each venture — what is validated, what is missing, and whether it can advance."
        icon={<Gauge size={22} />}
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Venture</span>
            <Select value={ventureId} onValueChange={setVentureId}>
              <SelectTrigger className="w-52 h-9 text-sm" data-testid="select-venture"><SelectValue placeholder="Select venture" /></SelectTrigger>
              <SelectContent>{ventures.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        }
      />

      {!s ? (
        <EmptyState title="Select a venture" description="Choose a venture to view its stage-gate readiness." icon={<Gauge size={22} />} />
      ) : (
        <>
          {/* Stage progression + recommendation */}
          <Card className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                  <span className="text-lg font-bold text-gray-900">{s.name}</span>
                  <VentureStatusBadge status={s.status} />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <StageBadge stage={s.stage} />
                  <span className="text-gray-300">→</span>
                  {s.nextStage ? <StageBadge stage={s.nextStage} /> : <span className="text-xs text-gray-400">Final stage</span>}
                </div>
                <DecisionBadge decision={s.recommendation} label={s.decisionLabel} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Evidence Confidence" value={s.evidenceConfidence} tone={toneForHealth(s.evidenceConfidence)} />
            <StatTile label="Stage-Gate Readiness" value={s.readiness} tone={s.ready ? "green" : toneForHealth(s.readiness)} hint={s.ready ? "Ready to advance" : "Gates outstanding"} />
            <StatTile label="Risk-Adjusted Readiness" value={s.riskAdjustedReadiness} tone={toneForHealth(s.riskAdjustedReadiness)} />
            <StatTile label="Risk Score" value={s.riskScore} tone={s.riskScore >= 50 ? "red" : "green"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border shadow-sm lg:col-span-2">
              <CardContent className="p-5 space-y-3">
                <SectionHead title="Validation dimensions" description="Evidence-weighted scores across the validation funnel." />
                <ScoreBar label="Market validation" score={s.marketValidation} tone={toneForHealth(s.marketValidation)} />
                <ScoreBar label="Commercial validation" score={s.commercialValidation} tone={toneForHealth(s.commercialValidation)} />
                <ScoreBar label="Technical validation" score={s.technicalValidation} tone={toneForHealth(s.technicalValidation)} />
                <ScoreBar label="Operational readiness" score={s.operationalReadiness} tone={toneForHealth(s.operationalReadiness)} />
                <ScoreBar label="GTM validation" score={s.gtmValidation} tone={toneForHealth(s.gtmValidation)} />
              </CardContent>
            </Card>
            <div className="space-y-4">
              <NextBestActionPanel action={s.readinessRecommendation.text} />
              <Card className="border shadow-sm">
                <CardContent className="p-5">
                  <SectionHead title="Stage-gate checklist" description={s.nextStage ? `Gates to ${STAGE_LABELS[s.nextStage] ?? humanise(s.nextStage)}` : "Final stage"} />
                  <StageGateChecklist items={s.checklist} />
                </CardContent>
              </Card>
            </div>
          </div>

          <ReviewsSection ventureId={ventureId} stage={s.stage} nextStage={s.nextStage} reviews={reviewsQ.data ?? []} metrics={s}
            onChanged={() => { utils.commandCentreLean.reviews.list.invalidate(); utils.commandCentreLean.stageGateBoard.invalidate(); }} />

          <PivotSection ventureId={ventureId} pivots={pivotsQ.data ?? []} onChanged={() => utils.commandCentreLean.pivots.list.invalidate()} />
        </>
      )}
    </div>
  );
}

// ─── Stage-gate reviews ────────────────────────────────────────────────────────
function ReviewsSection({ ventureId, stage, nextStage, reviews, metrics, onChanged }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const upsert = trpc.commandCentreLean.reviews.upsert.useMutation({ onSuccess: () => { onChanged(); setOpen(false); toast.success("Review saved"); } });
  const del = trpc.commandCentreLean.reviews.delete.useMutation({ onSuccess: () => { onChanged(); toast.success("Review deleted"); } });

  const openNew = () => {
    setForm({
      ventureId, fromStage: stage, toStage: nextStage ?? stage, reviewStatus: "under_review",
      evidenceScore: metrics.evidenceConfidence, marketScore: metrics.marketValidation,
      commercialScore: metrics.commercialValidation, technicalScore: metrics.technicalValidation,
      operationalScore: metrics.operationalReadiness, riskScore: metrics.riskScore,
      investmentReadinessScore: metrics.riskAdjustedReadiness, reviewDate: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <SectionHead title="Stage-Gate Reviews" description="Formal go / no-go reviews with the evidence snapshot at decision time."
          action={<Button size="sm" variant="outline" onClick={openNew} data-testid="button-add-review"><Plus size={14} className="mr-1" />New Review</Button>} />
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No stage-gate reviews yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-semibold">Gate</th><th className="py-2 px-3 font-semibold">Status</th>
                <th className="py-2 px-3 font-semibold text-center">Readiness</th><th className="py-2 px-3 font-semibold">Decision</th>
                <th className="py-2 px-3 font-semibold">Date</th><th className="py-2 pl-3"></th>
              </tr></thead>
              <tbody>
                {reviews.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0" data-testid={`review-${r.id}`}>
                    <td className="py-2.5 pr-3 text-gray-700">{humanise(r.fromStage ?? "")} → {humanise(r.toStage ?? "")}</td>
                    <td className="py-2.5 px-3"><span className="text-xs capitalize text-gray-600">{humanise(r.reviewStatus ?? "")}</span></td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-700">{r.investmentReadinessScore ?? "—"}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-600">{r.approvalDecision ? humanise(r.approvalDecision) : "—"}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-400">{r.reviewDate ?? "—"}</td>
                    <td className="py-2.5 pl-3 text-right"><button onClick={() => del.mutate({ id: r.id })} className="text-gray-300 hover:text-red-600"><Trash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <FormModal open={open} onOpenChange={setOpen} title="Stage-Gate Review" submitting={upsert.isPending} wide onSubmit={() => upsert.mutate(form)}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From stage">
            <Select value={form.fromStage ?? ""} onValueChange={(v) => setForm({ ...form, fromStage: v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{VENTURE_STAGES.map((st) => <SelectItem key={st} value={st}>{STAGE_LABELS[st] ?? humanise(st)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="To stage">
            <Select value={form.toStage ?? ""} onValueChange={(v) => setForm({ ...form, toStage: v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{VENTURE_STAGES.map((st) => <SelectItem key={st} value={st}>{STAGE_LABELS[st] ?? humanise(st)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Review status">
            <Select value={form.reviewStatus ?? "under_review"} onValueChange={(v) => setForm({ ...form, reviewStatus: v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{REVIEW_STATUSES.map((st) => <SelectItem key={st} value={st}>{humanise(st)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Approval decision">
            <Select value={form.approvalDecision ?? "__none__"} onValueChange={(v) => setForm({ ...form, approvalDecision: v === "__none__" ? null : v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Pending" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">Pending</SelectItem>{APPROVAL_DECISIONS.map((a) => <SelectItem key={a} value={a}>{humanise(a)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[["evidenceScore", "Evidence"], ["marketScore", "Market"], ["commercialScore", "Commercial"], ["technicalScore", "Technical"], ["operationalScore", "Operational"], ["riskScore", "Risk"]].map(([k, l]) => (
            <Field key={k} label={l}><Input type="number" value={form[k] ?? 0} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} /></Field>
          ))}
        </div>
        <Field label="Reviewer notes"><Textarea value={form.reviewerNotes ?? ""} onChange={(e) => setForm({ ...form, reviewerNotes: e.target.value })} /></Field>
        <Field label="Required actions"><Textarea value={form.requiredActions ?? ""} onChange={(e) => setForm({ ...form, requiredActions: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Review date"><Input type="date" value={form.reviewDate ?? ""} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} /></Field>
          <Field label="Next review"><Input type="date" value={form.nextReviewDate ?? ""} onChange={(e) => setForm({ ...form, nextReviewDate: e.target.value })} /></Field>
        </div>
      </FormModal>
    </Card>
  );
}

// ─── Pivot log ─────────────────────────────────────────────────────────────────
function PivotSection({ ventureId, pivots, onChanged }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const upsert = trpc.commandCentreLean.pivots.upsert.useMutation({ onSuccess: () => { onChanged(); setOpen(false); toast.success("Pivot logged"); } });
  const del = trpc.commandCentreLean.pivots.delete.useMutation({ onSuccess: () => { onChanged(); toast.success("Pivot deleted"); } });

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <SectionHead title="Pivot Log" description="A persistent record of validated-learning pivots and the evidence that triggered them."
          action={<Button size="sm" variant="outline" onClick={() => { setForm({ ventureId, pivotType: "value_proposition" }); setOpen(true); }} data-testid="button-add-pivot"><Plus size={14} className="mr-1" />Log Pivot</Button>} />
        {pivots.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No pivots logged — persevering on the current hypotheses.</p>
        ) : (
          <div className="space-y-3">
            {pivots.map((p: any) => (
              <div key={p.id} className="rounded-lg border p-3.5" data-testid={`pivot-${p.id}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <GitBranch size={14} className="text-amber-600" />
                    <span className="text-sm font-semibold text-gray-800 capitalize">{humanise(p.pivotType ?? "")} pivot</span>
                    {p.dateLogged && <span className="text-xs text-gray-400">{p.dateLogged}</span>}
                  </div>
                  <button onClick={() => del.mutate({ id: p.id })} className="text-gray-300 hover:text-red-600"><Trash2 size={13} /></button>
                </div>
                {p.reasonForPivot && <p className="text-sm text-gray-600 mb-1.5">{p.reasonForPivot}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                  {p.previousHypothesis && <div><span className="font-semibold text-gray-400">From:</span> {p.previousHypothesis}</div>}
                  {p.newHypothesis && <div><span className="font-semibold text-gray-400">To:</span> {p.newHypothesis}</div>}
                </div>
                {p.evidenceTrigger && <p className="text-xs text-gray-400 mt-1.5"><Flag size={10} className="inline mr-1" />{p.evidenceTrigger}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <FormModal open={open} onOpenChange={setOpen} title="Log a Pivot" submitting={upsert.isPending} onSubmit={() => upsert.mutate(form)}>
        <Field label="Pivot type">
          <Select value={form.pivotType ?? "value_proposition"} onValueChange={(v) => setForm({ ...form, pivotType: v })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{PIVOT_TYPES.map((t) => <SelectItem key={t} value={t}>{humanise(t)}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Reason for pivot"><Textarea value={form.reasonForPivot ?? ""} onChange={(e) => setForm({ ...form, reasonForPivot: e.target.value })} /></Field>
        <Field label="Previous hypothesis"><Textarea value={form.previousHypothesis ?? ""} onChange={(e) => setForm({ ...form, previousHypothesis: e.target.value })} /></Field>
        <Field label="New hypothesis"><Textarea value={form.newHypothesis ?? ""} onChange={(e) => setForm({ ...form, newHypothesis: e.target.value })} /></Field>
        <Field label="Evidence trigger"><Textarea value={form.evidenceTrigger ?? ""} onChange={(e) => setForm({ ...form, evidenceTrigger: e.target.value })} /></Field>
      </FormModal>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>{children}</div>;
}
