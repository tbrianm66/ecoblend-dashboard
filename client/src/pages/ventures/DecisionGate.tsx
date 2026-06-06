// ============================================================
// DECISION GATE
// Route: /ventures/:id/decision  OR  /decision-gate
// Records advance / hold / kill decisions for a venture.
// A decision record is required before WorkflowStateService.advance() succeeds.
// ============================================================
import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { LEAN_STAGES, STAGE_LABELS, type LeanStage } from "@shared/workflowStages";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, XCircle, PauseCircle, AlertTriangle, ChevronRight,
  Shield, Clock, Skull, TrendingUp, ListChecks, Loader2,
} from "lucide-react";
import { ModuleHeader, VentureSelector, NoVentureState } from "@/components/discovery/primitives";

// ── helpers ──────────────────────────────────────────────────────────────────
const DECISION_OPTS = [
  {
    key: "advance" as const,
    label: "Advance",
    sublabel: "Evidence sufficient — move to next stage",
    icon: TrendingUp,
    color: "bg-emerald-50 border-emerald-400 text-emerald-700",
    activeBg: "bg-emerald-600",
    dot: "bg-emerald-500",
  },
  {
    key: "hold_pending_evidence" as const,
    label: "Hold",
    sublabel: "Pause and gather additional evidence",
    icon: PauseCircle,
    color: "bg-amber-50 border-amber-400 text-amber-700",
    activeBg: "bg-amber-500",
    dot: "bg-amber-500",
  },
  {
    key: "kill" as const,
    label: "Kill",
    sublabel: "Evidence does not support continuation",
    icon: Skull,
    color: "bg-rose-50 border-rose-400 text-rose-700",
    activeBg: "bg-rose-600",
    dot: "bg-rose-500",
  },
] as const;

type DecisionKey = (typeof DECISION_OPTS)[number]["key"];

function decisionBadge(action: string | null | undefined) {
  if (!action) return null;
  if (action === "advance") return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">Advance</Badge>;
  if (action === "hold_pending_evidence") return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Hold</Badge>;
  if (action === "kill") return <Badge className="bg-rose-100 text-rose-700 border-rose-300">Kill</Badge>;
  return <Badge variant="outline">{action}</Badge>;
}

function stageBadge(stage: string | null | undefined) {
  if (!stage) return "—";
  return STAGE_LABELS[stage as LeanStage] ?? stage;
}

