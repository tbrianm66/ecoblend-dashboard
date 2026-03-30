/**
 * Playbook Stewardship Portal — Sprint 70
 * 5 strategic playbooks (PB-01 to PB-05), each with 2 variants
 * Tabs: Folder Browser | Playbook Viewer | Step Runner | KPI Dashboard | AI Generator
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  BookOpen, Play, BarChart3, Sparkles, FolderOpen, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, XCircle, Loader2, Plus,
  Target, Zap, Shield, Brain, Layers, RefreshCw, ArrowRight,
  FileText, Users, Calendar, TrendingUp, Activity
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type SubFolder = "avoid_catch22" | "democratize_quality" | "embed_operations" | "adapt_ai_genai" | "scale_governance";

const FOLDER_META: Record<SubFolder, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  avoid_catch22: {
    label: "Avoid the Catch-22",
    icon: <RefreshCw size={18} />,
    color: "#51AF37",
    description: "Improve data quality through active usage — break the cycle by instrumenting consumer feedback.",
  },
  democratize_quality: {
    label: "Democratize Quality",
    icon: <Users size={18} />,
    color: "#3A97D3",
    description: "Distribute data stewardship across every business domain — quality owned by those who create it.",
  },
  embed_operations: {
    label: "Embed Across Operations",
    icon: <Layers size={18} />,
    color: "#F49C13",
    description: "Embed quality checks invisibly into CRM, ERP, and BI pipelines — zero friction for end users.",
  },
  adapt_ai_genai: {
    label: "Adapt for AI/GenAI",
    icon: <Brain size={18} />,
    color: "#8B5CF6",
    description: "Prepare quality-gated, AI-ready data assets for RAG indexing and fine-tuning pipelines.",
  },
  scale_governance: {
    label: "Scale Across Governance",
    icon: <Shield size={18} />,
    color: "#EF4444",
    description: "Anchor data quality to enterprise governance, compliance, and policy enforcement at scale.",
  },
};

const STATUS_COLORS: Record<string, string> = {
  active: "#51AF37",
  draft: "#F49C13",
  deprecated: "#6b7280",
};

const RUN_STATUS_COLORS: Record<string, string> = {
  pending: "#F49C13",
  in_progress: "#3A97D3",
  completed: "#51AF37",
  failed: "#EF4444",
  cancelled: "#6b7280",
};

const STEP_STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={14} className="text-gray-400" />,
  in_progress: <Loader2 size={14} className="text-blue-500 animate-spin" />,
  completed: <CheckCircle2 size={14} className="text-green-500" />,
  skipped: <ArrowRight size={14} className="text-gray-400" />,
  blocked: <AlertTriangle size={14} className="text-red-500" />,
};

// ─── Folder Browser Tab ───────────────────────────────────────────────────────
function FolderBrowserTab({
  onSelectPlaybook,
}: {
  onSelectPlaybook: (id: number) => void;
}) {
  const [selectedFolder, setSelectedFolder] = useState<SubFolder | null>(null);
  const { data: allPlaybooks = [], isLoading } = trpc.playbook.playbooks.list.useQuery();
  const seedMutation = trpc.playbook.playbooks.seed.useMutation({
    onSuccess: (data) => {
      toast.success(`Seeded ${data.seeded} canonical playbooks`);
    },
    onError: () => toast.error("Failed to seed playbooks"),
  });

  const folderPlaybooks = selectedFolder
    ? allPlaybooks.filter((pb) => pb.subFolder === selectedFolder)
    : [];

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Folder list */}
      <div className="w-72 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Playbook Library
          </h3>
          {allPlaybooks.length === 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              style={{ borderColor: "#51AF37", color: "#51AF37" }}
            >
              {seedMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Seed Playbooks
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : allPlaybooks.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No playbooks yet. Click "Seed Playbooks" to load the 10 canonical playbooks.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(Object.keys(FOLDER_META) as SubFolder[]).map((folder) => {
              const meta = FOLDER_META[folder];
              const count = allPlaybooks.filter((pb) => pb.subFolder === folder).length;
              const active = allPlaybooks.filter((pb) => pb.subFolder === folder && pb.status === "active").length;
              return (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder === selectedFolder ? null : folder)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-150 ${
                    selectedFolder === folder ? "border-2 shadow-sm" : "border hover:shadow-sm"
                  }`}
                  style={{
                    borderColor: selectedFolder === folder ? meta.color : "#e5e7eb",
                    background: selectedFolder === folder ? `${meta.color}08` : "white",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    <span className="text-xs font-bold text-gray-800" style={{ fontFamily: "'Prompt', sans-serif" }}>
                      {meta.label}
                    </span>
                    <ChevronRight size={12} className="ml-auto text-gray-400" />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-gray-400">{count} playbooks</span>
                    <span className="text-xs" style={{ color: meta.color }}>{active} active</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Playbook cards */}
      <div className="flex-1">
        {!selectedFolder ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a folder to view playbooks</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: FOLDER_META[selectedFolder].color }}>
                  {FOLDER_META[selectedFolder].icon}
                </span>
                <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  {FOLDER_META[selectedFolder].label}
                </h3>
              </div>
              <p className="text-xs text-gray-500">{FOLDER_META[selectedFolder].description}</p>
            </div>

            {folderPlaybooks.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">No playbooks in this folder yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {folderPlaybooks.map((pb) => (
                  <div
                    key={pb.id}
                    className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition-all duration-200"
                    style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${FOLDER_META[pb.subFolder as SubFolder]?.color || "#51AF37"}` }}
                    onClick={() => onSelectPlaybook(pb.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">{pb.playbookId}</span>
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${STATUS_COLORS[pb.status]}15`, color: STATUS_COLORS[pb.status] }}
                          >
                            {pb.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                          {pb.title}
                        </h4>
                      </div>
                    </div>
                    {pb.ownerRole && (
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Users size={11} /> {pb.ownerRole}
                      </p>
                    )}
                    {pb.strategicPrinciple && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{pb.strategicPrinciple}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Play size={11} /> {pb.runCount || 0} runs</span>
                      {pb.lastRun && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> Last: {new Date(pb.lastRun).toLocaleDateString()}
                        </span>
                      )}
                      <span className="ml-auto text-xs font-mono">v{pb.version}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Playbook Viewer Tab ──────────────────────────────────────────────────────
function PlaybookViewerTab({
  selectedPlaybookId,
  onStartRun,
}: {
  selectedPlaybookId: number | null;
  onStartRun: (runId: number) => void;
}) {
  const { data: pb, isLoading } = trpc.playbook.playbooks.get.useQuery(
    { id: selectedPlaybookId! },
    { enabled: !!selectedPlaybookId }
  );
  const startMutation = trpc.playbook.runs.start.useMutation({
    onSuccess: (data) => {
      toast.success("Playbook run started!");
      onStartRun(data.runId);
    },
    onError: () => toast.error("Failed to start run"),
  });

  if (!selectedPlaybookId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a playbook from the Folder Browser to view it here</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!pb) return null;

  const triggerConditions: string[] = pb.triggerConditions ? JSON.parse(pb.triggerConditions as string) : [];
  // pb.kpis is the joined KPI entries array from the router; pb.kpiText is the JSON text field
  const kpiEntries = pb.kpis as Array<{ id: number; kpiLabel: string; achieved: boolean | null; targetValue: string | null; actualValue: string | null; unit: string | null; measuredAt: Date }> ?? [];
  const folderMeta = FOLDER_META[pb.subFolder as SubFolder];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${folderMeta?.color || "#51AF37"}` }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-gray-400">{pb.playbookId}</span>
              <span className="text-xs font-mono text-gray-400">v{pb.version}</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${STATUS_COLORS[pb.status]}15`, color: STATUS_COLORS[pb.status] }}
              >
                {pb.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {pb.title}
            </h2>
            {pb.ownerRole && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Users size={13} /> Owner: {pb.ownerRole}
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => startMutation.mutate({ playbookId: pb.id })}
            disabled={startMutation.isPending || pb.status !== "active"}
            className="gap-1.5"
            style={{ background: "#51AF37", color: "white" }}
          >
            {startMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            Start Run
          </Button>
        </div>

        {pb.strategicPrinciple && (
          <div className="mt-4 p-3 rounded-lg text-sm text-gray-700 italic" style={{ background: `${folderMeta?.color || "#51AF37"}08`, borderLeft: `3px solid ${folderMeta?.color || "#51AF37"}` }}>
            "{pb.strategicPrinciple}"
          </div>
        )}
      </div>

      {/* Two-column: Triggers + KPIs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {triggerConditions.length > 0 && (
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2" style={{ fontFamily: "'Prompt', sans-serif" }}>
              <Zap size={14} style={{ color: "#F49C13" }} /> Trigger Conditions
            </h3>
            <ul className="space-y-2">
              {triggerConditions.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5" style={{ background: "#F49C13" }}>{i + 1}</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {kpiEntries.length > 0 && (
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2" style={{ fontFamily: "'Prompt', sans-serif" }}>
              <Target size={14} style={{ color: "#3A97D3" }} /> KPI Entries ({kpiEntries.length})
            </h3>
            <ul className="space-y-2">
              {kpiEntries.map((k, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: k.achieved ? "#51AF37" : "#3A97D3" }} />
                  {k.kpiLabel} {k.actualValue ? `— ${k.actualValue}${k.unit ? ` ${k.unit}` : ""}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Steps */}
      {pb.steps && pb.steps.length > 0 && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Prompt', sans-serif" }}>
            <Activity size={14} style={{ color: "#51AF37" }} /> Execution Steps ({pb.steps.length})
          </h3>
          <div className="relative">
            {pb.steps.map((step, i) => (
              <div key={step.id} className="flex gap-4 mb-4 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: folderMeta?.color || "#51AF37" }}>
                    {step.stepNumber}
                  </div>
                  {i < pb.steps.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ background: "#e5e7eb", minHeight: "20px" }} />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">{step.title}</span>
                    {step.assigneeRole && (
                      <Badge variant="outline" className="text-xs" style={{ borderColor: "#e5e7eb", color: "#6b7280" }}>
                        {step.assigneeRole}
                      </Badge>
                    )}
                    {step.slaDays && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> {step.slaDays}d SLA
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{step.action}</p>
                  {step.outputArtifact && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FileText size={11} /> Output: {step.outputArtifact}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent runs */}
      {pb.runs && pb.runs.length > 0 && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2" style={{ fontFamily: "'Prompt', sans-serif" }}>
            <Play size={14} style={{ color: "#51AF37" }} /> Recent Runs
          </h3>
          <div className="space-y-2">
            {pb.runs.map((run) => (
              <div key={run.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "#f9fafb" }}>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${RUN_STATUS_COLORS[run.status]}15`, color: RUN_STATUS_COLORS[run.status] }}
                >
                  {run.status.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-500">Step {run.currentStep}/{run.totalSteps}</span>
                {run.triggerReason && <span className="text-xs text-gray-400 truncate">{run.triggerReason}</span>}
                <span className="text-xs text-gray-400 ml-auto">{new Date(run.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step Runner Tab ──────────────────────────────────────────────────────────
function StepRunnerTab({ activeRunId }: { activeRunId: number | null }) {
  const [stepNotes, setStepNotes] = useState<Record<number, string>>({});
  const utils = trpc.useUtils();

  const { data: runDetail, isLoading } = trpc.playbook.runs.getRunDetail.useQuery(
    { runId: activeRunId! },
    { enabled: !!activeRunId, refetchInterval: 5000 }
  );

  const advanceMutation = trpc.playbook.runs.advanceStep.useMutation({
    onSuccess: () => {
      toast.success("Step completed!");
      utils.playbook.runs.getRunDetail.invalidate({ runId: activeRunId! });
    },
    onError: () => toast.error("Failed to advance step"),
  });

  const blockMutation = trpc.playbook.runs.blockStep.useMutation({
    onSuccess: () => {
      toast.warning("Step marked as blocked");
      utils.playbook.runs.getRunDetail.invalidate({ runId: activeRunId! });
    },
    onError: () => toast.error("Failed to block step"),
  });

  const cancelMutation = trpc.playbook.runs.cancel.useMutation({
    onSuccess: () => {
      toast.info("Run cancelled");
      utils.playbook.runs.getRunDetail.invalidate({ runId: activeRunId! });
    },
    onError: () => toast.error("Failed to cancel run"),
  });

  if (!activeRunId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <Play size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Start a playbook run from the Playbook Viewer to track execution here</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!runDetail) return null;

  const { run, runSteps, stepDetails } = runDetail;
  const completedCount = runSteps.filter((s) => s.status === "completed").length;
  const progressPct = run.totalSteps > 0 ? Math.round((completedCount / run.totalSteps) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Run header */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-400">Run #{run.id}</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${RUN_STATUS_COLORS[run.status]}15`, color: RUN_STATUS_COLORS[run.status] }}
              >
                {run.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Step {run.currentStep} of {run.totalSteps} · {progressPct}% complete
            </p>
          </div>
          {run.status === "in_progress" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs text-red-500"
              onClick={() => cancelMutation.mutate({ runId: run.id })}
              disabled={cancelMutation.isPending}
            >
              <XCircle size={12} /> Cancel Run
            </Button>
          )}
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, background: run.status === "completed" ? "#51AF37" : "#3A97D3" }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>
          Execution Steps
        </h3>
        <div className="space-y-3">
          {runSteps.map((rs) => {
            const stepDef = stepDetails.find((s) => s.id === rs.stepId);
            const isActive = rs.status === "in_progress";
            return (
              <div
                key={rs.id}
                className={`rounded-xl border p-4 transition-all ${isActive ? "shadow-sm" : ""}`}
                style={{
                  borderColor: isActive ? "#3A97D3" : "#e5e7eb",
                  background: isActive ? "#3A97D308" : "white",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{STEP_STATUS_ICONS[rs.status]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">
                        {rs.stepNumber}. {stepDef?.title}
                      </span>
                      {stepDef?.assigneeRole && (
                        <Badge variant="outline" className="text-xs" style={{ borderColor: "#e5e7eb", color: "#6b7280" }}>
                          {stepDef.assigneeRole}
                        </Badge>
                      )}
                      {stepDef?.slaDays && (
                        <span className="text-xs text-gray-400">{stepDef.slaDays}d SLA</span>
                      )}
                    </div>
                    {stepDef?.action && (
                      <p className="text-xs text-gray-600 mb-2">{stepDef.action}</p>
                    )}
                    {stepDef?.outputArtifact && (
                      <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <FileText size={11} /> {stepDef.outputArtifact}
                      </p>
                    )}

                    {isActive && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          className="w-full text-xs border rounded-lg p-2 resize-none"
                          rows={2}
                          placeholder="Add completion notes or evidence..."
                          value={stepNotes[rs.stepId] || ""}
                          onChange={(e) => setStepNotes((prev) => ({ ...prev, [rs.stepId]: e.target.value }))}
                          style={{ borderColor: "#e5e7eb" }}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() =>
                              advanceMutation.mutate({
                                runId: run.id,
                                stepId: rs.stepId,
                                notes: stepNotes[rs.stepId],
                              })
                            }
                            disabled={advanceMutation.isPending}
                            style={{ background: "#51AF37", color: "white" }}
                          >
                            {advanceMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            Complete Step
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs text-red-500"
                            onClick={() =>
                              blockMutation.mutate({
                                runId: run.id,
                                stepId: rs.stepId,
                                blockerReason: stepNotes[rs.stepId] || "Blocked — reason not specified",
                              })
                            }
                            disabled={blockMutation.isPending}
                          >
                            <AlertTriangle size={12} /> Mark Blocked
                          </Button>
                        </div>
                      </div>
                    )}

                    {rs.notes && rs.status === "completed" && (
                      <p className="text-xs text-gray-500 mt-2 italic">"{rs.notes}"</p>
                    )}
                    {rs.blockerReason && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <AlertTriangle size={11} /> {rs.blockerReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Summary for completed runs */}
      {run.status === "completed" && run.aiSummary && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2" style={{ fontFamily: "'Prompt', sans-serif" }}>
            <Sparkles size={14} style={{ color: "#8B5CF6" }} /> AI Run Summary
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{run.aiSummary}</p>
        </div>
      )}
    </div>
  );
}

// ─── KPI Dashboard Tab ────────────────────────────────────────────────────────
function KpiDashboardTab({ selectedPlaybookId }: { selectedPlaybookId: number | null }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ kpiLabel: "", targetValue: "", actualValue: "", unit: "", achieved: false, notes: "" });
  const utils = trpc.useUtils();

  const { data: kpis = [], isLoading } = trpc.playbook.kpis.list.useQuery(
    { playbookId: selectedPlaybookId! },
    { enabled: !!selectedPlaybookId }
  );

  const recordMutation = trpc.playbook.kpis.record.useMutation({
    onSuccess: () => {
      toast.success("KPI recorded");
      utils.playbook.kpis.list.invalidate({ playbookId: selectedPlaybookId! });
      setShowForm(false);
      setForm({ kpiLabel: "", targetValue: "", actualValue: "", unit: "", achieved: false, notes: "" });
    },
    onError: () => toast.error("Failed to record KPI"),
  });

  if (!selectedPlaybookId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a playbook to track KPIs</p>
        </div>
      </div>
    );
  }

  const achievedCount = kpis.filter((k) => k.achieved).length;

  return (
    <div className="space-y-5">
      {/* KPI summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Entries", value: kpis.length, color: "#3A97D3" },
          { label: "KPIs Achieved", value: achievedCount, color: "#51AF37" },
          { label: "Achievement Rate", value: kpis.length > 0 ? `${Math.round((achievedCount / kpis.length) * 100)}%` : "—", color: "#F49C13" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold" style={{ color: stat.color, fontFamily: "'Prompt', sans-serif" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Record KPI form */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            KPI Entries
          </h3>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowForm(!showForm)} style={{ borderColor: "#51AF37", color: "#51AF37" }}>
            <Plus size={12} /> Record KPI
          </Button>
        </div>

        {showForm && (
          <div className="mb-4 p-4 rounded-xl" style={{ background: "#f9fafb" }}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">KPI Label *</label>
                <input className="w-full text-xs border rounded-lg p-2" value={form.kpiLabel} onChange={(e) => setForm({ ...form, kpiLabel: e.target.value })} placeholder="e.g. Average DQS improvement" style={{ borderColor: "#e5e7eb" }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Unit</label>
                <input className="w-full text-xs border rounded-lg p-2" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. points, %, days" style={{ borderColor: "#e5e7eb" }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Target Value</label>
                <input className="w-full text-xs border rounded-lg p-2" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} placeholder="e.g. 10" style={{ borderColor: "#e5e7eb" }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Actual Value</label>
                <input className="w-full text-xs border rounded-lg p-2" value={form.actualValue} onChange={(e) => setForm({ ...form, actualValue: e.target.value })} placeholder="e.g. 12" style={{ borderColor: "#e5e7eb" }} />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={form.achieved} onChange={(e) => setForm({ ...form, achieved: e.target.checked })} />
                KPI Achieved
              </label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="text-xs gap-1" onClick={() => recordMutation.mutate({ playbookId: selectedPlaybookId, ...form })} disabled={!form.kpiLabel || recordMutation.isPending} style={{ background: "#51AF37", color: "white" }}>
                {recordMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Save
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-20"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
        ) : kpis.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <TrendingUp size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">No KPI entries yet. Record your first measurement above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#f9fafb" }}>
                {kpi.achieved ? (
                  <CheckCircle2 size={15} style={{ color: "#51AF37" }} />
                ) : (
                  <Clock size={15} className="text-gray-400" />
                )}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-800">{kpi.kpiLabel}</p>
                  {(kpi.targetValue || kpi.actualValue) && (
                    <p className="text-xs text-gray-500">
                      Target: {kpi.targetValue || "—"} {kpi.unit} · Actual: {kpi.actualValue || "—"} {kpi.unit}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400">{new Date(kpi.measuredAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI Generator Tab ─────────────────────────────────────────────────────────
function AiGeneratorTab({ onPlaybookGenerated }: { onPlaybookGenerated: () => void }) {
  const [form, setForm] = useState({
    subFolder: "avoid_catch22" as SubFolder,
    ventureContext: "",
    specificChallenge: "",
    teamSize: "",
    industry: "",
  });
  const [generatedPlaybook, setGeneratedPlaybook] = useState<any>(null);
  const utils = trpc.useUtils();

  const generateMutation = trpc.playbook.ai.generatePlaybook.useMutation({
    onSuccess: (data) => {
      setGeneratedPlaybook(data);
      toast.success("AI playbook generated!");
    },
    onError: () => toast.error("AI generation failed"),
  });

  const createMutation = trpc.playbook.playbooks.create.useMutation({
    onSuccess: () => {
      toast.success("Playbook saved to library!");
      utils.playbook.playbooks.list.invalidate();
      setGeneratedPlaybook(null);
      onPlaybookGenerated();
    },
    onError: () => toast.error("Failed to save playbook"),
  });

  return (
    <div className="space-y-5">
      {/* Generator form */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Prompt', sans-serif" }}>
          <Sparkles size={14} style={{ color: "#8B5CF6" }} /> AI Playbook Generator
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Strategic Category *</label>
            <select
              className="w-full text-xs border rounded-lg p-2"
              value={form.subFolder}
              onChange={(e) => setForm({ ...form, subFolder: e.target.value as SubFolder })}
              style={{ borderColor: "#e5e7eb" }}
            >
              {(Object.entries(FOLDER_META) as [SubFolder, typeof FOLDER_META[SubFolder]][]).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Industry</label>
            <input className="w-full text-xs border rounded-lg p-2" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. Financial Services, Healthcare" style={{ borderColor: "#e5e7eb" }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Team Size</label>
            <input className="w-full text-xs border rounded-lg p-2" value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} placeholder="e.g. 5-person startup, 200-person enterprise" style={{ borderColor: "#e5e7eb" }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Venture Context</label>
            <input className="w-full text-xs border rounded-lg p-2" value={form.ventureContext} onChange={(e) => setForm({ ...form, ventureContext: e.target.value })} placeholder="e.g. Early-stage SaaS, Series A fintech" style={{ borderColor: "#e5e7eb" }} />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Specific Challenge</label>
          <textarea className="w-full text-xs border rounded-lg p-2 resize-none" rows={2} value={form.specificChallenge} onChange={(e) => setForm({ ...form, specificChallenge: e.target.value })} placeholder="Describe the specific data quality challenge you're facing..." style={{ borderColor: "#e5e7eb" }} />
        </div>
        <Button
          className="gap-1.5 text-xs"
          onClick={() => generateMutation.mutate(form)}
          disabled={generateMutation.isPending}
          style={{ background: "#8B5CF6", color: "white" }}
        >
          {generateMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {generateMutation.isPending ? "Generating..." : "Generate Custom Playbook"}
        </Button>
      </div>

      {/* Generated result */}
      {generatedPlaybook && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#8B5CF6", borderWidth: "2px" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'Prompt', sans-serif" }}>
              <Sparkles size={14} style={{ color: "#8B5CF6" }} /> Generated Playbook
            </h3>
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() =>
                createMutation.mutate({
                  playbookId: `PB-AI-${Date.now()}`,
                  title: generatedPlaybook.title,
                  subFolder: form.subFolder,
                  strategicPrinciple: generatedPlaybook.strategicPrinciple,
                  triggerConditions: generatedPlaybook.triggerConditions,
                  kpis: generatedPlaybook.kpis,
                  status: "draft",
                })
              }
              disabled={createMutation.isPending}
              style={{ background: "#8B5CF6", color: "white" }}
            >
              {createMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Save to Library
            </Button>
          </div>

          <h4 className="text-base font-bold text-gray-900 mb-2" style={{ fontFamily: "'Prompt', sans-serif" }}>{generatedPlaybook.title}</h4>
          <p className="text-xs text-gray-600 italic mb-4">"{generatedPlaybook.strategicPrinciple}"</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">Trigger Conditions</p>
              <ul className="space-y-1">
                {generatedPlaybook.triggerConditions?.map((t: string, i: number) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <Zap size={11} className="mt-0.5 flex-shrink-0" style={{ color: "#F49C13" }} /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">Success KPIs</p>
              <ul className="space-y-1">
                {generatedPlaybook.kpis?.map((k: string, i: number) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <Target size={11} className="mt-0.5 flex-shrink-0" style={{ color: "#3A97D3" }} /> {k}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-widest">Execution Steps</p>
            <div className="space-y-2">
              {generatedPlaybook.steps?.map((step: any) => (
                <div key={step.stepNumber} className="flex gap-3 p-3 rounded-lg" style={{ background: "#f9fafb" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "#8B5CF6" }}>
                    {step.stepNumber}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{step.title}</p>
                    <p className="text-xs text-gray-600">{step.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{step.assigneeRole} · {step.slaDays}d SLA · Output: {step.outputArtifact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlaybookPortal() {
  const [activeTab, setActiveTab] = useState("folders");
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<number | null>(null);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);

  const handleSelectPlaybook = (id: number) => {
    setSelectedPlaybookId(id);
    setActiveTab("viewer");
  };

  const handleStartRun = (runId: number) => {
    setActiveRunId(runId);
    setActiveTab("runner");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#51AF3715", color: "#51AF37" }}>
                Stewardship Portal
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">5 Strategic Playbooks · PB-01 to PB-05</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Playbook Module
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Execute, track, and generate data quality playbooks across all governance domains.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="folders" className="gap-1.5 text-xs">
              <FolderOpen size={13} /> Folder Browser
            </TabsTrigger>
            <TabsTrigger value="viewer" className="gap-1.5 text-xs">
              <BookOpen size={13} /> Playbook Viewer
              {selectedPlaybookId && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />}
            </TabsTrigger>
            <TabsTrigger value="runner" className="gap-1.5 text-xs">
              <Play size={13} /> Step Runner
              {activeRunId && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}
            </TabsTrigger>
            <TabsTrigger value="kpis" className="gap-1.5 text-xs">
              <BarChart3 size={13} /> KPI Dashboard
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 text-xs">
              <Sparkles size={13} /> AI Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="folders">
            <FolderBrowserTab onSelectPlaybook={handleSelectPlaybook} />
          </TabsContent>

          <TabsContent value="viewer">
            <PlaybookViewerTab selectedPlaybookId={selectedPlaybookId} onStartRun={handleStartRun} />
          </TabsContent>

          <TabsContent value="runner">
            <StepRunnerTab activeRunId={activeRunId} />
          </TabsContent>

          <TabsContent value="kpis">
            <KpiDashboardTab selectedPlaybookId={selectedPlaybookId} />
          </TabsContent>

          <TabsContent value="ai">
            <AiGeneratorTab onPlaybookGenerated={() => setActiveTab("folders")} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
