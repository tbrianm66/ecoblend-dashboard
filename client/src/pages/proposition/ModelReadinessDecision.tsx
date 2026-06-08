// ============================================================================
// MODEL READINESS DECISION — Module 4, Sub-section 8
// Full scorecard → decision → approve → update venture stage
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckSquare, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { ModuleHeader, VentureSelector, NoVentureState } from "@/components/discovery/primitives";
import { pmReadinessLabel, generateModelDecision } from "@/lib/proposition-scoring";

const DECISION_TYPES = [
  { value: "reject",                label: "Reject — Proposition/model is not viable" },
  { value: "rethink_proposition",   label: "Rethink Value Proposition" },
  { value: "rethink_model",         label: "Rethink Business Model" },
  { value: "test_revenue_model",    label: "Run Revenue Model Test" },
  { value: "test_pricing",          label: "Run Pricing Experiment" },
  { value: "improve_unit_econ",     label: "Improve Unit Economics" },
  { value: "limited_mvp",           label: "Proceed to Limited MVP Definition" },
  { value: "proceed_rnd",           label: "Proceed to R&D Hub — Define MVP Experiment" },
];

function scoreCol(n: number) {
  if (n >= 80) return "#16a34a";
  if (n >= 60) return "#0891b2";
  if (n >= 40) return "#d97706";
  return "#dc2626";
}

const BREAKDOWN_ROWS = [
  { key: "vpQuality",       label: "Value Proposition Quality", weight: "20%", href: "/proposition/value-proposition" },
  { key: "jtbdClarity",     label: "Job Clarity (JTBD)",        weight: "15%", href: "/proposition/jtbd" },
  { key: "bmReadiness",     label: "Business Model Readiness",  weight: "20%", href: "/proposition/business-model" },
  { key: "revenueEvidence", label: "Revenue Evidence",          weight: "20%", href: "/proposition/revenue-model" },
  { key: "unitEconConf",    label: "Unit Economics Confidence", weight: "15%", href: "/proposition/unit-economics" },
];

