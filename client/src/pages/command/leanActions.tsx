// ============================================================================
// COMMAND CENTRE — Lean OS action modals
// Action-capable flows shared by the Decision Board and Experiment Queue:
// manage an experiment, capture evidence from a completed experiment, log /
// approve / reject a decision, and record a pivot. All write via the
// commandCentreLean tRPC router and invalidate the relevant aggregate queries.
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FormModal, ScoreSelect } from "@/components/command/primitives";
import {
  humanise,
  EXPERIMENT_STATUSES,
  DECISION_RECOMMENDATIONS,
  EVIDENCE_TYPES,
  DECISION_TYPES,
  DECISION_STATUSES,
  PIVOT_TYPES,
} from "@shared/commandCentre";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options, testId }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[]; testId?: string;
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm" data-testid={testId}><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{humanise(o)}</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  );
}

// ─── Manage an experiment (status transition + result / learning capture) ──────
export function ExperimentManageModal({ open, onOpenChange, experiment, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  experiment: any; onSaved?: () => void;
}) {
  const [status, setStatus] = useState<string>(experiment?.experimentStatus ?? "proposed");
  const [result, setResult] = useState<string>(experiment?.result ?? "");
  const [learning, setLearning] = useState<string>(experiment?.learningSummary ?? "");
  const [rec, setRec] = useState<string>(experiment?.decisionRecommendation ?? "persevere");
  const [nextStep, setNextStep] = useState<string>(experiment?.nextStep ?? "");

  const upsert = trpc.commandCentreLean.experiments.upsert.useMutation({
    onSuccess: () => { toast.success("Experiment updated"); onOpenChange(false); onSaved?.(); },
    onError: (e) => toast.error(e.message),
  });

  const isCompleting = status === "completed";
  function submit() {
    upsert.mutate({
      id: experiment.id,
      ventureId: experiment.ventureId,
      experimentName: experiment.experimentName,
      experimentStatus: status as any,
      result: result || null,
      learningSummary: learning || null,
      decisionRecommendation: isCompleting ? (rec as any) : (experiment.decisionRecommendation ?? null),
      nextStep: nextStep || null,
    });
  }

  return (
    <FormModal open={open} onOpenChange={onOpenChange} title={`Manage: ${experiment?.experimentName ?? ""}`}
      onSubmit={submit} submitting={upsert.isPending} submitLabel="Save experiment">
      <SelectField label="Status" value={status} onChange={setStatus} options={EXPERIMENT_STATUSES.filter((s) => s !== "overdue")} testId="select-experiment-status" />
      {isCompleting && (
        <>
          <Field label="Result"><Textarea value={result} onChange={(e) => setResult(e.target.value)} placeholder="What did the experiment show? (pass / fail / metric outcome)" rows={2} /></Field>
          <Field label="Learning summary"><Textarea value={learning} onChange={(e) => setLearning(e.target.value)} placeholder="Key learning / insight" rows={2} /></Field>
          <SelectField label="Decision recommendation" value={rec} onChange={setRec} options={DECISION_RECOMMENDATIONS} testId="select-experiment-rec" />
        </>
      )}
      <Field label="Next step"><Input value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="Follow-up action" /></Field>
    </FormModal>
  );
}

// ─── Create evidence from a completed experiment ──────────────────────────────
export function EvidenceFromExperimentModal({ open, onOpenChange, experiment, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  experiment: any; onSaved?: () => void;
}) {
  const [evidenceType, setEvidenceType] = useState<string>("prototype_result");
  const [title, setTitle] = useState<string>(experiment ? `Result: ${experiment.experimentName}` : "");
  const [summary, setSummary] = useState<string>(experiment?.learningSummary ?? experiment?.result ?? "");
  const [strength, setStrength] = useState(3);
  const [relevance, setRelevance] = useState(3);
  const [recency, setRecency] = useState(5);
  const [contradicts, setContradicts] = useState(false);

  const upsert = trpc.commandCentreLean.evidence.upsert.useMutation({
    onSuccess: () => { toast.success("Evidence captured"); onOpenChange(false); onSaved?.(); },
    onError: (e) => toast.error(e.message),
  });

  function submit() {
    if (!title.trim()) { toast.error("Evidence title is required"); return; }
    upsert.mutate({
      ventureId: experiment.ventureId,
      experimentId: experiment.id,
      hypothesisId: experiment.hypothesisId ?? null,
      moduleSource: "command_centre",
      evidenceType: evidenceType as any,
      evidenceTitle: title,
      evidenceSummary: summary || null,
      evidenceStrengthScore: strength,
      evidenceRelevanceScore: relevance,
      evidenceRecencyScore: recency,
      contradictsHypothesis: contradicts,
    });
  }

  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Capture evidence from experiment"
      onSubmit={submit} submitting={upsert.isPending} submitLabel="Save evidence">
      <SelectField label="Evidence type" value={evidenceType} onChange={setEvidenceType} options={EVIDENCE_TYPES} testId="select-evidence-type" />
      <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-evidence-title" /></Field>
      <Field label="Summary"><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <ScoreSelect label="Strength" value={strength} onChange={setStrength} />
        <ScoreSelect label="Relevance" value={relevance} onChange={setRelevance} />
        <ScoreSelect label="Recency" value={recency} onChange={setRecency} />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={contradicts} onChange={(e) => setContradicts(e.target.checked)} data-testid="checkbox-contradicts" />
        This evidence contradicts the hypothesis
      </label>
    </FormModal>
  );
}

