import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Clock, Shield, XCircle, ChevronDown, ChevronRight,
  AlertTriangle, FileText, Users, Lock,
} from "lucide-react";

const STEP_ICONS: Record<string, React.ElementType> = {
  F: Users, E: FileText, D: Shield, S: Lock, I: Lock, L: FileText, K: CheckCircle2,
};

const STATUS_OPTIONS = [
  { value: "not_started",  label: "Not Started",  color: "#6b7280", bg: "#f3f4f6" },
  { value: "in_progress",  label: "In Progress",  color: "#d97706", bg: "#fef3c7" },
  { value: "under_review", label: "Under Review", color: "#3b82f6", bg: "#dbeafe" },
  { value: "approved",     label: "Approved",     color: "#16a34a", bg: "#dcfce7" },
  { value: "blocked",      label: "Blocked",      color: "#dc2626", bg: "#fee2e2" },
] as const;

function statusCfg(s: string) {
  return STATUS_OPTIONS.find(o => o.value === s) ?? STATUS_OPTIONS[0];
}

export default function FedsilkStepWorkflow() {
  const stepsQ = trpc.fedsilkGovernance.getSteps.useQuery({});
  const upsert = trpc.fedsilkGovernance.upsertStep.useMutation({
    onSuccess: () => { stepsQ.refetch(); toast.success("Step updated"); },
    onError: () => toast.error("Update failed — please sign in"),
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<number, { status: string; owner: string; notes: string }>>({});

  const steps = stepsQ.data ?? [];

  function startEdit(step: typeof steps[0]) {
    setEditing(e => ({
      ...e,
      [step.id]: { status: step.status ?? "not_started", owner: step.owner ?? "", notes: step.notes ?? "" },
    }));
  }

  function saveEdit(step: typeof steps[0]) {
    const e = editing[step.id];
    if (!e) return;
    upsert.mutate({ id: step.id, stepKey: step.stepKey ?? "", ...e });
    setEditing(prev => { const n = { ...prev }; delete n[step.id]; return n; });
  }

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-2">
        {STATUS_OPTIONS.map(s => (
          <span key={s.value} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
            style={{ background: s.bg, color: s.color }}>
            {s.label}
          </span>
        ))}
      </div>

      {steps.map((step, idx) => {
        const StepIcon = STEP_ICONS[step.stepKey ?? "F"];
        const cfg = statusCfg(step.status ?? "not_started");
        const isOpen = expanded === step.stepKey;
        const ed = editing[step.id];

        return (
          <div key={step.stepKey} className="bg-white rounded-xl border overflow-hidden"
            style={{ borderColor: "#e5e7eb", borderLeft: "4px solid #0B2545" }}>
            {/* Header row */}
            <button
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(isOpen ? null : (step.stepKey ?? null))}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "#0B2545", color: "#B8862F" }}>
                {step.stepKey}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900">{step.stepName}</div>
                <div className="text-xs text-gray-400 truncate mt-0.5">{step.purpose}</div>
              </div>
              <Badge className="text-[10px] flex-shrink-0 flex items-center gap-1"
                style={{ background: cfg.bg, color: cfg.color, border: "none" }}>
                {cfg.label}
              </Badge>
              {step.owner && (
                <span className="text-[11px] text-gray-400 flex-shrink-0 hidden md:block">{step.owner}</span>
              )}
              {isOpen
                ? <ChevronDown size={14} className="flex-shrink-0 text-gray-400" />
                : <ChevronRight size={14} className="flex-shrink-0 text-gray-400" />
              }
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="border-t px-5 py-5 space-y-4" style={{ borderColor: "#f3f4f6", background: "#fafbfc" }}>
                {/* Detail grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Governance Question</div>
                      <div className="text-xs text-gray-700 leading-relaxed">{step.governanceQuestion}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Required Approval</div>
                      <div className="text-xs text-gray-700">{step.requiredApproval ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Linked Contract / Document</div>
                      <div className="text-xs text-gray-700">{step.linkedContract ?? "—"}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Risk If Incomplete</div>
                      <div className="rounded-lg p-2.5 text-xs text-red-700 leading-relaxed"
                        style={{ background: "#fff1f2", border: "1px solid #fecdd3" }}>
                        <AlertTriangle size={11} className="inline mr-1.5 text-red-500" />
                        {step.riskIfIncomplete ?? "—"}
                      </div>
                    </div>
                    {step.notes && (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Notes</div>
                        <div className="text-xs text-gray-600 italic">{step.notes}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline edit */}
                {ed ? (
                  <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "#dde3ec", background: "white" }}>
                    <div className="text-xs font-semibold text-gray-700">Update Step</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Status</label>
                        <select className="w-full text-xs border rounded px-2 py-1.5 bg-white" style={{ borderColor: "#dde3ec" }}
                          value={ed.status} onChange={e => setEditing(prev => ({ ...prev, [step.id]: { ...ed, status: e.target.value } }))}>
                          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Owner</label>
                        <input className="w-full text-xs border rounded px-2 py-1.5" style={{ borderColor: "#dde3ec" }}
                          value={ed.owner} onChange={e => setEditing(prev => ({ ...prev, [step.id]: { ...ed, owner: e.target.value } }))} />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Notes</label>
                        <input className="w-full text-xs border rounded px-2 py-1.5" style={{ borderColor: "#dde3ec" }}
                          value={ed.notes} onChange={e => setEditing(prev => ({ ...prev, [step.id]: { ...ed, notes: e.target.value } }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs h-7" style={{ background: "#0B2545" }} onClick={() => saveEdit(step)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7"
                        onClick={() => setEditing(prev => { const n = { ...prev }; delete n[step.id]; return n; })}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="text-xs h-7"
                    style={{ borderColor: "#dde3ec" }} onClick={() => startEdit(step)}>
                    Update Status
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
