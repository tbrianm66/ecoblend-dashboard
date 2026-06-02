// ============================================================================
// MODULE 3 — Lean Experiment Log (Build-Measure-Learn loop)
// Plan experiments, record results, capture learnings, decide next step.
// ============================================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FlaskConical, Plus, Pencil, Trash2, Target, ArrowRight } from "lucide-react";
import {
  ModuleHeader, VentureSelector, HypothesisSelector, EmptyState, NoVentureState,
  FormModal, Section,
} from "@/components/discovery/primitives";
import { EXPERIMENT_TYPES } from "@shared/discoveryMarket";

export default function ExperimentLog() {
  const { selectedVentureId: ventureId } = useSelectedVenture();
  const utils = trpc.useUtils();
  const enabled = !!ventureId;
  const v = ventureId ?? "";
  const [hypFilter, setHypFilter] = useState<number | null>(null);

  const hypotheses = trpc.discoveryMarket.hypotheses.list.useQuery({ ventureId: v }, { enabled });
  const experiments = trpc.discoveryMarket.experiments.list.useQuery({ ventureId: v }, { enabled });

  const invalidate = () => utils.discoveryMarket.experiments.list.invalidate();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const upsert = trpc.discoveryMarket.experiments.upsert.useMutation({ onSuccess: () => { invalidate(); setOpen(false); toast.success("Experiment saved"); } });
  const del = trpc.discoveryMarket.experiments.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("Experiment deleted"); } });

  const openForm = (row?: any) => {
    setForm(row ? { ...row } : {
      ventureId: v, experimentName: "", experimentType: "interview", problemHypothesisId: null,
    });
    setOpen(true);
  };

  const hypMap = useMemo(() => {
    const m = new Map<number, string>();
    (hypotheses.data ?? []).forEach((h) => m.set(h.id, h.hypothesisStatement));
    return m;
  }, [hypotheses.data]);

  const allRows = experiments.data ?? [];
  const rows = useMemo(
    () => (hypFilter === null ? allRows : allRows.filter((r) => r.problemHypothesisId === hypFilter)),
    [allRows, hypFilter],
  );

  if (!ventureId) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ModuleHeader title="Experiment Log" purpose="Plan validation experiments, record results, and capture what you learned to close the Build-Measure-Learn loop." icon={<FlaskConical size={22} />} action={<VentureSelector />} />
        <NoVentureState />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      <ModuleHeader title="Experiment Log" purpose="Plan validation experiments, record results, and capture what you learned to close the Build-Measure-Learn loop." icon={<FlaskConical size={22} />} action={<VentureSelector />} />

      <Section
        title="Lean Experiments"
        action={
          <div className="flex items-center gap-3">
            <HypothesisSelector hypotheses={hypotheses.data ?? []} value={hypFilter} onChange={setHypFilter} />
            <Button size="sm" onClick={() => openForm()} style={{ background: "#56A837" }} data-testid="button-add-experiment"><Plus size={14} className="mr-1" />Add Experiment</Button>
          </div>
        }
      >
        {rows.length > 0 ? (
          <div className="space-y-3">
            {rows.map((ex) => (
              <Card key={ex.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2 min-w-0">
                      <FlaskConical size={15} className="mt-0.5 shrink-0" style={{ color: "#3B85BA" }} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-800">{ex.experimentName}</span>
                          {ex.experimentType && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: "#3B85BA", background: "rgba(59,133,186,0.10)", border: "1px solid rgba(59,133,186,0.30)" }}>
                              {ex.experimentType.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                        {ex.problemHypothesisId && hypMap.has(ex.problemHypothesisId) && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                            <Target size={11} className="shrink-0" />
                            <span className="truncate">{hypMap.get(ex.problemHypothesisId)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openForm(ex)} className="text-gray-400 hover:text-gray-700"><Pencil size={13} /></button>
                      <button onClick={() => del.mutate({ id: ex.id })} className="text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-xs">
                    {ex.hypothesisTested && <Detail label="Hypothesis tested" value={ex.hypothesisTested} />}
                    {ex.method && <Detail label="Method" value={ex.method} />}
                    {ex.successThreshold && <Detail label="Success threshold" value={ex.successThreshold} />}
                    {ex.result && <Detail label="Result" value={ex.result} />}
                    {ex.learningSummary && <Detail label="Learning" value={ex.learningSummary} />}
                  </div>

                  {(ex.decision || ex.nextStep) && (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 pt-3 border-t text-xs">
                      {ex.decision && (
                        <div className="flex items-start gap-1.5">
                          <span className="font-semibold uppercase tracking-wider text-gray-400">Decision</span>
                          <span className="text-gray-700">{ex.decision}</span>
                        </div>
                      )}
                      {ex.nextStep && (
                        <div className="flex items-start gap-1.5">
                          <ArrowRight size={13} className="mt-px shrink-0" style={{ color: "#56A837" }} />
                          <span className="text-gray-700">{ex.nextStep}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No experiments yet" description="Design experiments to test your riskiest assumptions, then record results and learnings here." action={<Button size="sm" variant="outline" onClick={() => openForm()}>Add Experiment</Button>} />
        )}
      </Section>

      <FormModal wide open={open} onOpenChange={setOpen} title={form.id ? "Edit Experiment" : "Add Experiment"} submitting={upsert.isPending}
        onSubmit={() => { if (!form.experimentName?.trim()) return toast.error("Experiment name required"); upsert.mutate({ ...form, problemHypothesisId: form.problemHypothesisId ?? null }); }}>
        <Field label="Experiment name"><Input value={form.experimentName ?? ""} onChange={(e) => setForm({ ...form, experimentName: e.target.value })} data-testid="input-experiment-name" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Experiment type">
            <Select value={form.experimentType ?? "interview"} onValueChange={(val) => setForm({ ...form, experimentType: val })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{EXPERIMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Linked hypothesis">
            <Select value={form.problemHypothesisId ? String(form.problemHypothesisId) : "__none__"} onValueChange={(val) => setForm({ ...form, problemHypothesisId: val === "__none__" ? null : Number(val) })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {(hypotheses.data ?? []).map((h) => <SelectItem key={h.id} value={String(h.id)}>{h.hypothesisStatement.length > 50 ? h.hypothesisStatement.slice(0, 50) + "…" : h.hypothesisStatement}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Hypothesis tested"><Textarea value={form.hypothesisTested ?? ""} onChange={(e) => setForm({ ...form, hypothesisTested: e.target.value })} placeholder="We believe that…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Method"><Textarea value={form.method ?? ""} onChange={(e) => setForm({ ...form, method: e.target.value })} placeholder="How will you run the test?" /></Field>
          <Field label="Success threshold"><Textarea value={form.successThreshold ?? ""} onChange={(e) => setForm({ ...form, successThreshold: e.target.value })} placeholder="What result would validate the hypothesis?" /></Field>
        </div>
        <Field label="Result"><Textarea value={form.result ?? ""} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="What actually happened?" /></Field>
        <Field label="Learning summary"><Textarea value={form.learningSummary ?? ""} onChange={(e) => setForm({ ...form, learningSummary: e.target.value })} placeholder="What did you learn?" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Decision"><Input value={form.decision ?? ""} onChange={(e) => setForm({ ...form, decision: e.target.value })} placeholder="Persevere / Pivot / Kill" /></Field>
          <Field label="Next step"><Input value={form.nextStep ?? ""} onChange={(e) => setForm({ ...form, nextStep: e.target.value })} placeholder="What happens next?" /></Field>
        </div>
      </FormModal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-semibold uppercase tracking-wider text-gray-400">{label}: </span>
      <span className="text-gray-600">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>{children}</div>;
}