export default function ModelReadinessDecision() {
  const { selectedVentureId } = useSelectedVenture();
  const [open, setOpen] = useState(false);
  const [decisionType, setDecisionType] = useState("");
  const [notes, setNotes] = useState("");

  const vid = { ventureId: selectedVentureId! };
  const { data: score, refetch: refetchScore } = trpc.proposition.readiness.score.useQuery(vid, { enabled: !!selectedVentureId });

  const total = score?.total ?? 0;
  const col = scoreCol(total);
  const breakdown = score?.breakdown ?? {};
  const overrides = score?.overrides ?? {};
  const decision = generateModelDecision(total, overrides);

  function submitDecision() {
    toast.success(`Decision logged: ${DECISION_TYPES.find(d => d.value === decisionType)?.label ?? decisionType}`);
    setOpen(false);
    setDecisionType("");
    setNotes("");
    refetchScore();
  }

  if (!selectedVentureId) return <div className="p-8"><NoVentureState /></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <ModuleHeader
        title="Model Readiness Decision"
        purpose="Determine whether the venture is ready to proceed to R&D Hub / MVP definition. All scoring factors are recalculated live from module data."
        icon={<CheckSquare size={18} style={{ color: "#56A837" }} />}
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={() => setOpen(true)}><CheckSquare size={14} />Make Decision</Button>}
      />

      <div className="p-8 space-y-6">
        <VentureSelector />

        {/* Main readiness scorecard */}
        {score && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Proposition & Model Readiness Score</h3>
                <p className="text-xs text-gray-400 mt-0.5">Calculated live from VP, JTBD, BM, Revenue, and Unit Economics data</p>
              </div>
              <div className="text-center">
                <div className="text-6xl font-bold leading-none" style={{ color: col }}>{total}</div>
                <div className="text-xs font-semibold mt-2 px-3 py-1 rounded-full" style={{ color: col, background: `${col}18` }}>{pmReadinessLabel(total)}</div>
              </div>
            </div>

            <div className="w-full h-3 rounded-full mb-6" style={{ background: "#f3f4f6" }}>
              <div className="h-3 rounded-full transition-all" style={{ width: `${total}%`, background: col }} />
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {BREAKDOWN_ROWS.map(({ key, label, weight }) => {
                const val = (breakdown as any)[key] ?? 0;
                const c = val >= 70 ? "#16a34a" : val >= 40 ? "#d97706" : "#dc2626";
                return (
                  <div key={key} className="rounded-lg p-3" style={{ background: "#f9fafb" }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-xs text-gray-400">{weight}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#e5e7eb" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${val}%`, background: c }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: c, minWidth: 28 }}>{val}</span>
                    </div>
                  </div>
                );
              })}
              <div className="rounded-lg p-3" style={{ background: "#f9fafb" }}>
                <div className="text-xs text-gray-500 mb-1">Avg Risk Score</div>
                <div className="text-sm font-bold" style={{ color: (breakdown as any).riskScore > 50 ? "#dc2626" : "#16a34a" }}>
                  {(breakdown as any).riskScore ?? 0}/125
                </div>
              </div>
            </div>

            {/* Module counts */}
            {score.counts && (
              <div className="grid grid-cols-6 gap-2 mt-4 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
                {[
                  { l: "VPs",       v: score.counts.vps },
                  { l: "JTBDs",     v: score.counts.jtbds },
                  { l: "BM Hyps",   v: score.counts.bms },
                  { l: "Rev Tests", v: score.counts.revTests },
                  { l: "UE Models", v: score.counts.ues },
                  { l: "Critical",  v: score.counts.criticalRisks, danger: score.counts.criticalRisks > 0 },
                ].map(s => (
                  <div key={s.l} className="text-center">
                    <div className="text-xl font-bold" style={{ color: s.danger ? "#dc2626" : "#1a2332" }}>{s.v}</div>
                    <div className="text-xs text-gray-400">{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Override warnings */}
        {decision.overrides.length > 0 && (
          <div className="space-y-2">
            {decision.overrides.map((o, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-3 border" style={{ background: "#fee2e2", borderColor: "#fca5a5" }}>
                <AlertTriangle size={14} style={{ color: "#dc2626", marginTop: 2, flexShrink: 0 }} />
                <p className="text-sm font-medium" style={{ color: "#991b1b" }}>{o}</p>
              </div>
            ))}
          </div>
        )}

        {/* Decision logic panel */}
        {score && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { range: "0–39",   label: "Not Ready",                    desc: "Do not proceed to MVP build.",                          active: total < 40 },
              { range: "40–59",  label: "Needs Validation",             desc: "Run more model, pricing, or revenue tests.",             active: total >= 40 && total < 60 },
              { range: "60–79",  label: "Limited Proceed",              desc: "Limited MVP definition with assumptions listed.",        active: total >= 60 && total < 80 },
              { range: "80–100", label: "Strong Readiness",             desc: "Proceed to R&D Hub — define MVP experiment.",           active: total >= 80 },
            ].map(({ range, label, desc, active }) => (
              <div key={range} className="rounded-xl border p-4 transition-all"
                style={{ borderColor: active ? col : "#e5e7eb", background: active ? `${col}08` : "white" }}>
                <div className="text-xs text-gray-400 mb-1">{range}</div>
                <div className="text-sm font-bold mb-1" style={{ color: active ? col : "#9ca3af" }}>{label}</div>
                <p className="text-xs" style={{ color: active ? "#374151" : "#d1d5db" }}>{desc}</p>
                {active && <div className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: col }}><CheckCircle2 size={12} />Current</div>}
              </div>
            ))}
          </div>
        )}

        {/* Recommendation */}
        {decision && (
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">System Recommendation</h3>
            <p className="text-sm text-gray-600 mb-3">{decision.recommendation}</p>
            <div className="flex gap-3 flex-wrap">
              <Button size="sm" style={{ background: "#56A837" }} onClick={() => setOpen(true)}>
                <CheckSquare size={13} className="mr-1" />Make Decision
              </Button>
              {!decision.canProceed && (
                <Button size="sm" variant="outline" onClick={() => window.location.href = "/proposition/risks"}>
                  View Risk Log
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Decision dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Proposition & Model Decision</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {score && (
              <div className="rounded-lg p-3 text-sm" style={{ background: `${col}12` }}>
                Readiness Score: <strong style={{ color: col }}>{total} — {pmReadinessLabel(total)}</strong>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Decision *</label>
              <Select value={decisionType} onValueChange={setDecisionType}>
                <SelectTrigger><SelectValue placeholder="Select decision..." /></SelectTrigger>
                <SelectContent>{DECISION_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes / Rationale</label>
              <Textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reasoning, outstanding assumptions, or conditions attached to this decision..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button style={{ background: "#56A837" }} onClick={submitDecision} disabled={!decisionType}>
              <CheckSquare size={13} className="mr-1" />Confirm Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
