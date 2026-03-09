// ============================================================
// EXPERIMENT LOG — TRL Evidence Tracking & Stage Gate Enforcement
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FlaskConical, CheckCircle2, XCircle, HelpCircle, Clock, ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";

const VENTURES = [
  { id: "ecoblend-rd", name: "EcoBlend R&D", color: "#51AF37" },
  { id: "ecoblend",    name: "EcoBlend",     color: "#51AF37" },
  { id: "bebus",       name: "BEBUS",        color: "#3A97D3" },
  { id: "tone",        name: "TONE",         color: "#F49C13" },
  { id: "real",        name: "REAL",         color: "#ef4444" },
  { id: "pipe",        name: "PIPE",         color: "#0ea5e9" },
];

const OUTCOME_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  Pass:         { label: "Pass",         color: "#10b981", icon: CheckCircle2 },
  Fail:         { label: "Fail",         color: "#ef4444", icon: XCircle },
  Inconclusive: { label: "Inconclusive", color: "#f59e0b", icon: HelpCircle },
  Pending:      { label: "Pending",      color: "#6b7280", icon: Clock },
};

const TRL_LABELS: Record<number, string> = {
  1: "Basic Principles", 2: "Technology Concept", 3: "Proof of Concept",
  4: "Lab Validation", 5: "Relevant Environment", 6: "Prototype Demo",
  7: "System Prototype", 8: "System Complete", 9: "Proven System",
};

// Stage gate rules: to advance to TRL N, you need at least 1 passing experiment at TRL N-1
function getStageGateStatus(experiments: any[], currentTrl: number) {
  const gates: { trl: number; label: string; met: boolean; experiments: any[] }[] = [];
  for (let trl = 1; trl <= Math.min(currentTrl + 1, 9); trl++) {
    const relevant = experiments.filter(e => e.trlLevelJustified === trl);
    const passing = relevant.filter(e => e.outcome === "Pass");
    gates.push({
      trl,
      label: TRL_LABELS[trl] ?? `TRL ${trl}`,
      met: passing.length > 0,
      experiments: relevant,
    });
  }
  return gates;
}

