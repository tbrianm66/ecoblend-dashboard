// ============================================================
// ECORACE LAB — 8-Stage AI Engineering Workflow
// Design: Precision Industrial — dark sidebar + stage pipeline
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  FlaskConical,
  Cpu,
  Layers,
  Activity,
  Box,
  Factory,
  CheckCircle2,
  Shield,
  Lightbulb,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Loader2,
  Bot,
  FileText,
  Beaker,
  Zap,
  AlertTriangle,
  CheckCheck,
  Clock,
  Eye,
  X,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_ORDER = ["opportunity","concept","materials","simulation","prototype","manufacturing","validation","ip"] as const;
type Stage = typeof STAGE_ORDER[number];

const STAGE_META: Record<Stage, { label: string; icon: React.ElementType; color: string; agentName: string; agentDesc: string }> = {
  opportunity:    { label: "Opportunity",    icon: Lightbulb,    color: "#F69111", agentName: "Opportunity Translator", agentDesc: "Translates problem statements into structured engineering briefs" },
  concept:        { label: "Concept",        icon: Cpu,          color: "#3B85BA", agentName: "Concept Engineer",       agentDesc: "Generates engineering concepts and performance targets" },
  materials:      { label: "Materials",      icon: Beaker,       color: "#56A837", agentName: "Materials Scientist",    agentDesc: "Designs ECOCOMP formulations and sustainability optimisation" },
  simulation:     { label: "Simulation",     icon: Activity,     color: "#8B5CF6", agentName: "Simulation Engineer",    agentDesc: "Plans FEA, thermal, and fatigue analysis strategies" },
  prototype:      { label: "Prototype",      icon: Box,          color: "#EC4899", agentName: "Concept Engineer",       agentDesc: "CAD outputs and manufacturing feasibility assessment" },
  manufacturing:  { label: "Manufacturing",  icon: Factory,      color: "#F97316", agentName: "Manufacturing Planner",  agentDesc: "UK prototyping and China-scale production strategy" },
  validation:     { label: "Validation",     icon: CheckCircle2, color: "#06B6D4", agentName: "Validation Engineer",    agentDesc: "Testing protocols, compliance, and lifecycle analysis" },
  ip:             { label: "IP Generation",  icon: Shield,       color: "#EF4444", agentName: "IP Generator",           agentDesc: "Patent claims, prior art search, and IP documentation" },
};

const STATUS_COLORS: Record<string, string> = {
  pending:      "#9ca3af",
  in_progress:  "#F69111",
  human_review: "#3B85BA",
  completed:    "#56A837",
  blocked:      "#EF4444",
};

const STATUS_LABELS: Record<string, string> = {
  pending:      "Pending",
  in_progress:  "Running",
  human_review: "Review",
  completed:    "Complete",
  blocked:      "Blocked",
};

// ─── Helper Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${STATUS_COLORS[status] ?? "#9ca3af"}20`, color: STATUS_COLORS[status] ?? "#9ca3af" }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border p-4 flex flex-col gap-1 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-2xl font-bold" style={{ color: color ?? "#1a2332", fontFamily: "'Prompt', sans-serif" }}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

// ─── Stage Pipeline Card ──────────────────────────────────────────────────────

function StagePipelineCard({
  stage,
  stageInfo,
  isActive,
  onClick,
}: {
  stage: Stage;
  stageInfo: { status: string; humanApproved: boolean; iterationCount: number; hasOutput: boolean };
  isActive: boolean;
  onClick: () => void;
}) {
  const meta = STAGE_META[stage];
  const Icon = meta.icon;
  const isComplete = stageInfo.status === "completed";
  const isRunning = stageInfo.status === "in_progress";

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group cursor-pointer"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 border-2"
        style={{
          background: isActive ? meta.color : isComplete ? `${meta.color}15` : "#f9fafb",
          borderColor: isActive ? meta.color : isComplete ? meta.color : "#e5e7eb",
        }}
      >
        {isRunning ? (
          <Loader2 size={20} className="animate-spin" style={{ color: meta.color }} />
        ) : (
          <Icon size={20} style={{ color: isActive ? "white" : isComplete ? meta.color : "#9ca3af" }} />
        )}
      </div>
      <span className="text-xs font-medium text-center leading-tight" style={{ color: isActive ? meta.color : "#6b7280", maxWidth: 64 }}>
        {meta.label}
      </span>
      <StatusBadge status={stageInfo.status} />
    </button>
  );
}

