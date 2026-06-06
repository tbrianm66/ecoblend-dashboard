// ============================================================
// EXPERIMENT LOG — TRL Evidence Tracking & Stage Gate Enforcement
// With Scientific Validation via Semantic Scholar
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus, FlaskConical, CheckCircle2, XCircle, HelpCircle, Clock,
  ChevronDown, ChevronUp, Lock, Unlock, BookOpen, Search, ExternalLink,
  Paperclip, Trash2, GraduationCap, Loader2,
} from "lucide-react";

const VENTURES = [
  { id: "ecoblend-rd", name: "EcoRace", color: "#56A837" },
  { id: "ecoblend",    name: "EcoComp",     color: "#56A837" },
  { id: "bebus",       name: "BEBUS",        color: "#3B85BA" },
  { id: "tone",        name: "TONE",         color: "#F69111" },
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

function getStageGateStatus(experiments: any[], currentTrl: number) {
  const gates: { trl: number; label: string; met: boolean; experiments: any[] }[] = [];
  for (let trl = 1; trl <= Math.min(currentTrl + 1, 9); trl++) {
    const relevant = experiments.filter(e => e.trlLevelJustified === trl);
    const passing = relevant.filter(e => e.outcome === "Pass");
    gates.push({ trl, label: TRL_LABELS[trl] ?? `TRL ${trl}`, met: passing.length > 0, experiments: relevant });
  }
  return gates;
}

// ── Scientific Validation Panel ───────────────────────────────────────────────
function ScientificValidationPanel({
  exp,
  ventureId,
  isValidated,
}: {
  exp: any;
  ventureId: string;
  isValidated: boolean;
}) {
  const utils = trpc.useUtils();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);

  // Fetch attached papers for this task
  const { data: attachedPapers = [], isLoading: papersLoading } = trpc.academicValidation.getTaskPapers.useQuery(
    { taskId: exp.id },
    { enabled: true }
  );

  // Search papers (only fires when searchEnabled = true)
  const { data: searchResults, isLoading: searching, refetch: doSearch } = trpc.academicValidation.searchPapers.useQuery(
    { taskId: exp.id, taskTitle: exp.title, taskDescription: exp.hypothesis ?? exp.method ?? "" },
    { enabled: false }
  );

  const attachMutation = trpc.academicValidation.attachPaper.useMutation({
    onSuccess: () => {
      utils.academicValidation.getTaskPapers.invalidate({ taskId: exp.id });
      utils.academicValidation.getValidatedTasks.invalidate({ ventureId });
      toast.success("Paper attached to task");
    },
    onError: () => toast.error("Failed to attach paper"),
  });

  const detachMutation = trpc.academicValidation.detachPaper.useMutation({
    onSuccess: () => {
      utils.academicValidation.getTaskPapers.invalidate({ taskId: exp.id });
      utils.academicValidation.getValidatedTasks.invalidate({ ventureId });
      toast.success("Paper detached");
    },
    onError: () => toast.error("Failed to detach paper"),
  });

  const handleSearch = async () => {
    setSearchOpen(true);
    await doSearch();
  };

  const handleAttach = (paper: any) => {
    attachMutation.mutate({
      taskId: exp.id,
      ventureId,
      externalId: paper.externalId,
      title: paper.title,
      authors: paper.authors,
      abstract: paper.abstract ?? "",
      url: paper.url ?? "",
      citationCount: paper.citationCount ?? 0,
      publishedYear: paper.publishedYear ?? null,
    });
  };

  const isAlreadyAttached = (externalId: string) =>
    attachedPapers.some((p: any) => p.externalId === externalId);

  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: "#e0f2fe" }}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <GraduationCap size={13} style={{ color: "#1d4ed8" }} />
          <span className="text-xs font-semibold text-blue-700">Scientific Validation</span>
          {isValidated && (
            <Badge className="text-xs h-4 px-1.5 bg-green-100 text-green-700 border-green-200 font-semibold">
              ✓ Scientifically Validated
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-xs gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
          onClick={handleSearch}
          disabled={searching}
        >
          {searching ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} />}
          Find Supporting Research
        </Button>
      </div>

      {/* Attached papers */}
      {papersLoading ? (
        <div className="text-xs text-gray-400 py-1">Loading papers...</div>
      ) : attachedPapers.length > 0 ? (
        <div className="space-y-1.5 mb-2">
          {attachedPapers.map((paper: any) => (
            <div
              key={paper.id}
              className="flex items-start gap-2 p-2 rounded-lg"
              style={{ background: paper.citationCount > 10 ? "#f0fdf4" : "#f8fafc", border: "1px solid", borderColor: paper.citationCount > 10 ? "#bbf7d0" : "#e2e8f0" }}
            >
              <Paperclip size={11} className="mt-0.5 shrink-0 text-blue-400" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5 flex-wrap">
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-700 hover:underline leading-tight"
                  >
                    {paper.title}
                  </a>
                  {paper.citationCount > 10 && (
                    <span className="text-xs px-1 py-0.5 rounded bg-green-100 text-green-700 font-semibold shrink-0">
                      ✓ {paper.citationCount} citations
                    </span>
                  )}
                  {paper.citationCount <= 10 && paper.citationCount > 0 && (
                    <span className="text-xs px-1 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                      {paper.citationCount} citations
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {Array.isArray(paper.authors) ? paper.authors.slice(0, 3).join(", ") : paper.authors}
                  {paper.publishedYear ? ` · ${paper.publishedYear}` : ""}
                </div>
              </div>
              <button
                onClick={() => detachMutation.mutate({ linkId: paper.linkId })}
                className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                title="Detach paper"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-400 mb-2 py-1">
          No papers attached yet. Click "Find Supporting Research" to search Semantic Scholar.
        </div>
      )}

      {/* Search results panel */}
      {searchOpen && (
        <div className="mt-2 border rounded-xl overflow-hidden" style={{ borderColor: "#bfdbfe" }}>
          <div className="flex items-center justify-between px-3 py-2" style={{ background: "#eff6ff" }}>
            <span className="text-xs font-semibold text-blue-700">
              {searching ? "Searching Semantic Scholar..." : `Search Results${searchResults?.keywords ? ` — "${searchResults.keywords}"` : ""}`}
            </span>
            <button onClick={() => setSearchOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">✕ Close</button>
          </div>
          {searching ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" />
              Querying Semantic Scholar API...
            </div>
          ) : searchResults?.papers?.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-6">No papers found. Try a different task description.</div>
          ) : (
            <div className="divide-y divide-blue-100">
              {(searchResults?.papers ?? []).map((paper: any, i: number) => {
                const attached = isAlreadyAttached(paper.externalId);
                return (
                  <div key={i} className="p-3 flex items-start gap-3 hover:bg-blue-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5 flex-wrap mb-0.5">
                        <span className="text-xs font-semibold text-gray-800 leading-tight">{paper.title}</span>
                        {paper.citationCount > 10 && (
                          <span className="text-xs px-1 py-0.5 rounded bg-green-100 text-green-700 font-semibold shrink-0">
                            {paper.citationCount} citations
                          </span>
                        )}
                        {paper.citationCount > 0 && paper.citationCount <= 10 && (
                          <span className="text-xs px-1 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                            {paper.citationCount} citations
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {paper.authors?.slice(0, 3).join(", ")}
                        {paper.publishedYear ? ` · ${paper.publishedYear}` : ""}
                      </div>
                      {paper.abstract && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{paper.abstract}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {paper.url && (
                        <a href={paper.url} target="_blank" rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-blue-100 text-blue-400 transition-colors" title="Open paper">
                          <ExternalLink size={12} />
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs gap-1"
                        style={attached
                          ? { borderColor: "#bbf7d0", color: "#16a34a", background: "#f0fdf4" }
                          : { borderColor: "#bfdbfe", color: "#1d4ed8" }
                        }
                        disabled={attached || attachMutation.isPending}
                        onClick={() => handleAttach(paper)}
                      >
                        <Paperclip size={10} />
                        {attached ? "Attached" : "Attach"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Experiment Card ───────────────────────────────────────────────────────────
function ExperimentCard({
  exp,
  ventureId,
  isValidated,
  onDelete,
}: {
  exp: any;
  ventureId: string;
  isValidated: boolean;
  onDelete: () => void;
}) {
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
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 truncate">{exp.title}</span>
            {exp.trlLevelJustified && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                TRL {exp.trlLevelJustified}
              </span>
            )}
            {isValidated && exp.trlLevelJustified <= 2 && (
              <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: "#dcfce7", color: "#16a34a" }}>
                ✓ Scientifically Validated
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
        <div className="flex items-center gap-2">
          <BookOpen size={13} className="text-blue-300" />
          <div className="text-gray-300">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
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

          {/* Scientific Validation Panel */}
          <ScientificValidationPanel
            exp={exp}
            ventureId={ventureId}
            isValidated={isValidated}
          />

          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6 text-red-400 border-red-200 hover:bg-red-50"
              onClick={onDelete}
            >
              Delete Experiment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
  const { data: validatedData } = trpc.academicValidation.getValidatedTasks.useQuery({ ventureId: selectedVenture });
  const validatedTaskIds = new Set(validatedData?.validatedTaskIds ?? []);

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
    onSuccess: () => {
      utils.experiments.list.invalidate({ ventureId: selectedVenture });
      toast.success("Experiment deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const currentTrl = ventureData?.trl ?? 1;
  const stageGates = getStageGateStatus(experiments, currentTrl);
  const passCount = experiments.filter(e => e.outcome === "Pass").length;
  const pendingCount = experiments.filter(e => e.outcome === "Pending").length;
  const validatedCount = experiments.filter(e => validatedTaskIds.has(e.id)).length;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical size={16} style={{ color: "#1d4ed8" }} />
              <span className="vos-badge" style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: "0.65rem" }}>TRL Evidence Log</span>
              <span className="vos-badge" style={{ background: "#dcfce7", color: "#16a34a", fontSize: "0.65rem" }}>Semantic Scholar</span>
            </div>
            <h1 className="vos-page-title mb-1">Experiment Log</h1>
            <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              Log experiments that justify TRL advancement. Expand any experiment to find and attach peer-reviewed supporting literature from Semantic Scholar.
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
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: "Total", value: experiments.length, color: "#1d4ed8" },
                { label: "Passing", value: passCount, color: "#10b981" },
                { label: "Pending", value: pendingCount, color: "#f59e0b" },
                { label: "Validated", value: validatedCount, color: "#7c3aed" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-lg border p-3 text-center shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Validation legend */}
            <div className="mt-4 p-3 rounded-xl border" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <GraduationCap size={12} style={{ color: "#16a34a" }} />
                <span className="text-xs font-semibold text-green-700">Validation Badge Logic</span>
              </div>
              <p className="text-xs text-green-600">
                TRL 1–2 tasks with at least one attached paper with &gt;10 citations earn the "Scientifically Validated" badge.
              </p>
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
                    ventureId={selectedVenture}
                    isValidated={validatedTaskIds.has(exp.id)}
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
                placeholder="What were you testing and what did you expect? (Used for paper keyword extraction)"
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
