// ============================================================
// BRL ANALYTICS — Business Readiness Level (100 Tasks)
// Three-matrix framework: TRL × BRL × VRL
// Tasks 1–75: Fundamentals & Kick-off (this platform)
// Tasks 76–100: Execution Platform (linked, not managed here)
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { ventures as VENTURES } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Rocket,
  Briefcase,
  Target,
  TrendingUp,
  Filter,
  BarChart3,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";


const VRL_STAGE_LABELS: Record<number, { label: string; description: string; color: string; bg: string }> = {
  1: { label: "Stage 1 — Idea", description: "Foundation & Validation Fundamentals", color: "#56A837", bg: "#56A83710" },
  2: { label: "Stage 2 — Validation", description: "Evidence & Commercial Proof", color: "#3B85BA", bg: "#3B85BA10" },
  3: { label: "Stage 3 — MVP / Kick-off", description: "Build & Launch Readiness", color: "#F69111", bg: "#F6911110" },
  4: { label: "Stage 4 — Scale / Go-to-Market", description: "Execution Platform Scope", color: "#8B5CF6", bg: "#8B5CF610" },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Legal & IP": "#EF4444",
  "Brand Identity": "#F97316",
  "Financial": "#EAB308",
  "Product": "#22C55E",
  "Team": "#3B82F6",
  "Market": "#8B5CF6",
  "Regulatory": "#EC4899",
  "Academic": "#06B6D4",
  "Operations": "#64748B",
  "Investor Relations": "#F59E0B",
  "B Corp & ESG": "#10B981",
  "Marketing & GTM": "#8B5CF6",
  "Sales & Distribution": "#6366F1",
  "Community & PR": "#14B8A6",
};

type BrlTask = {
  id: number;
  taskNumber: number;
  title: string;
  description: string | null;
  category: string;
  vrlStage: number;
  platformScope: string;
  weight: number | null;
  linkedModule: string | null;
  createdAt: Date;
  [key: string]: unknown;
};

type BrlCompletion = {
  taskId: number;
  completed: boolean;
  notes: string | null;
  evidenceUrl: string | null;
};

function StageProgressBar({ completed, total, color }: { completed: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-16 text-right">{completed}/{total} ({pct}%)</span>
    </div>
  );
}