// ─── Stage Detail Panel ───────────────────────────────────────────────────────

function StageDetailPanel({
  projectId,
  stage,
  stageData,
  onRefresh,
}: {
  projectId: number;
  stage: Stage;
  stageData: { status: string; humanApproved: boolean; iterationCount: number; hasOutput: boolean } | undefined;
  onRefresh: () => void;
}) {
  const meta = STAGE_META[stage];
  const Icon = meta.icon;
  const [additionalContext, setAdditionalContext] = useState("");
  const [showOutput, setShowOutput] = useState(false);

  const stageQuery = trpc.ecoraceLab.stages.get.useQuery({ projectId, stage });
  const runAgent = trpc.ecoraceLab.stages.runAgent.useMutation({
    onSuccess: () => {
      toast.success(`${meta.agentName} completed — output ready for review`);
      stageQuery.refetch();
      onRefresh();
    },
    onError: (e) => toast.error(`Agent failed: ${e.message}`),
  });
  const updateStatus = trpc.ecoraceLab.stages.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Stage status updated");
      stageQuery.refetch();
      onRefresh();
    },
  });

  const stageRecord = stageQuery.data;
  let parsedOutput: any = null;
  if (stageRecord?.outputData) {
    try { parsedOutput = JSON.parse(stageRecord.outputData); } catch {}
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#e5e7eb", background: `${meta.color}08` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}20` }}>
            <Icon size={20} style={{ color: meta.color }} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Stage {STAGE_ORDER.indexOf(stage) + 1}: {meta.label}
            </h3>
            <p className="text-xs text-gray-500">{meta.agentName} · {meta.agentDesc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stageRecord && <StatusBadge status={stageRecord.status ?? "pending"} />}
          {stageRecord?.iterationCount ? (
            <span className="text-xs text-gray-400">Iteration {stageRecord.iterationCount}</span>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Agent Run Controls */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Additional Context (optional)
          </label>
          <Textarea
            placeholder={`Add specific requirements or constraints for the ${meta.agentName}...`}
            value={additionalContext}
            onChange={e => setAdditionalContext(e.target.value)}
            rows={2}
            className="text-sm resize-none"
          />
        </div>

        <div className="flex items-center gap-2 mb-5">
          <Button
            size="sm"
            onClick={() => runAgent.mutate({ projectId, stage, additionalContext: additionalContext || undefined })}
            disabled={runAgent.isPending}
            className="gap-1.5 text-xs"
            style={{ background: meta.color, color: "white", border: "none" }}
          >
            {runAgent.isPending ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
            {stageRecord?.outputData ? "Re-run Agent" : "Run Agent"}
          </Button>

          {stageRecord?.status === "human_review" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus.mutate({ id: stageRecord.id, status: "completed", humanApproved: true })}
                disabled={updateStatus.isPending}
                className="gap-1.5 text-xs text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckCheck size={12} /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus.mutate({ id: stageRecord.id, status: "blocked" })}
                disabled={updateStatus.isPending}
                className="gap-1.5 text-xs text-red-500 border-red-200 hover:bg-red-50"
              >
                <X size={12} /> Reject
              </Button>
            </>
          )}

          {stageRecord?.outputData && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowOutput(!showOutput)}
              className="gap-1.5 text-xs ml-auto"
            >
              <Eye size={12} /> {showOutput ? "Hide" : "View"} Output
            </Button>
          )}
        </div>

        {/* AI Narrative */}
        {stageRecord?.aiNarrative && (
          <div className="mb-4 p-4 rounded-xl border" style={{ background: `${meta.color}06`, borderColor: `${meta.color}20` }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: meta.color }}>
              AI Summary
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{stageRecord.aiNarrative}</p>
          </div>
        )}

        {/* Human Notes */}
        {stageRecord?.humanNotes && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-700 mb-1">Reviewer Notes</p>
            <p className="text-sm text-amber-800">{stageRecord.humanNotes}</p>
          </div>
        )}

        {/* Raw JSON Output */}
        {showOutput && parsedOutput && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
              <span className="text-xs font-semibold text-gray-500">Agent Output (JSON)</span>
              <button onClick={() => setShowOutput(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            <pre className="p-4 text-xs text-gray-700 overflow-auto max-h-64 bg-gray-50 font-mono leading-relaxed">
              {JSON.stringify(parsedOutput, null, 2)}
            </pre>
          </div>
        )}

        {/* Empty state */}
        {!stageRecord && !runAgent.isPending && (
          <div className="text-center py-6 text-gray-400">
            <Bot size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Run the {meta.agentName} to generate output for this stage.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Materials Library Tab ────────────────────────────────────────────────────

function MaterialsTab({ projectId }: { projectId: number }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", category: "composite" as const, formulation: "", sustainabilityScore: 0, recycledContent: 0, supplier: "", notes: "" });

  const { data: materials = [], refetch } = trpc.ecoraceLab.materials.list.useQuery({ projectId });
  const upsert = trpc.ecoraceLab.materials.upsert.useMutation({ onSuccess: () => { refetch(); setShowAdd(false); toast.success("Material saved"); } });
  const deleteMat = trpc.ecoraceLab.materials.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Material deleted"); } });
  const generate = trpc.ecoraceLab.materials.generateFromStage.useMutation({
    onSuccess: () => { refetch(); toast.success("Material generated from stage output"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Materials Library</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => generate.mutate({ projectId })} disabled={generate.isPending} className="gap-1.5 text-xs">
            {generate.isPending ? <Loader2 size={12} className="animate-spin" /> : <Beaker size={12} />} Generate from Stage
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 text-xs" style={{ background: "#56A837", color: "white", border: "none" }}>
            <Plus size={12} /> Add Material
          </Button>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Beaker size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No materials yet. Run the Materials Scientist agent or add manually.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {materials.map(m => (
            <div key={m.id} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{m.name}</span>
                    {m.aiGenerated && <Badge variant="outline" className="text-xs" style={{ borderColor: "#56A837", color: "#56A837" }}>AI</Badge>}
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{m.category?.replace("_", " ")}</span>
                </div>
                <button onClick={() => deleteMat.mutate({ id: m.id })} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {m.sustainabilityScore !== null && (
                  <div>
                    <span className="text-xs text-gray-400">Sustainability</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                        <div className="h-full rounded-full" style={{ width: `${m.sustainabilityScore}%`, background: "#56A837" }} />
                      </div>
                      <span className="text-xs font-mono text-gray-600">{m.sustainabilityScore}%</span>
                    </div>
                  </div>
                )}
                {m.recycledContent !== null && (
                  <div>
                    <span className="text-xs text-gray-400">Recycled Content</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                        <div className="h-full rounded-full" style={{ width: `${m.recycledContent}%`, background: "#3B85BA" }} />
                      </div>
                      <span className="text-xs font-mono text-gray-600">{m.recycledContent}%</span>
                    </div>
                  </div>
                )}
              </div>
              {(m.tensileStrength || m.density || m.carbonFootprint) && (
                <div className="flex gap-3 mt-2">
                  {m.tensileStrength && <span className="text-xs text-gray-500">σ: {m.tensileStrength}</span>}
                  {m.density && <span className="text-xs text-gray-500">ρ: {m.density}</span>}
                  {m.carbonFootprint && <span className="text-xs text-gray-500">CO₂: {m.carbonFootprint}</span>}
                </div>
              )}
              {m.supplier && <p className="text-xs text-gray-400 mt-1.5">Supplier: {m.supplier}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Material name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}>
              {["polymer","composite","metal","ceramic","bio_based","recycled","nano","hybrid"].map(c => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
            <Textarea placeholder="Formulation / composition" value={form.formulation} onChange={e => setForm(f => ({ ...f, formulation: e.target.value }))} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Sustainability Score (0-100)</label>
                <Input type="number" min={0} max={100} value={form.sustainabilityScore} onChange={e => setForm(f => ({ ...f, sustainabilityScore: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Recycled Content (%)</label>
                <Input type="number" min={0} max={100} value={form.recycledContent} onChange={e => setForm(f => ({ ...f, recycledContent: Number(e.target.value) }))} />
              </div>
            </div>
            <Input placeholder="Supplier" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
            <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate({ ...form, projectId })} disabled={!form.name || upsert.isPending}>
              {upsert.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Simulations Tab ──────────────────────────────────────────────────────────

function SimulationsTab({ projectId }: { projectId: number }) {
  const { data: sims = [], refetch } = trpc.ecoraceLab.simulations.list.useQuery({ projectId });
  const deleteSim = trpc.ecoraceLab.simulations.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Simulation deleted"); } });
  const generatePlan = trpc.ecoraceLab.simulations.generatePlan.useMutation({
    onSuccess: (data) => { refetch(); toast.success(`${data.length} simulations generated from stage output`); },
    onError: (e) => toast.error(e.message),
  });
  const updateSim = trpc.ecoraceLab.simulations.upsert.useMutation({ onSuccess: () => refetch() });

  const simTypeColors: Record<string, string> = {
    fea: "#3B85BA", thermal: "#F69111", fatigue: "#EF4444",
    cfd: "#8B5CF6", impact: "#EC4899", vibration: "#06B6D4", lifecycle: "#56A837",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Simulation Register</h3>
        <Button size="sm" variant="outline" onClick={() => generatePlan.mutate({ projectId })} disabled={generatePlan.isPending} className="gap-1.5 text-xs">
          {generatePlan.isPending ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />} Generate Plan from Stage
        </Button>
      </div>

      {sims.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Activity size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No simulations yet. Run the Simulation Engineer agent first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sims.map(s => (
            <div key={s.id} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: `${simTypeColors[s.simType] ?? "#9ca3af"}15`, color: simTypeColors[s.simType] ?? "#9ca3af" }}>
                    {s.simType}
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">{s.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.status ?? "queued"} />
                  {s.passedValidation && (
                    <span className="text-xs font-semibold text-green-600 flex items-center gap-0.5">
                      <CheckCheck size={12} /> Passed
                    </span>
                  )}
                  <button onClick={() => deleteSim.mutate({ id: s.id })} className="text-gray-300 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {s.softwareTool && <p className="text-xs text-gray-500 mt-1.5">Tool: {s.softwareTool}</p>}
              {s.aiAnalysis && <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{s.aiAnalysis}</p>}
              {s.safetyFactor && <p className="text-xs text-gray-500 mt-1">Safety Factor: {s.safetyFactor}</p>}
              <div className="flex gap-2 mt-3">
                {(["queued","running","completed","failed","needs_iteration"] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => updateSim.mutate({ id: s.id, simType: s.simType, title: s.title, projectId, status: st })}
                    className="text-xs px-2 py-0.5 rounded-full border transition-colors"
                    style={{
                      borderColor: s.status === st ? STATUS_COLORS[st] ?? "#9ca3af" : "#e5e7eb",
                      color: s.status === st ? STATUS_COLORS[st] ?? "#9ca3af" : "#9ca3af",
                      background: s.status === st ? `${STATUS_COLORS[st] ?? "#9ca3af"}10` : "transparent",
                    }}
                  >
                    {STATUS_LABELS[st] ?? st}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── IP Assets Tab ────────────────────────────────────────────────────────────

function IpTab({ projectId }: { projectId: number }) {
  const { data: assets = [], refetch } = trpc.ecoraceLab.ip.list.useQuery({ projectId });
  const deleteAsset = trpc.ecoraceLab.ip.delete.useMutation({ onSuccess: () => { refetch(); toast.success("IP asset deleted"); } });
  const generateIp = trpc.ecoraceLab.ip.generateFromStage.useMutation({
    onSuccess: () => { refetch(); toast.success("IP asset generated from stage output"); },
    onError: (e) => toast.error(e.message),
  });

  const filingColors: Record<string, string> = {
    draft: "#9ca3af", review: "#F69111", filed: "#3B85BA",
    granted: "#56A837", rejected: "#EF4444", abandoned: "#6b7280",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>IP Assets</h3>
        <Button size="sm" variant="outline" onClick={() => generateIp.mutate({ projectId })} disabled={generateIp.isPending} className="gap-1.5 text-xs">
          {generateIp.isPending ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />} Generate from Stage
        </Button>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Shield size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No IP assets yet. Run the IP Generator agent first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assets.map(a => (
            <div key={a.id} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900">{a.title}</span>
                    {a.aiGenerated && <Badge variant="outline" className="text-xs" style={{ borderColor: "#EF4444", color: "#EF4444" }}>AI</Badge>}
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{a.ipType?.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                    style={{ background: `${filingColors[a.filingStatus ?? "draft"]}15`, color: filingColors[a.filingStatus ?? "draft"] }}>
                    {a.filingStatus}
                  </span>
                  <button onClick={() => deleteAsset.mutate({ id: a.id })} className="text-gray-300 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {a.noveltyStatement && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Novelty Statement</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{a.noveltyStatement}</p>
                </div>
              )}
              {a.draftClaims && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-xs font-semibold text-red-700 mb-1">Independent Claim 1</p>
                  <p className="text-xs text-red-800 leading-relaxed">{a.draftClaims}</p>
                </div>
              )}
              {a.jurisdiction && <p className="text-xs text-gray-400 mt-2">Jurisdictions: {a.jurisdiction}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Validation Tab ───────────────────────────────────────────────────────────

function ValidationTab({ projectId }: { projectId: number }) {
  const { data: logs = [], refetch } = trpc.ecoraceLab.validation.list.useQuery({ projectId });
  const deleteLog = trpc.ecoraceLab.validation.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Validation log deleted"); } });
  const generateLogs = trpc.ecoraceLab.validation.generateFromStage.useMutation({
    onSuccess: (data) => { refetch(); toast.success(`${data.length} validation tests generated`); },
    onError: (e) => toast.error(e.message),
  });
  const updateLog = trpc.ecoraceLab.validation.upsert.useMutation({ onSuccess: () => refetch() });

  const typeColors: Record<string, string> = {
    performance: "#3B85BA", compliance: "#F69111", lifecycle: "#56A837",
    safety: "#EF4444", market: "#8B5CF6", technical: "#06B6D4",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Validation Log</h3>
        <Button size="sm" variant="outline" onClick={() => generateLogs.mutate({ projectId })} disabled={generateLogs.isPending} className="gap-1.5 text-xs">
          {generateLogs.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Generate from Stage
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No validation logs yet. Run the Validation Engineer agent first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(l => (
            <div key={l.id} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ background: `${typeColors[l.validationType] ?? "#9ca3af"}15`, color: typeColors[l.validationType] ?? "#9ca3af" }}>
                    {l.validationType}
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">{l.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateLog.mutate({ id: l.id, projectId, validationType: l.validationType, title: l.title, passed: !l.passed })}
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${l.passed ? "text-green-600 border-green-200 bg-green-50" : "text-gray-400 border-gray-200"}`}
                  >
                    {l.passed ? "✓ Passed" : "Pending"}
                  </button>
                  <button onClick={() => deleteLog.mutate({ id: l.id })} className="text-gray-300 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {l.standard && <p className="text-xs text-gray-500 mt-1.5">Standard: {l.standard}</p>}
              {l.testMethod && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{l.testMethod}</p>}
              {l.notes && <p className="text-xs text-gray-400 mt-1">Priority: {l.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Agent Log Tab ────────────────────────────────────────────────────────────

function AgentLogTab({ projectId }: { projectId: number }) {
  const { data: runs = [] } = trpc.ecoraceLab.agentRuns.list.useQuery({ projectId, limit: 30 });

  return (
    <div>
      <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>Agent Run Log</h3>
      {runs.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Bot size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No agent runs yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map(r => (
            <div key={r.id} className="bg-white rounded-xl border p-4 shadow-sm flex items-center gap-4" style={{ borderColor: "#e5e7eb" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: r.status === "completed" ? "#56A83715" : "#EF444415" }}>
                <Bot size={16} style={{ color: r.status === "completed" ? "#56A837" : "#EF4444" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">{r.agentName}</span>
                  <span className="text-xs text-gray-400 capitalize">· {r.agentId?.replace("_", " ")}</span>
                </div>
                {r.errorMessage && <p className="text-xs text-red-500 mt-0.5">{r.errorMessage}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <StatusBadge status={r.status ?? "queued"} />
                {r.durationMs && <p className="text-xs text-gray-400 mt-0.5">{(r.durationMs / 1000).toFixed(1)}s</p>}
                <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── New Project Dialog ───────────────────────────────────────────────────────

function NewProjectDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: number) => void }) {
  const [form, setForm] = useState({
    title: "", description: "", problemStatement: "", marketReqs: "", technicalReqs: "",
    priority: "medium" as const, ventureId: "",
  });

  const { data: ventures = [] } = trpc.ventures.list.useQuery();
  const upsert = trpc.ecoraceLab.projects.upsert.useMutation({
    onSuccess: (data) => { onCreated(data.id); onClose(); toast.success("Project created"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New EcoRace Lab Project</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          <Input placeholder="Project title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.ventureId} onChange={e => setForm(f => ({ ...f, ventureId: e.target.value }))}>
            <option value="">Select venture (optional)</option>
            {ventures.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <Textarea placeholder="Problem statement *" value={form.problemStatement} onChange={e => setForm(f => ({ ...f, problemStatement: e.target.value }))} rows={3} />
          <Textarea placeholder="Market requirements" value={form.marketReqs} onChange={e => setForm(f => ({ ...f, marketReqs: e.target.value }))} rows={2} />
          <Textarea placeholder="Technical requirements" value={form.technicalReqs} onChange={e => setForm(f => ({ ...f, technicalReqs: e.target.value }))} rows={2} />
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}>
            {["low","medium","high","critical"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => upsert.mutate(form)} disabled={!form.title || upsert.isPending} style={{ background: "#56A837", color: "white", border: "none" }}>
            {upsert.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "workflow" | "materials" | "simulations" | "ip" | "validation" | "agents";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "workflow",    label: "Workflow",    icon: FlaskConical },
  { id: "materials",  label: "Materials",   icon: Beaker },
  { id: "simulations",label: "Simulations", icon: Activity },
  { id: "ip",         label: "IP Assets",   icon: Shield },
  { id: "validation", label: "Validation",  icon: CheckCircle2 },
  { id: "agents",     label: "Agent Log",   icon: Bot },
];

export default function EcoraceLab() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeStage, setActiveStage] = useState<Stage>("opportunity");
  const [activeTab, setActiveTab] = useState<Tab>("workflow");
  const [showNewProject, setShowNewProject] = useState(false);

  const { data: projects = [], refetch: refetchProjects } = trpc.ecoraceLab.projects.list.useQuery({});
  const { data: summary } = trpc.ecoraceLab.projects.summary.useQuery();
  const { data: dashboard, refetch: refetchDashboard } = trpc.ecoraceLab.dashboard.get.useQuery(
    { projectId: selectedProjectId! },
    { enabled: selectedProjectId !== null }
  );
  const deleteProject = trpc.ecoraceLab.projects.delete.useMutation({
    onSuccess: () => { refetchProjects(); setSelectedProjectId(null); toast.success("Project deleted"); },
  });

  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);

  const handleRefresh = () => {
    refetchDashboard();
    refetchProjects();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#56A83715" }}>
              <FlaskConical size={20} style={{ color: "#56A837" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                EcoRace Lab
              </h1>
              <p className="text-xs text-gray-500">8-Stage AI Engineering Workflow · 7 Specialised Agents</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowNewProject(true)} className="gap-1.5 text-xs" style={{ background: "#56A837", color: "white", border: "none" }}>
            <Plus size={13} /> New Project
          </Button>
        </div>

        {/* Portfolio KPIs */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <KpiCard label="Total Projects" value={summary.total} sub="in lab" color="#1a2332" />
            <KpiCard label="Active" value={summary.active} sub="in progress" color="#56A837" />
            <KpiCard label="Completed" value={summary.completed} sub="delivered" color="#3B85BA" />
            <KpiCard label="High Priority" value={(summary.byPriority?.high ?? 0) + (summary.byPriority?.critical ?? 0)} sub="high + critical" color="#EF4444" />
          </div>
        )}
      </div>

      <div className="flex gap-0 min-h-screen">
        {/* Project Sidebar */}
        <div className="w-72 flex-shrink-0 bg-white border-r" style={{ borderColor: "#e5e7eb" }}>
          <div className="p-4 border-b" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects ({projects.length})</p>
          </div>
          <div className="overflow-y-auto">
            {projects.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <FlaskConical size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No projects yet. Create one to begin.</p>
              </div>
            ) : (
              projects.map((p: any) => {
                const isSelected = p.id === selectedProjectId;
                const priorityColors: Record<string, string> = { low: "#9ca3af", medium: "#F69111", high: "#EF4444", critical: "#7C3AED" };
                return (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProjectId(p.id); setActiveTab("workflow"); setActiveStage("opportunity"); }}
                    className="w-full text-left px-4 py-3 border-b transition-colors hover:bg-gray-50"
                    style={{ borderColor: "#f3f4f6", background: isSelected ? "#56A83708" : "transparent", borderLeft: isSelected ? "3px solid #56A837" : "3px solid transparent" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs capitalize" style={{ color: priorityColors[p.priority ?? "medium"] }}>
                            ● {p.priority}
                          </span>
                          <span className="text-xs text-gray-400">· {p.currentStage}</span>
                        </div>
                      </div>
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium ml-2 flex-shrink-0"
                        style={{ background: p.status === "active" ? "#56A83715" : "#f3f4f6", color: p.status === "active" ? "#56A837" : "#9ca3af" }}>
                        {p.status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {!selectedProject ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <FlaskConical size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-semibold text-gray-500" style={{ fontFamily: "'Prompt', sans-serif" }}>Select a project</p>
              <p className="text-sm mt-1">Choose a project from the sidebar or create a new one.</p>
              <Button size="sm" onClick={() => setShowNewProject(true)} className="mt-4 gap-1.5" style={{ background: "#56A837", color: "white", border: "none" }}>
                <Plus size={13} /> New Project
              </Button>
            </div>
          ) : (
            <>
              {/* Project Header */}
              <div className="bg-white rounded-2xl border p-5 mb-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{selectedProject.title}</h2>
                    {selectedProject.description && <p className="text-sm text-gray-500 mt-0.5">{selectedProject.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500">{dashboard?.progressPct ?? 0}% complete</span>
                    <button
                      onClick={() => { if (confirm("Delete this project?")) deleteProject.mutate({ id: selectedProject.id }); }}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-gray-100 mb-4">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${dashboard?.progressPct ?? 0}%`, background: "#56A837" }} />
                </div>

                {/* Stage Pipeline */}
                <div className="flex items-start gap-2 overflow-x-auto pb-1">
                  {STAGE_ORDER.map((stage, idx) => {
                    const stageInfo = dashboard?.stageProgress?.find((s: any) => s.stage === stage) ?? { status: "pending", humanApproved: false, iterationCount: 0, hasOutput: false };
                    return (
                      <div key={stage} className="flex items-center gap-2 flex-shrink-0">
                        <StagePipelineCard
                          stage={stage}
                          stageInfo={stageInfo}
                          isActive={activeStage === stage && activeTab === "workflow"}
                          onClick={() => { setActiveStage(stage); setActiveTab("workflow"); }}
                        />
                        {idx < STAGE_ORDER.length - 1 && (
                          <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-[-16px]" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Stats row */}
                {dashboard?.stats && (
                  <div className="flex gap-4 mt-4 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
                    <span className="text-xs text-gray-500">{dashboard.stats.materialsCount} materials</span>
                    <span className="text-xs text-gray-500">{dashboard.stats.simulationsCount} simulations ({dashboard.stats.simulationsPassedCount} passed)</span>
                    <span className="text-xs text-gray-500">{dashboard.stats.ipAssetsCount} IP assets</span>
                    <span className="text-xs text-gray-500">{dashboard.stats.validationsCount} validations ({dashboard.stats.validationsPassedCount} passed)</span>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-5 bg-white rounded-xl border p-1 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: activeTab === tab.id ? "#56A837" : "transparent",
                        color: activeTab === tab.id ? "white" : "#6b7280",
                      }}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              {activeTab === "workflow" && (
                <StageDetailPanel
                  projectId={selectedProject.id}
                  stage={activeStage}
                  stageData={dashboard?.stageProgress?.find((s: any) => s.stage === activeStage)}
                  onRefresh={handleRefresh}
                />
              )}
              {activeTab === "materials" && <MaterialsTab projectId={selectedProject.id} />}
              {activeTab === "simulations" && <SimulationsTab projectId={selectedProject.id} />}
              {activeTab === "ip" && <IpTab projectId={selectedProject.id} />}
              {activeTab === "validation" && <ValidationTab projectId={selectedProject.id} />}
              {activeTab === "agents" && <AgentLogTab projectId={selectedProject.id} />}
            </>
          )}
        </div>
      </div>

      <NewProjectDialog
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        onCreated={(id) => { setSelectedProjectId(id); refetchProjects(); }}
      />
    </div>
  );
}