function ExperimentCard({ exp, onDelete }: { exp: any; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = OUTCOME_CONFIG[exp.outcome] ?? OUTCOME_CONFIG.Pending;
  const Icon = cfg.icon;

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cfg.color}15` }}>
          <Icon size={16} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-900 truncate">{exp.title}</span>
            {exp.trlLevelJustified && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                TRL {exp.trlLevelJustified}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
          {exp.conductedAt && (
            <span className="text-xs text-gray-400 ml-2">
              · {new Date(exp.conductedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="text-gray-300">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "#f3f4f6" }}>
          {exp.hypothesis && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Hypothesis</div>
              <p className="text-xs text-gray-700">{exp.hypothesis}</p>
            </div>
          )}
          {exp.method && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Method</div>
              <p className="text-xs text-gray-700">{exp.method}</p>
            </div>
          )}
          {exp.result && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Result</div>
              <p className="text-xs text-gray-700">{exp.result}</p>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6 text-red-400 border-red-200 hover:bg-red-50"
              onClick={onDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExperimentLog() {
  const utils = trpc.useUtils();
  const [selectedVenture, setSelectedVenture] = useState("ecoblend-rd");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "", hypothesis: "", method: "", result: "",
    outcome: "Pending" as "Pass" | "Fail" | "Inconclusive" | "Pending",
    trlLevelJustified: 1,
  });

  const venture = VENTURES.find(v => v.id === selectedVenture);
  const { data: experiments = [], isLoading } = trpc.experiments.list.useQuery({ ventureId: selectedVenture });
  const { data: ventureData } = trpc.ventures.get.useQuery({ id: selectedVenture });

  const addMutation = trpc.experiments.add.useMutation({
    onSuccess: () => {
      utils.experiments.list.invalidate({ ventureId: selectedVenture });
      setShowAdd(false);
      setForm({ title: "", hypothesis: "", method: "", result: "", outcome: "Pending", trlLevelJustified: 1 });
      toast.success("Experiment logged");
    },
    onError: () => toast.error("Failed to log experiment"),
  });

  const deleteMutation = trpc.experiments.delete.useMutation({
    onSuccess: () => { utils.experiments.list.invalidate({ ventureId: selectedVenture }); toast.success("Experiment deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const currentTrl = ventureData?.trl ?? 1;
  const stageGates = getStageGateStatus(experiments, currentTrl);
  const passCount = experiments.filter(e => e.outcome === "Pass").length;
  const pendingCount = experiments.filter(e => e.outcome === "Pending").length;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical size={16} style={{ color: "#1d4ed8" }} />
              <span className="vos-badge" style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: "0.65rem" }}>TRL Evidence Log</span>
            </div>
            <h1 className="vos-page-title mb-1">Experiment Log</h1>
            <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              Log experiments and tests that justify TRL advancement. Stage gates require at least one passing experiment per level.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            style={{ background: "#1d4ed8", color: "white" }}
            onClick={() => setShowAdd(true)}
          >
            <Plus size={13} /> Log Experiment
          </Button>
        </div>
      </div>

      <div className="p-8">
        {/* Venture selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {VENTURES.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVenture(v.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={selectedVenture === v.id
                ? { background: v.color, color: "white", borderColor: v.color }
                : { background: "white", color: "#6b7280", borderColor: "#e5e7eb" }
              }
            >
              {v.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Stage Gate Panel */}
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Stage Gate Status
            </h2>
            <div className="bg-white rounded-xl border p-4 shadow-sm space-y-2" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: "#f0f9ff" }}>
                <span className="text-xs text-blue-600 font-semibold">Current TRL: {currentTrl} — {TRL_LABELS[currentTrl]}</span>
              </div>
              {stageGates.map(gate => (
                <div key={gate.trl} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: gate.met ? "#f0fdf4" : "#fafafa" }}>
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    {gate.met
                      ? <Unlock size={14} style={{ color: "#10b981" }} />
                      : <Lock size={14} style={{ color: "#d1d5db" }} />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold" style={{ color: gate.met ? "#10b981" : "#6b7280" }}>
                      TRL {gate.trl} — {gate.label}
                    </div>
                    <div className="text-xs text-gray-400">
                      {gate.experiments.length} experiment{gate.experiments.length !== 1 ? "s" : ""}
                      {gate.met ? " · Gate met" : " · Gate not met"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "Total", value: experiments.length, color: "#1d4ed8" },
                { label: "Passing", value: passCount, color: "#10b981" },
                { label: "Pending", value: pendingCount, color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-lg border p-3 text-center shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Experiment list */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Experiments — {venture?.name}
              </h2>
              <span className="text-xs text-gray-400 font-mono">{experiments.length} logged</span>
            </div>
            {isLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
            ) : experiments.length === 0 ? (
              <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
                <FlaskConical size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">No experiments logged yet.</p>
                <p className="text-xs text-gray-300 mt-1">Log your first experiment to start building TRL evidence.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {experiments.map(exp => (
                  <ExperimentCard
                    key={exp.id}
                    exp={exp}
                    onDelete={() => deleteMutation.mutate({ id: exp.id })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Experiment Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical size={16} style={{ color: "#1d4ed8" }} />
              Log Experiment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Experiment Title *</label>
              <Input
                placeholder="e.g. Bio-Composite Tensile Strength Test"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">TRL Level Justified</label>
                <Select value={String(form.trlLevelJustified)} onValueChange={v => setForm(f => ({ ...f, trlLevelJustified: parseInt(v) }))}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
                      <SelectItem key={n} value={String(n)} className="text-xs">
                        TRL {n} — {TRL_LABELS[n]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Outcome</label>
                <Select value={form.outcome} onValueChange={v => setForm(f => ({ ...f, outcome: v as any }))}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OUTCOME_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Hypothesis</label>
              <Textarea
                placeholder="What were you testing and what did you expect?"
                value={form.hypothesis}
                onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Method</label>
              <Textarea
                placeholder="How was the experiment conducted?"
                value={form.method}
                onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Result</label>
              <Textarea
                placeholder="What were the findings?"
                value={form.result}
                onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button
                size="sm"
                style={{ background: "#1d4ed8", color: "white" }}
                disabled={!form.title || addMutation.isPending}
                onClick={() => addMutation.mutate({ ventureId: selectedVenture, ...form })}
              >
                {addMutation.isPending ? "Logging..." : "Log Experiment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
