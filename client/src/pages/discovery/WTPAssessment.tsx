// ============================================================================
// MODULE 3 — Willingness-to-Pay Assessment
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DollarSign, Plus, Pencil, Trash2 } from "lucide-react";
import {
  ModuleHeader, VentureSelector, HypothesisSelector, ScoreCard, LeanDecisionPanel,
  NextExperimentPanel, EmptyState, NoVentureState, FormModal, Section, ToneBadge,
} from "@/components/discovery/primitives";
import {
  calculateWTPScore, bandFor0to100, generateLeanDecision, generateNextExperimentRecommendation,
  avg, EVIDENCE_LADDER, PRICING_MODELS,
} from "@shared/discoveryMarket";

export default function WTPAssessment() {
  const { selectedVentureId: ventureId } = useSelectedVenture();
  const utils = trpc.useUtils();
  const enabled = !!ventureId;
  const v = ventureId ?? "";
  const [hypId, setHypId] = useState<number | null>(null);

  const hypotheses = trpc.discoveryMarket.hypotheses.list.useQuery({ ventureId: v }, { enabled });
  const tests = trpc.discoveryMarket.wtpTests.list.useQuery({ ventureId: v, problemHypothesisId: hypId ?? undefined }, { enabled });

  const invalidate = () => { utils.discoveryMarket.wtpTests.list.invalidate(); utils.discoveryMarket.summary.invalidate(); utils.discoveryMarket.risks.list.invalidate(); };

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const upsert = trpc.discoveryMarket.wtpTests.upsert.useMutation({ onSuccess: () => { invalidate(); setOpen(false); toast.success("WTP test saved — risks updated"); } });
  const del = trpc.discoveryMarket.wtpTests.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("WTP test deleted"); } });

  const openForm = (row?: any) => {
    setForm(row ? { ...row } : {
      ventureId: v, customerName: "", problemHypothesisId: hypId, evidenceLevel: 1, budgetOwnerConfirmed: false,
    });
    setOpen(true);
  };

  const rows = tests.data ?? [];
  const liveScore = calculateWTPScore({ evidenceLevel: form.evidenceLevel ?? 1, budgetOwnerConfirmed: form.budgetOwnerConfirmed ?? false, procurementPathway: form.procurementPathway });
  const avgScore = avg(rows.map((r) => r.wtpScore ?? 0));

  if (!ventureId) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ModuleHeader title="Willingness to Pay" purpose="Move beyond positive feedback to real commercial commitment." icon={<DollarSign size={22} />} action={<VentureSelector />} />
        <NoVentureState />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <ModuleHeader title="Willingness to Pay" purpose="Climb the evidence ladder from 'interesting' to 'pays for pilot' with a confirmed budget owner." icon={<DollarSign size={22} />} action={<VentureSelector />} />

      <div className="flex flex-wrap items-center gap-4">
        <HypothesisSelector hypotheses={hypotheses.data ?? []} value={hypId} onChange={setHypId} />
        <Button size="sm" className="ml-auto" onClick={() => openForm()} style={{ background: "#56A837" }} data-testid="button-add-wtp"><Plus size={14} className="mr-1" />Add WTP Test</Button>
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ScoreCard label="WTP Confidence" score={avgScore} band={bandFor0to100(avgScore, "positive")} interpretation={`${rows.length} test${rows.length > 1 ? "s" : ""} run`} />
          <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LeanDecisionPanel title="Recommended Decision" decisions={generateLeanDecision("wtp", avgScore)} />
            <NextExperimentPanel recommendation={generateNextExperimentRecommendation("wtp", avgScore)} />
          </div>
        </div>
      )}

      <Section title="WTP Test Log">
        {rows.length > 0 ? (
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2.5 font-semibold">Customer</th>
                    <th className="px-4 py-2.5 font-semibold">Buyer role</th>
                    <th className="px-4 py-2.5 font-semibold">Evidence level</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Budget owner</th>
                    <th className="px-4 py-2.5 font-semibold">Price tested</th>
                    <th className="px-4 py-2.5 font-semibold">Score</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const band = bandFor0to100(r.wtpScore ?? 0, "positive");
                    const ladder = EVIDENCE_LADDER.find((l) => l.level === r.evidenceLevel);
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{r.customerName || "—"}</td>
                        <td className="px-4 py-2.5 text-gray-600">{r.buyerRole || "—"}</td>
                        <td className="px-4 py-2.5 text-gray-600"><span className="text-xs">L{r.evidenceLevel}</span> · {ladder?.label}</td>
                        <td className="px-4 py-2.5 text-center">{r.budgetOwnerConfirmed ? <span className="text-green-600 font-semibold">Yes</span> : <span className="text-gray-400">No</span>}</td>
                        <td className="px-4 py-2.5 text-gray-600">{r.priceTested || "—"}</td>
                        <td className="px-4 py-2.5"><div className="flex items-center gap-2"><span className="font-bold text-gray-700">{r.wtpScore}</span><ToneBadge band={band} /></div></td>
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
          <EmptyState title="No WTP tests" description="Test real willingness to pay, not just enthusiasm." action={<Button size="sm" variant="outline" onClick={() => openForm()}>Add WTP Test</Button>} />
        )}
      </Section>

      <FormModal wide open={open} onOpenChange={setOpen} title={form.id ? "Edit WTP Test" : "Add WTP Test"} submitting={upsert.isPending}
        onSubmit={() => upsert.mutate({ ...form, problemHypothesisId: form.problemHypothesisId ?? null })}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer name"><Input value={form.customerName ?? ""} onChange={(e) => setForm({ ...form, customerName: e.target.value })} data-testid="input-wtp-customer" /></Field>
          <Field label="Buyer role"><Input value={form.buyerRole ?? ""} onChange={(e) => setForm({ ...form, buyerRole: e.target.value })} /></Field>
        </div>
        <Field label="Evidence level (WTP ladder)">
          <Select value={String(form.evidenceLevel ?? 1)} onValueChange={(val) => setForm({ ...form, evidenceLevel: Number(val) })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{EVIDENCE_LADDER.map((l) => <SelectItem key={l.level} value={String(l.level)}>L{l.level} — {l.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Current spend"><Input value={form.currentSpend ?? ""} onChange={(e) => setForm({ ...form, currentSpend: e.target.value })} /></Field>
          <Field label="Pricing model tested">
            <Select value={form.pricingModelTested ?? "__none__"} onValueChange={(val) => setForm({ ...form, pricingModelTested: val === "__none__" ? "" : val })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">—</SelectItem>{PRICING_MODELS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Price tested"><Input value={form.priceTested ?? ""} onChange={(e) => setForm({ ...form, priceTested: e.target.value })} /></Field>
          <Field label="Procurement pathway"><Input value={form.procurementPathway ?? ""} onChange={(e) => setForm({ ...form, procurementPathway: e.target.value })} placeholder="e.g. Direct PO under £50k" /></Field>
        </div>
        <Field label="Value driver"><Textarea value={form.valueDriver ?? ""} onChange={(e) => setForm({ ...form, valueDriver: e.target.value })} /></Field>
        <Field label="Response summary"><Textarea value={form.responseSummary ?? ""} onChange={(e) => setForm({ ...form, responseSummary: e.target.value })} /></Field>
        <Field label="Objections"><Textarea value={form.objections ?? ""} onChange={(e) => setForm({ ...form, objections: e.target.value })} /></Field>
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2"><Switch checked={!!form.budgetOwnerConfirmed} onCheckedChange={(c) => setForm({ ...form, budgetOwnerConfirmed: c })} /><span className="text-xs text-gray-600">Budget owner confirmed</span></div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Live WTP Score:</span>
            <span className="font-bold text-gray-700">{liveScore}</span>
            <ToneBadge band={bandFor0to100(liveScore, "positive")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Recommended pricing model">
            <Select value={form.recommendedPricingModel ?? "__none__"} onValueChange={(val) => setForm({ ...form, recommendedPricingModel: val === "__none__" ? "" : val })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">—</SelectItem>{PRICING_MODELS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Next commercial action"><Input value={form.nextCommercialAction ?? ""} onChange={(e) => setForm({ ...form, nextCommercialAction: e.target.value })} /></Field>
        </div>
      </FormModal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>{children}</div>;
}