// ── component ─────────────────────────────────────────────────────────────────
export default function DecisionGate() {
  const { id: paramId } = useParams<{ id?: string }>();
  const { selectedVentureId } = useSelectedVenture();
  const ventureId = paramId ?? selectedVentureId ?? "";

  const enabled = !!ventureId;

  // tRPC queries
  const gateQ   = trpc.decisionGate.checkGate.useQuery({ ventureId }, { enabled });
  const histQ   = trpc.decisionGate.listDecisions.useQuery({ ventureId }, { enabled });
  const utils   = trpc.useUtils();

  // Stage navigation
  const currentStage  = (gateQ.data?.currentStage ?? "venture_intake") as LeanStage;
  const currentIdx    = LEAN_STAGES.indexOf(currentStage);
  const nextStage     = currentIdx >= 0 && currentIdx < LEAN_STAGES.length - 1
    ? LEAN_STAGES[currentIdx + 1]
    : null;

  // canAdvance query (for blockers)
  const canAdvQ = trpc.workflowState.canAdvance.useQuery(
    { ventureId, targetStage: nextStage ?? currentStage },
    { enabled: enabled && !!nextStage },
  );

  // Decision form state
  const [selected, setSelected] = useState<DecisionKey | null>(null);
  const [rationale, setRationale] = useState("");
  const [decidedBy, setDecidedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const record = trpc.workflowState.recordDecision.useMutation({
    onSuccess: () => {
      toast.success("Decision recorded successfully");
      setSelected(null);
      setRationale("");
      setDecidedBy("");
      utils.decisionGate.checkGate.invalidate({ ventureId });
      utils.decisionGate.listDecisions.invalidate({ ventureId });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = async () => {
    if (!selected || !rationale.trim() || !decidedBy.trim()) return;
    setSubmitting(true);
    try {
      await record.mutateAsync({
        ventureId,
        decision: selected,
        rationale: rationale.trim(),
        decidedBy: decidedBy.trim(),
        nextStage: selected === "advance" ? (nextStage ?? undefined) : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isKilled = gateQ.data?.validationStatus === "killed";
  const blockers = canAdvQ.data?.blockers ?? [];
  const stageLabel = stageBadge(currentStage);

  if (!ventureId) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ModuleHeader
          title="Decision Gate"
          purpose="Record advance, hold, or kill decisions before any stage transition is permitted."
          icon={<Shield size={22} />}
          action={<VentureSelector />}
        />
        <NoVentureState />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      {/* ── Header ── */}
      <ModuleHeader
        title="Decision Gate"
        purpose="Record advance, hold, or kill decisions before any stage transition is permitted."
        icon={<Shield size={22} />}
        action={<VentureSelector />}
      />

      {/* ── Venture context pill ── */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold text-gray-800">
          {gateQ.data?.ventureName ?? ventureId}
        </span>
        <Badge variant="outline" className="text-xs">
          {stageLabel}
        </Badge>
        {isKilled && (
          <Badge className="bg-rose-100 text-rose-700 border-rose-300 text-xs">Killed</Badge>
        )}
        {gateQ.data?.validationStatus === "paused" && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">Held — awaiting evidence</Badge>
        )}
        {gateQ.data?.hasAdvanceDecision && (
          <span className="flex items-center gap-1 text-emerald-600 text-xs">
            <CheckCircle2 size={13} /> Advance decision on record
          </span>
        )}
      </div>

      {/* ── Stage readiness panel ── */}
      {!isKilled && !!nextStage && (
        <div className="rounded-lg border bg-white p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <ListChecks size={16} />
            Stage Readiness — exit criteria for &ldquo;{stageLabel}&rdquo;
          </div>
          {canAdvQ.isLoading ? (
            <p className="text-xs text-gray-400">Checking criteria…</p>
          ) : blockers.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle2 size={15} />
              All criteria satisfied — stage is ready to advance to&nbsp;
              <span className="font-medium">{stageBadge(nextStage)}</span>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {blockers.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-rose-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Decision form ── */}
      {!isKilled ? (
        <div className="rounded-lg border bg-white p-6 space-y-5">
          <p className="text-sm font-semibold text-gray-700">Record a Decision</p>

          {/* Option cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DECISION_OPTS.map((opt) => {
              const Icon = opt.icon;
              const active = selected === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSelected(active ? null : opt.key)}
                  className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all
                    ${active ? `border-current ${opt.color} shadow-sm` : "border-gray-200 hover:border-gray-300 bg-gray-50"}`}
                >
                  <span className={`rounded-full p-1.5 ${active ? opt.activeBg + " text-white" : "bg-gray-200 text-gray-600"}`}>
                    <Icon size={14} />
                  </span>
                  <span className={`text-sm font-semibold ${active ? "" : "text-gray-700"}`}>{opt.label}</span>
                  <span className={`text-xs leading-snug ${active ? "opacity-80" : "text-gray-400"}`}>{opt.sublabel}</span>
                </button>
              );
            })}
          </div>

          {/* Form fields — shown when an option is selected */}
          {selected && (
            <div className="space-y-3 pt-2 border-t">
              {selected === "advance" && nextStage && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                  <ChevronRight size={15} />
                  Will advance to: <span className="font-semibold">{stageBadge(nextStage)}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Rationale <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  rows={3}
                  placeholder="Summarise the evidence and reasoning behind this decision…"
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Decided by <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Name or email of decision maker"
                  value={decidedBy}
                  onChange={(e) => setDecidedBy(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!rationale.trim() || !decidedBy.trim() || submitting}
                className="w-full sm:w-auto"
                variant={selected === "kill" ? "destructive" : "default"}
              >
                {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Confirm {selected === "advance" ? "Advance" : selected === "kill" ? "Kill" : "Hold"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 flex items-center gap-3 text-rose-700 text-sm">
          <XCircle size={18} />
          This venture has been killed. Use the Venture Archive to review or restore it.
        </div>
      )}

      {/* ── Decision history ── */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Clock size={15} />
          Decision History
        </div>
        {histQ.isLoading ? (
          <div className="p-6 text-sm text-gray-400">Loading…</div>
        ) : (histQ.data?.length ?? 0) === 0 ? (
          <div className="p-6 text-sm text-gray-400">No decisions recorded yet for this venture.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left">Date</th>
                <th className="px-5 py-2.5 text-left">Decision</th>
                <th className="px-5 py-2.5 text-left">Summary</th>
                <th className="px-5 py-2.5 text-left">Decided By</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {histQ.data!.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {row.decisionDate ?? new Date(row.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">{decisionBadge(row.recommendedAction)}</td>
                  <td className="px-5 py-3 text-gray-600 max-w-xs">
                    <span className="font-medium text-gray-800">{row.decisionTitle}</span>
                    {row.decisionSummary && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{row.decisionSummary}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.approvedBy ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
