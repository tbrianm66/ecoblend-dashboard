// ============================================================================
// MODULE 3 — Customer Discovery (+ combined Discovery & Market summary)
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
import { MessageSquare, Plus, Pencil, Trash2, Users, Target } from "lucide-react";
import {
  ModuleHeader, VentureSelector, ScoreCard, LeanDecisionPanel, NextExperimentPanel,
  EmptyState, NoVentureState, FormModal, ScoreSelect, Section, StatusBadge, ToneBadge,
} from "@/components/discovery/primitives";
import {
  calculateCustomerDiscoveryScore, interpretDiscoveryScore, bandFor0to100,
  generateLeanDecision, generateNextExperimentRecommendation, avg,
  interpretOverallConfidence, PROBLEM_HYPOTHESIS_STATUSES, WTP_SIGNAL_OPTIONS, INTERVIEW_TYPES,
} from "@shared/discoveryMarket";

const FONT_HEAD = "'Prompt', sans-serif";

export default function CustomerDiscovery() {
  const { selectedVentureId: ventureId } = useSelectedVenture();
  const utils = trpc.useUtils();
  const enabled = !!ventureId;
  const v = ventureId ?? "";

  const segments = trpc.discoveryMarket.segments.list.useQuery({ ventureId: v }, { enabled });
  const hypotheses = trpc.discoveryMarket.hypotheses.list.useQuery({ ventureId: v }, { enabled });
  const interviews = trpc.discoveryMarket.interviews.list.useQuery({ ventureId: v }, { enabled });
  const summary = trpc.discoveryMarket.summary.useQuery({ ventureId: v }, { enabled });

  const invalidate = () => {
    utils.discoveryMarket.segments.list.invalidate();
    utils.discoveryMarket.hypotheses.list.invalidate();
    utils.discoveryMarket.interviews.list.invalidate();
    utils.discoveryMarket.summary.invalidate();
    utils.discoveryMarket.risks.list.invalidate();
  };

  // ── Segment form ──
  const [segOpen, setSegOpen] = useState(false);
  const [segForm, setSegForm] = useState<any>({});
  const segUpsert = trpc.discoveryMarket.segments.upsert.useMutation({ onSuccess: () => { invalidate(); setSegOpen(false); toast.success("Segment saved"); } });
  const segDelete = trpc.discoveryMarket.segments.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("Segment deleted"); } });

  // ── Hypothesis form ──
  const [hypOpen, setHypOpen] = useState(false);
  const [hypForm, setHypForm] = useState<any>({});
  const hypUpsert = trpc.discoveryMarket.hypotheses.upsert.useMutation({ onSuccess: () => { invalidate(); setHypOpen(false); toast.success("Hypothesis saved"); } });
  const hypDelete = trpc.discoveryMarket.hypotheses.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("Hypothesis deleted"); } });

  // ── Interview form ──
  const [intOpen, setIntOpen] = useState(false);
  const [intForm, setIntForm] = useState<any>({});
  const intUpsert = trpc.discoveryMarket.interviews.upsert.useMutation({ onSuccess: () => { invalidate(); setIntOpen(false); toast.success("Interview saved — risks updated"); } });
  const intDelete = trpc.discoveryMarket.interviews.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("Interview deleted"); } });

  const openSeg = (row?: any) => { setSegForm(row ? { ...row } : { ventureId: v, segmentName: "" }); setSegOpen(true); };
  const openHyp = (row?: any) => { setHypForm(row ? { ...row } : { ventureId: v, hypothesisStatement: "", status: "untested" }); setHypOpen(true); };
  const openInt = (row?: any) => {
    setIntForm(row ? { ...row } : {
      ventureId: v, contactName: "", interviewType: "discovery", painScore: 0, urgencyScore: 0,
      frequencyScore: 0, budgetSignalScore: 0, decisionMakerAccessScore: 0, willingnessToPaySignal: "none",
      problemMentionedUnprompted: false, willingnessToTrial: false,
    });
    setIntOpen(true);
  };

  const liveDiscovery = calculateCustomerDiscoveryScore({
    painScore: intForm.painScore ?? 0, urgencyScore: intForm.urgencyScore ?? 0, frequencyScore: intForm.frequencyScore ?? 0,
    budgetSignalScore: intForm.budgetSignalScore ?? 0, decisionMakerAccessScore: intForm.decisionMakerAccessScore ?? 0,
  });

  const s = summary.data?.scores;
  const decisions = summary.data?.decision ?? [];

  const interviewRows = interviews.data ?? [];
  const cdScore = avg(interviewRows.map((it) => it.discoveryScore ?? 0));

  if (!ventureId) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ModuleHeader title="Customer Discovery" purpose="Validate a real customer, a painful problem, a workaround, and a credible buyer." icon={<MessageSquare size={22} />} action={<VentureSelector />} />
        <NoVentureState />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      <ModuleHeader title="Customer Discovery" purpose="Validate a real customer, a painful problem, a workaround, and a credible buyer." icon={<MessageSquare size={22} />} action={<VentureSelector />} />

      {/* ── Combined Discovery & Market Summary ── */}
      {s && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700" style={{ fontFamily: FONT_HEAD }}>Discovery &amp; Market Confidence</h2>
            {summary.data?.hasAnyData && <ToneBadge band={bandFor0to100(s.overall, "positive")} />}
          </div>
          {summary.data?.hasAnyData ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <ScoreCard label="Customer Discovery" score={s.customerDiscoveryScore} band={bandFor0to100(s.customerDiscoveryScore, "positive")} />
                <ScoreCard label="Competitive Risk" score={s.competitiveRiskScore} band={bandFor0to100(s.competitiveRiskScore, "risk")} />
                <ScoreCard label="Demand Signal" score={s.demandSignalScore} band={bandFor0to100(s.demandSignalScore, "positive")} />
                <ScoreCard label="WTP" score={s.wtpScore} band={bandFor0to100(s.wtpScore, "positive")} />
                <ScoreCard label="Open Market Risk" score={s.openMarketRiskScore} band={bandFor0to100(s.openMarketRiskScore, "risk")} />
                <ScoreCard label="Overall Confidence" score={s.overall} band={bandFor0to100(s.overall, "positive")} interpretation={interpretOverallConfidence(s.overall)} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <LeanDecisionPanel title="Recommended Decision" decisions={decisions} />
                <NextExperimentPanel recommendation={summary.data?.nextBestExperiment ?? ""} />
              </div>
            </>
          ) : (
            <EmptyState title="No market evidence yet" description="Add customer interviews, competitors, demand signals and WTP tests to build the confidence score." />
          )}
        </div>
      )}

      {/* ── Customer Segments ── */}
      <Section title="Customer Segments" action={<Button size="sm" onClick={() => openSeg()} style={{ background: "#56A837" }} data-testid="button-add-segment"><Plus size={14} className="mr-1" />Add Segment</Button>}>
        {segments.data && segments.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {segments.data.map((seg) => (
              <Card key={seg.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={14} style={{ color: "#3B85BA" }} />
                      <span className="font-semibold text-sm text-gray-800">{seg.segmentName}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openSeg(seg)} className="text-gray-400 hover:text-gray-700"><Pencil size={13} /></button>
                      <button onClick={() => segDelete.mutate({ id: seg.id })} className="text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    {seg.buyerRole && <div><span className="text-gray-400">Buyer:</span> {seg.buyerRole}</div>}
                    {seg.decisionMakerRole && <div><span className="text-gray-400">Decision-maker:</span> {seg.decisionMakerRole}</div>}
                    {seg.problemArea && <div><span className="text-gray-400">Problem:</span> {seg.problemArea}</div>}
                    {seg.currentAlternative && <div><span className="text-gray-400">Alternative:</span> {seg.currentAlternative}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No customer segments" description="Define who you are building for." action={<Button size="sm" variant="outline" onClick={() => openSeg()}>Add Segment</Button>} />
        )}
      </Section>

      {/* ── Problem Hypotheses ── */}
      <Section title="Problem Hypotheses" action={<Button size="sm" onClick={() => openHyp()} style={{ background: "#56A837" }} data-testid="button-add-hypothesis"><Plus size={14} className="mr-1" />Add Hypothesis</Button>}>
        {hypotheses.data && hypotheses.data.length > 0 ? (
          <div className="space-y-2">
            {hypotheses.data.map((h) => (
              <Card key={h.id} className="border shadow-sm">
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2">
                    <Target size={14} className="mt-0.5 shrink-0" style={{ color: "#56A837" }} />
                    <div>
                      <p className="text-sm text-gray-800">{h.hypothesisStatement}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                        {h.problemType && <span>Type: {h.problemType}</span>}
                        {h.targetCustomer && <span>Target: {h.targetCustomer}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={h.status} />
                    <button onClick={() => openHyp(h)} className="text-gray-400 hover:text-gray-700"><Pencil size={13} /></button>
                    <button onClick={() => hypDelete.mutate({ id: h.id })} className="text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No problem hypotheses" description="Convert assumptions into explicit, testable hypotheses." action={<Button size="sm" variant="outline" onClick={() => openHyp()}>Add Hypothesis</Button>} />
        )}
      </Section>

      {/* ── Customer Interviews ── */}
      <Section title="Customer Interview Log" action={<Button size="sm" onClick={() => openInt()} style={{ background: "#56A837" }} data-testid="button-add-interview"><Plus size={14} className="mr-1" />Log Interview</Button>}>
        {interviewRows.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <ScoreCard label="Customer Discovery" score={cdScore} band={bandFor0to100(cdScore, "positive")} interpretation={interpretDiscoveryScore(cdScore)} />
            <LeanDecisionPanel title="Recommended Decision" decisions={generateLeanDecision("customer_discovery", cdScore)} />
            <NextExperimentPanel recommendation={generateNextExperimentRecommendation("customer_discovery", cdScore)} />
          </div>
        )}
        {interviews.data && interviews.data.length > 0 ? (
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2.5 font-semibold">Contact</th>
                    <th className="px-4 py-2.5 font-semibold">Org / Role</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Pain</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Budget</th>
                    <th className="px-4 py-2.5 font-semibold text-center">DM Access</th>
                    <th className="px-4 py-2.5 font-semibold">Discovery Score</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.data.map((it) => {
                    const band = bandFor0to100(it.discoveryScore ?? 0, "positive");
                    return (
                      <tr key={it.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-gray-800">{it.contactName || "—"}</div>
                          {it.interviewDate && <div className="text-xs text-gray-400">{it.interviewDate}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          <div>{it.organisation || "—"}</div>
                          <div className="text-xs text-gray-400">{it.roleTitle}</div>
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{it.painScore}</td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{it.budgetSignalScore}</td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{it.decisionMakerAccessScore}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold" style={{ color: band.tone === "green" ? "#15803d" : band.tone === "amber" ? "#b45309" : band.tone === "red" ? "#b91c1c" : "#4b5563" }}>{it.discoveryScore}</span>
                            <ToneBadge band={band} />
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <button onClick={() => openInt(it)} className="text-gray-400 hover:text-gray-700 mr-2"><Pencil size={13} /></button>
                          <button onClick={() => intDelete.mutate({ id: it.id })} className="text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <EmptyState title="No interviews logged" description="Capture structured evidence from customer conversations to score discovery." action={<Button size="sm" variant="outline" onClick={() => openInt()}>Log Interview</Button>} />
        )}
      </Section>

      {/* ── Segment Modal ── */}
      <FormModal open={segOpen} onOpenChange={setSegOpen} title={segForm.id ? "Edit Segment" : "Add Customer Segment"} submitting={segUpsert.isPending}
        onSubmit={() => { if (!segForm.segmentName?.trim()) return toast.error("Segment name required"); segUpsert.mutate(segForm); }}>
        <Field label="Segment name"><Input value={segForm.segmentName ?? ""} onChange={(e) => setSegForm({ ...segForm, segmentName: e.target.value })} data-testid="input-segment-name" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Buyer role"><Input value={segForm.buyerRole ?? ""} onChange={(e) => setSegForm({ ...segForm, buyerRole: e.target.value })} /></Field>
          <Field label="User role"><Input value={segForm.userRole ?? ""} onChange={(e) => setSegForm({ ...segForm, userRole: e.target.value })} /></Field>
          <Field label="Influencer role"><Input value={segForm.influencerRole ?? ""} onChange={(e) => setSegForm({ ...segForm, influencerRole: e.target.value })} /></Field>
          <Field label="Decision-maker role"><Input value={segForm.decisionMakerRole ?? ""} onChange={(e) => setSegForm({ ...segForm, decisionMakerRole: e.target.value })} /></Field>
        </div>
        <Field label="Problem area"><Input value={segForm.problemArea ?? ""} onChange={(e) => setSegForm({ ...segForm, problemArea: e.target.value })} /></Field>
        <Field label="Current alternative"><Input value={segForm.currentAlternative ?? ""} onChange={(e) => setSegForm({ ...segForm, currentAlternative: e.target.value })} /></Field>
        <Field label="Notes"><Textarea value={segForm.segmentNotes ?? ""} onChange={(e) => setSegForm({ ...segForm, segmentNotes: e.target.value })} /></Field>
      </FormModal>

      {/* ── Hypothesis Modal ── */}
      <FormModal open={hypOpen} onOpenChange={setHypOpen} title={hypForm.id ? "Edit Hypothesis" : "Add Problem Hypothesis"} submitting={hypUpsert.isPending}
        onSubmit={() => { if (!hypForm.hypothesisStatement?.trim()) return toast.error("Hypothesis statement required"); hypUpsert.mutate({ ...hypForm, customerSegmentId: hypForm.customerSegmentId ?? null }); }}>
        <Field label="Hypothesis statement"><Textarea value={hypForm.hypothesisStatement ?? ""} onChange={(e) => setHypForm({ ...hypForm, hypothesisStatement: e.target.value })} placeholder="We believe [customer] experiences [problem] because…" data-testid="input-hypothesis-statement" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Problem type"><Input value={hypForm.problemType ?? ""} onChange={(e) => setHypForm({ ...hypForm, problemType: e.target.value })} /></Field>
          <Field label="Target customer"><Input value={hypForm.targetCustomer ?? ""} onChange={(e) => setHypForm({ ...hypForm, targetCustomer: e.target.value })} /></Field>
        </div>
        <Field label="Linked segment">
          <Select value={hypForm.customerSegmentId ? String(hypForm.customerSegmentId) : "__none__"} onValueChange={(val) => setHypForm({ ...hypForm, customerSegmentId: val === "__none__" ? null : Number(val) })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {(segments.data ?? []).map((seg) => <SelectItem key={seg.id} value={String(seg.id)}>{seg.segmentName}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Assumed pain"><Input value={hypForm.assumedPain ?? ""} onChange={(e) => setHypForm({ ...hypForm, assumedPain: e.target.value })} /></Field>
          <Field label="Assumed frequency"><Input value={hypForm.assumedFrequency ?? ""} onChange={(e) => setHypForm({ ...hypForm, assumedFrequency: e.target.value })} /></Field>
          <Field label="Assumed urgency"><Input value={hypForm.assumedUrgency ?? ""} onChange={(e) => setHypForm({ ...hypForm, assumedUrgency: e.target.value })} /></Field>
          <Field label="Assumed budget owner"><Input value={hypForm.assumedBudgetOwner ?? ""} onChange={(e) => setHypForm({ ...hypForm, assumedBudgetOwner: e.target.value })} /></Field>
        </div>
        <Field label="Status">
          <Select value={hypForm.status ?? "untested"} onValueChange={(val) => setHypForm({ ...hypForm, status: val })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{PROBLEM_HYPOTHESIS_STATUSES.map((st) => <SelectItem key={st} value={st}>{st.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </FormModal>

      {/* ── Interview Modal ── */}
      <FormModal wide open={intOpen} onOpenChange={setIntOpen} title={intForm.id ? "Edit Interview" : "Log Customer Interview"} submitting={intUpsert.isPending}
        onSubmit={() => intUpsert.mutate({ ...intForm, problemHypothesisId: intForm.problemHypothesisId ?? null, customerSegmentId: intForm.customerSegmentId ?? null })}>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Contact name"><Input value={intForm.contactName ?? ""} onChange={(e) => setIntForm({ ...intForm, contactName: e.target.value })} data-testid="input-contact-name" /></Field>
          <Field label="Organisation"><Input value={intForm.organisation ?? ""} onChange={(e) => setIntForm({ ...intForm, organisation: e.target.value })} /></Field>
          <Field label="Role title"><Input value={intForm.roleTitle ?? ""} onChange={(e) => setIntForm({ ...intForm, roleTitle: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Interview date"><Input type="date" value={intForm.interviewDate ?? ""} onChange={(e) => setIntForm({ ...intForm, interviewDate: e.target.value })} /></Field>
          <Field label="Interview type">
            <Select value={intForm.interviewType ?? "discovery"} onValueChange={(val) => setIntForm({ ...intForm, interviewType: val })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{INTERVIEW_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Linked hypothesis">
            <Select value={intForm.problemHypothesisId ? String(intForm.problemHypothesisId) : "__none__"} onValueChange={(val) => setIntForm({ ...intForm, problemHypothesisId: val === "__none__" ? null : Number(val) })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {(hypotheses.data ?? []).map((h) => <SelectItem key={h.id} value={String(h.id)}>{h.hypothesisStatement.slice(0, 40)}…</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <ScoreSelect label="Pain (1-5)" value={intForm.painScore ?? 0} onChange={(n) => setIntForm({ ...intForm, painScore: n })} />
          <ScoreSelect label="Urgency (1-5)" value={intForm.urgencyScore ?? 0} onChange={(n) => setIntForm({ ...intForm, urgencyScore: n })} />
          <ScoreSelect label="Frequency (1-5)" value={intForm.frequencyScore ?? 0} onChange={(n) => setIntForm({ ...intForm, frequencyScore: n })} />
          <ScoreSelect label="Budget (1-5)" value={intForm.budgetSignalScore ?? 0} onChange={(n) => setIntForm({ ...intForm, budgetSignalScore: n })} />
          <ScoreSelect label="DM Access (1-5)" value={intForm.decisionMakerAccessScore ?? 0} onChange={(n) => setIntForm({ ...intForm, decisionMakerAccessScore: n })} />
        </div>
        <div className="flex items-center gap-6 p-3 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2"><Switch checked={!!intForm.problemMentionedUnprompted} onCheckedChange={(c) => setIntForm({ ...intForm, problemMentionedUnprompted: c })} /><span className="text-xs text-gray-600">Problem mentioned unprompted</span></div>
          <div className="flex items-center gap-2"><Switch checked={!!intForm.willingnessToTrial} onCheckedChange={(c) => setIntForm({ ...intForm, willingnessToTrial: c })} /><span className="text-xs text-gray-600">Willing to trial</span></div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-500">Live Discovery Score:</span>
            <span className="font-bold" style={{ color: "#56A837" }}>{liveDiscovery}</span>
            <ToneBadge band={bandFor0to100(liveDiscovery, "positive")} />
          </div>
        </div>
        <Field label="WTP signal">
          <Select value={intForm.willingnessToPaySignal ?? "none"} onValueChange={(val) => setIntForm({ ...intForm, willingnessToPaySignal: val })}>
            <SelectTrigger className="h-9 text-sm w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{WTP_SIGNAL_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Current workaround"><Input value={intForm.currentWorkaround ?? ""} onChange={(e) => setIntForm({ ...intForm, currentWorkaround: e.target.value })} /></Field>
        <Field label="Key quote"><Textarea value={intForm.keyQuote ?? ""} onChange={(e) => setIntForm({ ...intForm, keyQuote: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Evidence notes"><Textarea value={intForm.evidenceNotes ?? ""} onChange={(e) => setIntForm({ ...intForm, evidenceNotes: e.target.value })} /></Field>
          <Field label="Contradiction notes"><Textarea value={intForm.contradictionNotes ?? ""} onChange={(e) => setIntForm({ ...intForm, contradictionNotes: e.target.value })} /></Field>
        </div>
        <Field label="Next action"><Input value={intForm.nextAction ?? ""} onChange={(e) => setIntForm({ ...intForm, nextAction: e.target.value })} /></Field>
      </FormModal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
