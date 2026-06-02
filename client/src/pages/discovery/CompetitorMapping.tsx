// ============================================================================
// MODULE 3 — Competitor Mapping
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
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import {
  ModuleHeader, VentureSelector, HypothesisSelector, ScoreCard, LeanDecisionPanel,
  NextExperimentPanel, EmptyState, NoVentureState, FormModal, ScoreSelect, Section, ToneBadge,
} from "@/components/discovery/primitives";
import {
  calculateCompetitiveRiskScore, bandFor0to100, generateLeanDecision,
  generateNextExperimentRecommendation, avg, COMPETITOR_TYPES,
} from "@shared/discoveryMarket";

export default function CompetitorMapping() {
  const { selectedVentureId: ventureId } = useSelectedVenture();
  const utils = trpc.useUtils();
  const enabled = !!ventureId;
  const v = ventureId ?? "";

  const [hypId, setHypId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("__all__");

  const hypotheses = trpc.discoveryMarket.hypotheses.list.useQuery({ ventureId: v }, { enabled });
  const competitors = trpc.discoveryMarket.competitors.list.useQuery({ ventureId: v, problemHypothesisId: hypId ?? undefined }, { enabled });

  const invalidate = () => { utils.discoveryMarket.competitors.list.invalidate(); utils.discoveryMarket.summary.invalidate(); utils.discoveryMarket.risks.list.invalidate(); };

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const upsert = trpc.discoveryMarket.competitors.upsert.useMutation({ onSuccess: () => { invalidate(); setOpen(false); toast.success("Competitor saved — risks updated"); } });
  const del = trpc.discoveryMarket.competitors.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("Competitor deleted"); } });

  const openForm = (row?: any) => {
    setForm(row ? { ...row } : {
      ventureId: v, competitorName: "", competitorType: "direct", problemHypothesisId: hypId,
      customerSatisfactionScore: 0, switchingDifficultyScore: 0, differentiationScore: 1, threatScore: 0,
    });
    setOpen(true);
  };

  const rows = useMemo(() => (competitors.data ?? []).filter((c) => typeFilter === "__all__" || c.competitorType === typeFilter), [competitors.data, typeFilter]);
  const allRows = competitors.data ?? [];

  const liveRisk = calculateCompetitiveRiskScore({
    customerSatisfactionScore: form.customerSatisfactionScore ?? 0, switchingDifficultyScore: form.switchingDifficultyScore ?? 0,
    threatScore: form.threatScore ?? 0, differentiationScore: form.differentiationScore ?? 1,
  });

  // Output summary
  const avgRisk = avg(allRows.map((c) => c.competitiveRiskScore ?? 0));
  const strongest = allRows.slice().sort((a, b) => (b.competitiveRiskScore ?? 0) - (a.competitiveRiskScore ?? 0))[0];
  const dangerousSub = allRows.filter((c) => c.competitorType === "substitute").sort((a, b) => (b.threatScore ?? 0) - (a.threatScore ?? 0))[0];
  const statusQuo = allRows.filter((c) => c.competitorType === "status_quo").sort((a, b) => (b.customerSatisfactionScore ?? 0) - (a.customerSatisfactionScore ?? 0))[0];
  const bestDiff = allRows.slice().sort((a, b) => (b.differentiationScore ?? 0) - (a.differentiationScore ?? 0))[0];

  if (!ventureId) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ModuleHeader title="Competitor Mapping" purpose="Identify whether the customer already has acceptable alternatives." icon={<Search size={22} />} action={<VentureSelector />} />
        <NoVentureState />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <ModuleHeader title="Competitor Mapping" purpose="Direct, indirect, substitute, status-quo and future competitors — and how hard they are to displace." icon={<Search size={22} />} action={<VentureSelector />} />

      <div className="flex flex-wrap items-center gap-4">
        <HypothesisSelector hypotheses={hypotheses.data ?? []} value={hypId} onChange={setHypId} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Type</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {COMPETITOR_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="ml-auto" onClick={() => openForm()} style={{ background: "#56A837" }} data-testid="button-add-competitor"><Plus size={14} className="mr-1" />Add Competitor</Button>
      </div>

      {allRows.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ScoreCard label="Competitive Intensity" score={avgRisk} band={bandFor0to100(avgRisk, "risk")} interpretation={`${allRows.length} competitor${allRows.length > 1 ? "s" : ""} mapped`} />
            <Card className="border shadow-sm md:col-span-2">
              <CardContent className="p-5 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <Out label="Strongest competitor" value={strongest?.competitorName} />
                <Out label="Most dangerous substitute" value={dangerousSub?.competitorName} />
                <Out label="Status-quo risk" value={statusQuo ? `${statusQuo.competitorName} (satisfaction ${statusQuo.customerSatisfactionScore}/5)` : "—"} />
                <Out label="Differentiation strength" value={bestDiff ? `${bestDiff.differentiationScore}/5 best` : "—"} />
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LeanDecisionPanel title="Recommended Positioning" decisions={generateLeanDecision("competitor", avgRisk)} />
            <NextExperimentPanel recommendation={generateNextExperimentRecommendation("competitor", avgRisk)} />
          </div>
        </>
      )}

      <Section title="Competitor Table">
        {rows.length > 0 ? (
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2.5 font-semibold">Competitor</th>
                    <th className="px-4 py-2.5 font-semibold">Type</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Satis.</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Switch</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Diff.</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Threat</th>
                    <th className="px-4 py-2.5 font-semibold">Risk</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => {
                    const band = bandFor0to100(c.competitiveRiskScore ?? 0, "risk");
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-gray-800">{c.competitorName}</div>
                          {c.pricingModel && <div className="text-xs text-gray-400">{c.pricingModel}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 capitalize">{(c.competitorType ?? "").replace(/_/g, " ")}</td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{c.customerSatisfactionScore}</td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{c.switchingDifficultyScore}</td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{c.differentiationScore}</td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{c.threatScore}</td>
                        <td className="px-4 py-2.5"><div className="flex items-center gap-2"><span className="font-bold text-gray-700">{c.competitiveRiskScore}</span><ToneBadge band={band} /></div></td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <button onClick={() => openForm(c)} className="text-gray-400 hover:text-gray-700 mr-2"><Pencil size={13} /></button>
                          <button onClick={() => del.mutate({ id: c.id })} className="text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <EmptyState title="No competitors mapped" description="Map the alternatives your customer can already choose." action={<Button size="sm" variant="outline" onClick={() => openForm()}>Add Competitor</Button>} />
        )}
      </Section>

      <FormModal wide open={open} onOpenChange={setOpen} title={form.id ? "Edit Competitor" : "Add Competitor"} submitting={upsert.isPending}
        onSubmit={() => { if (!form.competitorName?.trim()) return toast.error("Competitor name required"); upsert.mutate({ ...form, problemHypothesisId: form.problemHypothesisId ?? null }); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Competitor name"><Input value={form.competitorName ?? ""} onChange={(e) => setForm({ ...form, competitorName: e.target.value })} data-testid="input-competitor-name" /></Field>
          <Field label="Competitor type">
            <Select value={form.competitorType ?? "direct"} onValueChange={(val) => setForm({ ...form, competitorType: val })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{COMPETITOR_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Customer segment"><Input value={form.customerSegment ?? ""} onChange={(e) => setForm({ ...form, customerSegment: e.target.value })} /></Field>
          <Field label="Pricing model"><Input value={form.pricingModel ?? ""} onChange={(e) => setForm({ ...form, pricingModel: e.target.value })} /></Field>
        </div>
        <Field label="Problem solved"><Input value={form.problemSolved ?? ""} onChange={(e) => setForm({ ...form, problemSolved: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Strengths"><Textarea value={form.strengths ?? ""} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></Field>
          <Field label="Weaknesses"><Textarea value={form.weaknesses ?? ""} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <ScoreSelect label="Satisfaction (1-5)" value={form.customerSatisfactionScore ?? 0} onChange={(n) => setForm({ ...form, customerSatisfactionScore: n })} />
          <ScoreSelect label="Switch difficulty (1-5)" value={form.switchingDifficultyScore ?? 0} onChange={(n) => setForm({ ...form, switchingDifficultyScore: n })} />
          <ScoreSelect label="Differentiation (1-5)" value={form.differentiationScore ?? 1} onChange={(n) => setForm({ ...form, differentiationScore: n })} />
          <ScoreSelect label="Threat (1-5)" value={form.threatScore ?? 0} onChange={(n) => setForm({ ...form, threatScore: n })} />
        </div>
        <div className="flex items-center justify-end gap-2 p-3 rounded-lg bg-gray-50">
          <span className="text-xs text-gray-500">Live Competitive Risk:</span>
          <span className="font-bold text-gray-700">{liveRisk}</span>
          <ToneBadge band={bandFor0to100(liveRisk, "risk")} />
        </div>
        <Field label="Notes"><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      </FormModal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>{children}</div>;
}
function Out({ label, value }: { label: string; value?: string | null }) {
  return <div><div className="text-xs text-gray-400">{label}</div><div className="text-gray-700 font-medium">{value || "—"}</div></div>;
}
