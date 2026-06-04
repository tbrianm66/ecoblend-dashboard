// ============================================================================
// MODULE 3 — Demand Signals
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TrendingUp, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import {
  ModuleHeader, VentureSelector, HypothesisSelector, ScoreCard, LeanDecisionPanel,
  NextExperimentPanel, EmptyState, NoVentureState, FormModal, ScoreSelect, Section, ToneBadge,
} from "@/components/discovery/primitives";
import {
  calculateDemandSignalScore, bandFor0to100, generateLeanDecision,
  generateNextExperimentRecommendation, avg, SIGNAL_TYPES,
} from "@shared/discoveryMarket";

export default function DemandSignals() {
  const { selectedVentureId: ventureId } = useSelectedVenture();
  const utils = trpc.useUtils();
  const enabled = !!ventureId;
  const v = ventureId ?? "";
  const [hypId, setHypId] = useState<number | null>(null);

  const hypotheses = trpc.discoveryMarket.hypotheses.list.useQuery({ ventureId: v }, { enabled });
  const signals = trpc.discoveryMarket.demandSignals.list.useQuery({ ventureId: v, problemHypothesisId: hypId ?? undefined }, { enabled });

  const invalidate = () => { utils.discoveryMarket.demandSignals.list.invalidate(); utils.discoveryMarket.summary.invalidate(); utils.discoveryMarket.risks.list.invalidate(); };

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const upsert = trpc.discoveryMarket.demandSignals.upsert.useMutation({ onSuccess: () => { invalidate(); setOpen(false); toast.success("Signal saved — risks updated"); } });
  const del = trpc.discoveryMarket.demandSignals.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("Signal deleted"); } });

  const openForm = (row?: any) => {
    setForm(row ? { ...row } : {
      ventureId: v, signalName: "", signalType: "customer_pull", problemHypothesisId: hypId,
      relevanceScore: 0, evidenceStrengthScore: 0, recencyScore: 0, commercialImpactScore: 0, repeatabilityScore: 0,
    });
    setOpen(true);
  };

  const rows = signals.data ?? [];
  const liveScore = calculateDemandSignalScore({
    relevanceScore: form.relevanceScore ?? 0, evidenceStrengthScore: form.evidenceStrengthScore ?? 0, recencyScore: form.recencyScore ?? 0,
    commercialImpactScore: form.commercialImpactScore ?? 0, repeatabilityScore: form.repeatabilityScore ?? 0,
  });
  const avgScore = avg(rows.map((r) => r.demandSignalScore ?? 0));

  if (!ventureId) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ModuleHeader title="Demand Signals" purpose="Evidence that demand exists beyond your own interviews." icon={<TrendingUp size={22} />} action={<VentureSelector />} />
        <NoVentureState />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <ModuleHeader title="Demand Signals" purpose="Customer pull, search demand, procurement, regulation, investment, hiring and media signals." icon={<TrendingUp size={22} />} action={<VentureSelector />} />

      <div className="flex flex-wrap items-center gap-4">
        <HypothesisSelector hypotheses={hypotheses.data ?? []} value={hypId} onChange={setHypId} />
        <Button size="sm" className="ml-auto" onClick={() => openForm()} style={{ background: "#56A837" }} data-testid="button-add-signal"><Plus size={14} className="mr-1" />Add Signal</Button>
      </div>

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ScoreCard label="Demand Signal Strength" score={avgScore} band={bandFor0to100(avgScore, "positive")} interpretation={`${rows.length} signal${rows.length > 1 ? "s" : ""} captured`} />
            <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LeanDecisionPanel title="Recommended Decision" decisions={generateLeanDecision("demand", avgScore)} />
              <NextExperimentPanel recommendation={generateNextExperimentRecommendation("demand", avgScore)} />
            </div>
          </div>
        </>
      )}

      <Section title="Demand Signal Log">
        {rows.length > 0 ? (
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2.5 font-semibold">Signal</th>
                    <th className="px-4 py-2.5 font-semibold">Type</th>
                    <th className="px-4 py-2.5 font-semibold">Source</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Relev.</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Evid.</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Impact</th>
                    <th className="px-4 py-2.5 font-semibold">Score</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const band = bandFor0to100(r.demandSignalScore ?? 0, "positive");
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-gray-800">{r.signalName}</div>
                          {r.signalDate && <div className="text-xs text-gray-400">{r.signalDate}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 capitalize">{(r.signalType ?? "").replace(/_/g, " ")}</td>
                        <td className="px-4 py-2.5 text-gray-600">
                          <span>{r.sourceName || "—"}</span>
                          {r.sourceUrl && <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex ml-1 text-blue-500"><ExternalLink size={12} /></a>}
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{r.relevanceScore}</td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{r.evidenceStrengthScore}</td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{r.commercialImpactScore}</td>
                        <td className="px-4 py-2.5"><div className="flex items-center gap-2"><span className="font-bold text-gray-700">{r.demandSignalScore}</span><ToneBadge band={band} /></div></td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <button onClick={() => openForm(r)} className="text-gray-400 hover:text-gray-700 mr-2"><Pencil size={13} /></button>
                          <button onClick={() => del.mutate({ id: r.id, ventureId: v })} className="text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <EmptyState title="No demand signals" description="Capture external evidence that the market is moving." action={<Button size="sm" variant="outline" onClick={() => openForm()}>Add Signal</Button>} />
        )}
      </Section>

      <FormModal wide open={open} onOpenChange={setOpen} title={form.id ? "Edit Signal" : "Add Demand Signal"} submitting={upsert.isPending}
        onSubmit={() => { if (!form.signalName?.trim()) return toast.error("Signal name required"); upsert.mutate({ ...form, problemHypothesisId: form.problemHypothesisId ?? null }); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Signal name"><Input value={form.signalName ?? ""} onChange={(e) => setForm({ ...form, signalName: e.target.value })} data-testid="input-signal-name" /></Field>
          <Field label="Signal type">
            <Select value={form.signalType ?? "customer_pull"} onValueChange={(val) => setForm({ ...form, signalType: val })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{SIGNAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Source name"><Input value={form.sourceName ?? ""} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} /></Field>
          <Field label="Source URL"><Input value={form.sourceUrl ?? ""} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} /></Field>
          <Field label="Signal date"><Input type="date" value={form.signalDate ?? ""} onChange={(e) => setForm({ ...form, signalDate: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <ScoreSelect label="Relevance" value={form.relevanceScore ?? 0} onChange={(n) => setForm({ ...form, relevanceScore: n })} />
          <ScoreSelect label="Evidence" value={form.evidenceStrengthScore ?? 0} onChange={(n) => setForm({ ...form, evidenceStrengthScore: n })} />
          <ScoreSelect label="Recency" value={form.recencyScore ?? 0} onChange={(n) => setForm({ ...form, recencyScore: n })} />
          <ScoreSelect label="Comm. Impact" value={form.commercialImpactScore ?? 0} onChange={(n) => setForm({ ...form, commercialImpactScore: n })} />
          <ScoreSelect label="Repeatability" value={form.repeatabilityScore ?? 0} onChange={(n) => setForm({ ...form, repeatabilityScore: n })} />
        </div>
        <div className="flex items-center justify-end gap-2 p-3 rounded-lg bg-gray-50">
          <span className="text-xs text-gray-500">Live Demand Signal Score:</span>
          <span className="font-bold text-gray-700">{liveScore}</span>
          <ToneBadge band={bandFor0to100(liveScore, "positive")} />
        </div>
        <Field label="Evidence summary"><Textarea value={form.evidenceSummary ?? ""} onChange={(e) => setForm({ ...form, evidenceSummary: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Linked experiment"><Input value={form.linkedExperiment ?? ""} onChange={(e) => setForm({ ...form, linkedExperiment: e.target.value })} /></Field>
          <Field label="Success threshold"><Input value={form.successThreshold ?? ""} onChange={(e) => setForm({ ...form, successThreshold: e.target.value })} /></Field>
        </div>
      </FormModal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>{children}</div>;
}