// ─── Log / approve / reject a Lean decision from the board ─────────────────────
export function DecisionActionModal({ open, onOpenChange, card, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  card: any; onSaved?: () => void;
}) {
  const recToType: Record<string, string> = {
    advance_stage: "advance_stage", persevere: "persevere", pivot: "pivot",
    pause: "pause", kill: "kill", run_more_experiments: "request_more_evidence",
    request_more_evidence: "request_more_evidence",
  };
  const [decisionType, setDecisionType] = useState<string>(recToType[card?.recommendation] ?? "persevere");
  const [title, setTitle] = useState<string>(card ? `${card.decisionLabel} — ${card.name}` : "");
  const [summary, setSummary] = useState<string>(card?.rationale ?? "");
  const [decisionStatus, setDecisionStatus] = useState<string>("approved");
  const [notes, setNotes] = useState<string>("");
  const [approvedBy, setApprovedBy] = useState<string>("");

  const upsert = trpc.commandCentreLean.decisions.upsert.useMutation({
    onSuccess: () => {
      toast.success(decisionType === "pivot" && decisionStatus === "approved"
        ? "Decision logged — pivot recorded" : "Decision logged");
      onOpenChange(false); onSaved?.();
    },
    onError: (e) => toast.error(e.message),
  });

  function submit() {
    if (!title.trim()) { toast.error("Decision title is required"); return; }
    upsert.mutate({
      ventureId: card.ventureId,
      decisionType: decisionType as any,
      decisionTitle: title,
      decisionSummary: summary || null,
      evidenceConfidenceScore: card.evidenceConfidence ?? null,
      riskScore: card.riskScore ?? null,
      recommendedAction: card.nextBestAction ?? null,
      decisionStatus: decisionStatus as any,
      reviewerNotes: notes || null,
      approvedBy: approvedBy || null,
      decisionDate: new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <FormModal open={open} onOpenChange={onOpenChange} title={`Log decision: ${card?.name ?? ""}`}
      onSubmit={submit} submitting={upsert.isPending} submitLabel="Save decision">
      <SelectField label="Decision type" value={decisionType} onChange={setDecisionType} options={DECISION_TYPES} testId="select-decision-type" />
      <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-decision-title" /></Field>
      <Field label="Summary / rationale"><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} /></Field>
      <SelectField label="Status" value={decisionStatus} onChange={setDecisionStatus} options={DECISION_STATUSES} testId="select-decision-status" />
      <Field label="Reviewer notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Why approve / reject?" /></Field>
      <Field label="Approved / reviewed by"><Input value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} placeholder="Name" /></Field>
      {decisionType === "pivot" && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
          Approving a pivot decision automatically records a pivot-log entry for this venture.
        </p>
      )}
    </FormModal>
  );
}

// ─── Record a pivot directly ───────────────────────────────────────────────────
export function PivotModal({ open, onOpenChange, card, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  card: any; onSaved?: () => void;
}) {
  const [pivotType, setPivotType] = useState<string>("value_proposition");
  const [previous, setPrevious] = useState<string>(card?.currentHypothesis ?? "");
  const [next, setNext] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const upsert = trpc.commandCentreLean.pivots.upsert.useMutation({
    onSuccess: () => { toast.success("Pivot recorded"); onOpenChange(false); onSaved?.(); },
    onError: (e) => toast.error(e.message),
  });

  function submit() {
    upsert.mutate({
      ventureId: card.ventureId,
      pivotType: pivotType as any,
      previousHypothesis: previous || null,
      newHypothesis: next || null,
      reasonForPivot: reason || null,
      evidenceTrigger: card.topContradicting ?? null,
    });
  }

  return (
    <FormModal open={open} onOpenChange={onOpenChange} title={`Log pivot: ${card?.name ?? ""}`}
      onSubmit={submit} submitting={upsert.isPending} submitLabel="Record pivot">
      <SelectField label="Pivot type" value={pivotType} onChange={setPivotType} options={PIVOT_TYPES} testId="select-pivot-type" />
      <Field label="Previous hypothesis"><Textarea value={previous} onChange={(e) => setPrevious(e.target.value)} rows={2} /></Field>
      <Field label="New hypothesis"><Textarea value={next} onChange={(e) => setNext(e.target.value)} rows={2} placeholder="What are we testing instead?" /></Field>
      <Field label="Reason for pivot"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} /></Field>
    </FormModal>
  );
}