function TaskRow({
  task,
  completion,
  onToggle,
  onViewDetails,
}: {
  task: BrlTask;
  completion?: BrlCompletion;
  onToggle: (taskId: number, completed: boolean) => void;
  onViewDetails: (task: BrlTask, completion?: BrlCompletion) => void;
}) {
  const isCompleted = completion?.completed ?? false;
  const isExecutionPlatform = task.platformScope === "Execution";
  const categoryColor = CATEGORY_COLORS[task.category] ?? "#6B7280";

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-gray-50/50 transition-colors group ${
        isCompleted ? "bg-green-50/30" : ""
      } ${isExecutionPlatform ? "opacity-70" : ""}`}
    >
      {/* Task number */}
      <span className="text-xs font-mono text-gray-400 w-8 mt-0.5 shrink-0">{task.taskNumber}</span>

      {/* Checkbox */}
      <div className="mt-0.5 shrink-0">
        {isExecutionPlatform ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <ExternalLink size={16} className="text-purple-400 mt-0.5" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Managed in Brand Execution Platform</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => onToggle(task.id, checked as boolean)}
            className="mt-0.5"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium ${isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}
          >
            {task.title}
          </span>
          {isExecutionPlatform && (
            <Badge
              variant="outline"
              className="text-xs border-purple-300 text-purple-600 bg-purple-50"
            >
              <Rocket size={10} className="mr-1" />
              Execution Platform
            </Badge>
          )}
          {task.linkedModule && !isExecutionPlatform && (
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 bg-blue-50">
              {task.linkedModule}
            </Badge>
          )}
          {isCompleted && completion?.evidenceUrl && (
            <a
              href={completion.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              <ExternalLink size={10} /> Evidence
            </a>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
        )}
        {completion?.notes && (
          <p className="text-xs text-gray-400 mt-0.5 italic">"{completion.notes}"</p>
        )}
      </div>

      {/* Category badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${categoryColor}15`, color: categoryColor }}
        >
          {task.category}
        </span>
        {!isExecutionPlatform && (
          <button
            onClick={() => onViewDetails(task, completion)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
          >
            <Info size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function BrlAnalytics() {
  const [selectedVenture, setSelectedVenture] = useState(VENTURES[0]?.id ?? "ecoblend");
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set([1, 2, 3]));
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all");
  const [detailTask, setDetailTask] = useState<BrlTask | null>(null);
  const [detailCompletion, setDetailCompletion] = useState<BrlCompletion | undefined>(undefined);
  const [detailNotes, setDetailNotes] = useState("");
  const [detailEvidence, setDetailEvidence] = useState("");

  const { data: tasks = [], isLoading: tasksLoading } = trpc.brl.listTasks.useQuery();
  const { data: completions = [], refetch: refetchCompletions } = trpc.brl.getCompletions.useQuery({ ventureId: selectedVenture });
  const { data: score } = trpc.brl.getScore.useQuery({ ventureId: selectedVenture });
  type PortfolioSummaryItem = { ventureId: string; ventureName: string; score: number; completedCount: number; totalCount: number };
  const { data: portfolioSummaryRaw } = trpc.brl.portfolioSummary.useQuery();
  const portfolioSummary: PortfolioSummaryItem[] = (portfolioSummaryRaw ?? []) as PortfolioSummaryItem[];

  const utils = trpc.useUtils();

  const toggleMutation = trpc.brl.toggleTask.useMutation({
    onSuccess: () => {
      utils.brl.getCompletions.invalidate({ ventureId: selectedVenture });
      utils.brl.getScore.invalidate({ ventureId: selectedVenture });
      utils.brl.portfolioSummary.invalidate();
    },
    onError: () => toast.error("Failed to update task"),
  });

  const completionMap = useMemo(() => {
    const map = new Map<number, BrlCompletion>();
    for (const c of completions) map.set(c.taskId, c);
    return map;
  }, [completions]);

  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category));
    return Array.from(cats).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (filterStatus === "completed" && !completionMap.get(t.id)?.completed) return false;
      if (filterStatus === "pending" && completionMap.get(t.id)?.completed) return false;
      return true;
    });
  }, [tasks, filterCategory, filterStatus, completionMap]);

  const tasksByStage = useMemo(() => {
    const byStage: Record<number, BrlTask[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const t of filteredTasks) {
      if (byStage[t.vrlStage]) byStage[t.vrlStage].push(t);
    }
    return byStage;
  }, [filteredTasks]);

  const stageStats = useMemo(() => {
    const stats: Record<number, { total: number; completed: number; weight: number; completedWeight: number }> = {};
    for (let s = 1; s <= 4; s++) {
      const stageTasks = tasks.filter(t => t.vrlStage === s);
      const completed = stageTasks.filter(t => completionMap.get(t.id)?.completed).length;
      const weight = stageTasks.reduce((sum, t) => sum + (t.weight ?? 1), 0);
      const completedWeight = stageTasks.filter(t => completionMap.get(t.id)?.completed).reduce((sum, t) => sum + (t.weight ?? 1), 0);
      stats[s] = { total: stageTasks.length, completed, weight, completedWeight };
    }
    return stats;
  }, [tasks, completionMap]);

  const handleToggle = (taskId: number, completed: boolean) => {
    toggleMutation.mutate({ ventureId: selectedVenture, taskId, completed });
  };

  const handleViewDetails = (task: BrlTask, completion?: BrlCompletion) => {
    setDetailTask(task);
    setDetailCompletion(completion);
    setDetailNotes(completion?.notes ?? "");
    setDetailEvidence(completion?.evidenceUrl ?? "");
  };

  const handleSaveDetail = () => {
    if (!detailTask) return;
    toggleMutation.mutate({
      ventureId: selectedVenture,
      taskId: detailTask.id,
      completed: detailCompletion?.completed ?? false,
      notes: detailNotes || undefined,
      evidenceUrl: detailEvidence || undefined,
    }, {
      onSuccess: () => {
        toast.success("Task details saved");
        setDetailTask(null);
        refetchCompletions();
      },
    });
  };

  const toggleStage = (stage: number) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  const venture = VENTURES.find(v => v.id === selectedVenture);
  const brlScore = score?.score ?? 0;
  const brlCompleted = score?.completedCount ?? 0;
  const brlTotal = score?.totalCount ?? 0;

  if (tasksLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading BRL tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-50 text-amber-600">
                Three-Matrix Framework
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">TRL × BRL × VRL</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Business Readiness Level
            </h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              100-task framework tracking business fundamentals and kick-off readiness across all VRL stages.
              Go-to-market and scaling tasks (Stage 4) are managed in the Brand Execution Platform.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedVenture} onValueChange={setSelectedVenture}>
              <SelectTrigger className="w-44 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENTURES.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* BRL Score + Stage Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* BRL Score card */}
          <div className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1">BRL Score</span>
            <span className="text-5xl font-bold text-amber-600" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {brlScore}%
            </span>
            <span className="text-xs text-gray-500 mt-1">{brlCompleted}/{brlTotal} tasks</span>
            <div className="w-full mt-3">
              <div className="w-full h-2 rounded-full bg-amber-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${brlScore}%` }} />
              </div>
            </div>
          </div>

          {/* Stage progress bars */}
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(stage => {
              const s = stageStats[stage];
              const meta = VRL_STAGE_LABELS[stage];
              const isExecution = stage === 4;
              return (
                <div key={stage} className={`rounded-xl border p-3 ${isExecution ? "border-purple-200 bg-purple-50/50" : "bg-white"}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    {isExecution ? (
                      <Rocket size={13} className="text-purple-500 shrink-0" />
                    ) : (
                      <Briefcase size={13} style={{ color: meta.color }} className="shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-700 truncate">{meta.label}</span>
                  </div>
                  <StageProgressBar completed={s.completed} total={s.total} color={isExecution ? "#8B5CF6" : meta.color} />
                  {isExecution && (
                    <p className="text-xs text-purple-500 mt-1.5 flex items-center gap-1">
                      <ExternalLink size={10} /> Brand Execution Platform
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Portfolio BRL Summary */}
      {portfolioSummary.length > 0 && (
        <div className="px-8 py-4 bg-white border-b">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-gray-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Portfolio BRL Overview</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {portfolioSummary.map(v => (
              <div
                key={v.ventureId}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all shrink-0 ${
                  v.ventureId === selectedVenture ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedVenture(v.ventureId)}
              >
                <span className="text-sm font-medium text-gray-700">{v.ventureName}</span>
                <span className="text-sm font-bold text-amber-600">{v.score}%</span>
                <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${v.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-8 py-3 bg-white border-b flex items-center gap-3">
        <Filter size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500">Filter:</span>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 h-7 text-xs">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as "all" | "completed" | "pending")}>
          <SelectTrigger className="w-32 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tasks</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-400 ml-auto">
          Showing {filteredTasks.length} of {tasks.length} tasks for <strong>{venture?.name}</strong>
        </span>
      </div>

      {/* Task Register by Stage */}
      <div className="px-8 py-6 space-y-4">
        {[1, 2, 3, 4].map(stage => {
          const stageTasks = tasksByStage[stage] ?? [];
          const meta = VRL_STAGE_LABELS[stage];
          const stats = stageStats[stage];
          const isExpanded = expandedStages.has(stage);
          const isExecution = stage === 4;

          if (stageTasks.length === 0 && filterCategory !== "all") return null;

          return (
            <div key={stage} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isExecution ? "border-purple-200" : ""}`}>
              {/* Stage header */}
              <button
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
                onClick={() => toggleStage(stage)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: isExecution ? "#8B5CF6" : meta.color }}
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                        {meta.label}
                      </span>
                      {isExecution && (
                        <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 bg-purple-50">
                          <Rocket size={10} className="mr-1" />
                          Execution Platform
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{meta.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color: isExecution ? "#8B5CF6" : meta.color }}>
                      {stats.completed}/{stats.total}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">tasks</span>
                  </div>
                  <div className="w-24">
                    <StageProgressBar
                      completed={stats.completed}
                      total={stats.total}
                      color={isExecution ? "#8B5CF6" : meta.color}
                    />
                  </div>
                </div>
              </button>

              {/* Execution Platform notice */}
              {isExpanded && isExecution && (
                <div className="mx-6 mb-4 p-3 rounded-lg bg-purple-50 border border-purple-200 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-purple-700">Brand Execution Platform Scope</p>
                    <p className="text-xs text-purple-600 mt-0.5">
                      These tasks are managed in the independent Brand Execution Platform dashboards (BEBUS, TONE, REAL, PIPE, EcoBlend brand).
                      They are visible here for portfolio oversight but are not tracked on this platform.
                    </p>
                  </div>
                </div>
              )}

              {/* Task rows */}
              {isExpanded && stageTasks.length > 0 && (
                <div className="border-t">
                  {stageTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      completion={completionMap.get(task.id)}
                      onToggle={handleToggle}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}

              {isExpanded && stageTasks.length === 0 && (
                <div className="border-t px-6 py-4 text-center text-sm text-gray-400">
                  No tasks match the current filter
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!detailTask} onOpenChange={() => setDetailTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400">#{detailTask?.taskNumber}</span>
              {detailTask?.title}
            </DialogTitle>
          </DialogHeader>
          {detailTask && (
            <div className="space-y-4">
              {detailTask.description && (
                <p className="text-sm text-gray-600">{detailTask.description}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" style={{ borderColor: CATEGORY_COLORS[detailTask.category], color: CATEGORY_COLORS[detailTask.category] }}>
                  {detailTask.category}
                </Badge>
                <Badge variant="outline" className="text-gray-500">
                  VRL Stage {detailTask.vrlStage}
                </Badge>
                {detailTask.linkedModule && (
                  <Badge variant="outline" className="border-blue-300 text-blue-600">
                    Linked: {detailTask.linkedModule}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">Notes</label>
                <Textarea
                  value={detailNotes}
                  onChange={e => setDetailNotes(e.target.value)}
                  placeholder="Add notes about this task..."
                  rows={3}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">Evidence URL</label>
                <Input
                  value={detailEvidence}
                  onChange={e => setDetailEvidence(e.target.value)}
                  placeholder="https://..."
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTask(null)}>Cancel</Button>
            <Button onClick={handleSaveDetail} style={{ background: "#F69111" }}>Save Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
