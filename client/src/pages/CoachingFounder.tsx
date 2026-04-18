/**
 * COACHING MODULE V2 — Founder Dashboard
 * Architecture: BEBUS-COACH-V2-001 Phase 1 + 2 UI
 *
 * Shows: Weekly task list, PRL ring gauge (RAG), trend arrow,
 *        coach feedback, 12-week PRL chart, AI risk alerts
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import CoachingOnboardingModal from "@/components/CoachingOnboardingModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle,
  Clock, AlertTriangle, Brain, Target, ChevronDown, Plus, Loader2,
  Bell, FileText, X, ClipboardList, BarChart3, Library, Star,
  Trophy, CalendarPlus, BellRing, CheckCheck, Flag, Crosshair
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { format, startOfWeek } from "date-fns";

// ── Helpers ──────────────────────────────────────────────────────────────────

const FOUNDER_ID = 1; // TODO: replace with useAuth().user?.founderId when available

function getRagColor(riskLevel: string | null): string {
  if (riskLevel === "HIGH") return "#ef4444";
  if (riskLevel === "MEDIUM") return "#f59e0b";
  return "#22c55e";
}

function getRagLabel(riskLevel: string | null): string {
  if (riskLevel === "HIGH") return "HIGH RISK";
  if (riskLevel === "MEDIUM") return "MEDIUM RISK";
  if (riskLevel === "LOW") return "ON TRACK";
  return "NO DATA";
}

function TrendIcon({ trend }: { trend: string | null }) {
  if (trend === "improving") return <TrendingUp className="w-5 h-5 text-green-500" />;
  if (trend === "declining") return <TrendingDown className="w-5 h-5 text-red-500" />;
  return <Minus className="w-5 h-5 text-amber-500" />;
}

function PrlRingGauge({ score, riskLevel }: { score: number; riskLevel: string | null }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getRagColor(riskLevel);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-white">{Math.round(score)}</span>
        <span className="text-xs font-semibold" style={{ color }}>PRL</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "Pending", color: "bg-slate-700 text-slate-300", icon: <Clock className="w-3 h-3" /> },
    complete: { label: "Complete", color: "bg-green-900 text-green-300", icon: <CheckCircle2 className="w-3 h-3" /> },
    missed: { label: "Missed", color: "bg-red-900 text-red-300", icon: <XCircle className="w-3 h-3" /> },
    delayed: { label: "Delayed", color: "bg-amber-900 text-amber-300", icon: <AlertTriangle className="w-3 h-3" /> },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.icon} {s.label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CoachingFounder() {
  const currentWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const [newTask, setNewTask] = useState("");
  const [newMetric, setNewMetric] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Sprint 80: PRL Trend Alerts
  const { data: alertSummary, refetch: refetchAlerts } = trpc.coaching.alerts.summary.useQuery();
  const acknowledgeAlert = trpc.coaching.alerts.acknowledge.useMutation({
    onSuccess: () => { refetchAlerts(); toast.success("Alert acknowledged"); },
  });

  // Sprint 81: Progress Report generation
  const generateReport = trpc.coaching.progressReports.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Progress report generated — opening in new tab");
      // Fetch the HTML and open in new tab
      window.open(`/api/trpc/coaching.progressReports.getHtml?input=${encodeURIComponent(JSON.stringify({ id: data.id }))}`, "_blank");
    },
    onError: () => toast.error("Failed to generate progress report"),
  });

  const utils = trpc.useUtils();

  // Check if this founder has completed onboarding
  const { data: onboardingState } = trpc.coaching.onboarding.getState.useQuery(
    { founderId: String(FOUNDER_ID) },
    { retry: false }
  );

  useEffect(() => {
    if (onboardingState !== undefined && !onboardingState?.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [onboardingState]);

  const { data: dashboard, isLoading } = trpc.coaching.dashboard.founderDashboard.useQuery(
    { founderId: FOUNDER_ID },
    { refetchInterval: 30_000 }
  );

  const createCommitment = trpc.coaching.commitments.create.useMutation({
    onSuccess: () => {
      utils.coaching.dashboard.founderDashboard.invalidate();
      setNewTask("");
      setNewMetric("");
      setShowAddTask(false);
      toast.success("Commitment added");
    },
    onError: () => toast.error("Failed to add commitment"),
  });

  const updateStatus = trpc.coaching.commitments.updateStatus.useMutation({
    onSuccess: () => {
      utils.coaching.dashboard.founderDashboard.invalidate();
      toast.success("Status updated — PRL recalculated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  // Sprint 86: Self-Assessment Portal
  const [showSelfAssessment, setShowSelfAssessment] = useState(false);
  const [selfScores, setSelfScores] = useState({
    strategicClarity: 50,
    marketValidation: 50,
    teamCapability: 50,
    operationalExecution: 50,
    investorPreparedness: 50,
  });
  const [selfNotes, setSelfNotes] = useState("");
  const submitSelfAssessment = trpc.coaching.selfAssessment.submit.useMutation({
    onSuccess: (data) => {
      toast.success(`Self-assessment submitted — composite score: ${data.compositeScore.toFixed(1)}`);
      setShowSelfAssessment(false);
      setSelfNotes("");
      setSelfScores({ strategicClarity: 50, marketValidation: 50, teamCapability: 50, operationalExecution: 50, investorPreparedness: 50 });
    },
    onError: () => toast.error("Failed to submit self-assessment"),
  });
  const { data: myAssessments } = trpc.coaching.selfAssessment.list.useQuery({ founderId: FOUNDER_ID, limit: 3 });

  // Sprint 87: Cohort Benchmarking
  const { data: benchmarkData } = trpc.coaching.cohortBenchmark.get.useQuery(
    { founderId: FOUNDER_ID, vrlStage: 1, weeks: 6 },
    { retry: false }
  );

  // Sprint 88: Commitment Template Library
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const { data: templates } = trpc.coaching.commitmentTemplates.list.useQuery(
    { limit: 20 },
    { enabled: showTemplates }
  );
  const { data: searchResults } = trpc.coaching.commitmentTemplates.search.useQuery(
    { query: templateSearch, limit: 10 },
    { enabled: templateSearch.length >= 2 }
  );
  const applyTemplate = trpc.coaching.commitmentTemplates.applyToFounder.useMutation({
    onSuccess: (data) => {
      toast.success(`"${data.templateTitle}" added as a commitment`);
      utils.coaching.dashboard.founderDashboard.invalidate();
    },
    onError: () => toast.error("Failed to apply template"),
  });
  const seedTemplates = trpc.coaching.commitmentTemplates.seed.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: () => toast.error("Failed to seed templates"),
  });

  const generateInsights = trpc.coaching.insights.generate.useMutation({
    onSuccess: () => {
      utils.coaching.dashboard.founderDashboard.invalidate();
      toast.success("AI insights generated");
    },
    onError: () => toast.error("Failed to generate insights"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
      </div>
    );
  }

  const prl = dashboard?.currentPrl;
  const frlScore = prl ? parseFloat(prl.score as unknown as string) : 0;
  const ragColor = getRagColor(prl?.riskLevel || null);

  const chartData = (dashboard?.prlHistory || [])
    .slice()
    .reverse()
    .map((p) => ({
      week: format(new Date(p.week as unknown as string), "dd MMM"),
      prl: parseFloat(p.score as unknown as string),
    }));

  const insight = dashboard?.latestInsight;
  const risks: string[] = (insight?.risks as string[]) || [];
  const recommendations: string[] = (insight?.recommendations as string[]) || [];
  const patterns: string[] = (insight?.patterns as string[]) || [];

  const completedCount = dashboard?.weekCommitments.filter(
    (c) => c.status === "complete" && c.coachVerified
  ).length || 0;
  const totalCount = dashboard?.weekCommitments.length || 0;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Execution Discipline Engine</h1>
          <p className="text-sm text-slate-400 mt-1">
            Week of {format(new Date(currentWeek), "dd MMMM yyyy")} · BEBUS-COACH-V2-001
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-emerald-500 text-emerald-300 hover:bg-emerald-900/30"
            onClick={() => setShowSelfAssessment(!showSelfAssessment)}
          >
            <ClipboardList className="w-4 h-4" />
            Self-Assess
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-cyan-500 text-cyan-300 hover:bg-cyan-900/30"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <Library className="w-4 h-4" />
            Templates
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-blue-500 text-blue-300 hover:bg-blue-900/30"
            onClick={() => generateReport.mutate({ founderId: FOUNDER_ID, periodWeeks: 4 })}
            disabled={generateReport.isPending}
          >
            {generateReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Progress Report
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-purple-500 text-purple-300 hover:bg-purple-900/30"
            onClick={() => generateInsights.mutate({ founderId: FOUNDER_ID, week: currentWeek })}
            disabled={generateInsights.isPending}
          >
            {generateInsights.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            Generate AI Insights
          </Button>
        </div>
      </div>

      {/* Sprint 80: PRL Trend Alert Banners */}
      {alertSummary && alertSummary.alerts.filter((a) => !dismissedAlerts.has(a.id)).length > 0 && (
        <div className="space-y-2">
          {alertSummary.alerts.filter((a) => !dismissedAlerts.has(a.id)).slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${
                alert.severity === "critical"
                  ? "bg-red-950/60 border-red-700 text-red-200"
                  : alert.severity === "warning"
                  ? "bg-amber-950/60 border-amber-700 text-amber-200"
                  : "bg-blue-950/60 border-blue-700 text-blue-200"
              }`}
            >
              <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold capitalize mr-2">
                  {alert.alertType.replace("_", " ").toUpperCase()}
                </span>
                {alert.message}
              </div>
              <button
                onClick={() => {
                  acknowledgeAlert.mutate({ id: alert.id, acknowledgedBy: "founder" });
                  setDismissedAlerts((prev) => new Set([...prev, alert.id]));
                }}
                className="flex-shrink-0 opacity-60 hover:opacity-100"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Top row: PRL gauge + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* PRL Ring */}
        <Card className="bg-slate-900 border-slate-700 lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center gap-3">
            <PrlRingGauge score={frlScore} riskLevel={prl?.riskLevel || null} />
            <div className="flex items-center gap-2">
              <TrendIcon trend={prl?.trend || null} />
              <span
                className="text-sm font-bold tracking-wider"
                style={{ color: ragColor }}
              >
                {getRagLabel(prl?.riskLevel || null)}
              </span>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Founder Readiness Level
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "This Week", value: `${completedCount}/${totalCount}`, sub: "commitments done", color: "#22c55e" },
            { label: "Completion Rate", value: `${completionRate}%`, sub: "coach-verified", color: "#3b82f6" },
            { label: "FRL Score", value: frlScore.toFixed(1), sub: prl?.trend || "no data", color: ragColor },
            { label: "Sessions", value: String(dashboard?.recentSessions.length || 0), sub: "recent sessions", color: "#a78bfa" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-slate-900 border-slate-700">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main content: commitments + chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Weekly Commitments */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-green-400" />
                Weekly Commitments
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-green-400 hover:text-green-300 gap-1 text-xs"
                onClick={() => setShowAddTask(!showAddTask)}
              >
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddTask && (
              <div className="bg-slate-800 rounded-lg p-3 space-y-2 border border-slate-600">
                <Textarea
                  placeholder="Commitment / task description..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-sm min-h-[60px]"
                />
                <input
                  type="text"
                  placeholder="Measurable success indicator (optional)"
                  value={newMetric}
                  onChange={(e) => setNewMetric(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white placeholder-slate-400"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                    disabled={!newTask.trim() || createCommitment.isPending}
                    onClick={() =>
                      createCommitment.mutate({
                        founderId: FOUNDER_ID,
                        week: currentWeek,
                        task: newTask.trim(),
                        metric: newMetric.trim() || undefined,
                      })
                    }
                  >
                    {createCommitment.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowAddTask(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {dashboard?.weekCommitments.length === 0 && !showAddTask && (
              <div className="text-center py-8 text-slate-500 text-sm">
                No commitments this week. Add your first task above.
              </div>
            )}

            {dashboard?.weekCommitments.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-snug">{c.task}</p>
                  {c.metric && (
                    <p className="text-xs text-slate-400 mt-0.5">✓ {c.metric}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={c.status} />
                    {c.coachVerified && (
                      <span className="text-xs text-green-400">Coach verified</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {c.status !== "complete" && (
                    <button
                      className="text-xs text-green-400 hover:text-green-300 whitespace-nowrap"
                      onClick={() => updateStatus.mutate({ id: c.id, status: "complete" })}
                    >
                      Mark done
                    </button>
                  )}
                  {c.status === "pending" && (
                    <button
                      className="text-xs text-amber-400 hover:text-amber-300 whitespace-nowrap"
                      onClick={() => updateStatus.mutate({ id: c.id, status: "delayed" })}
                    >
                      Mark delayed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 12-Week PRL Chart */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">12-Week PRL History</CardTitle>
            <p className="text-xs text-slate-400">
              GREEN ≥ 70 · AMBER 40–69 · RED &lt; 40
            </p>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                No PRL history yet. Complete commitments to generate scores.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#22c55e" }}
                  />
                  <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "LOW", fill: "#22c55e", fontSize: 10 }} />
                  <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "MED", fill: "#f59e0b", fontSize: 10 }} />
                  <Line
                    type="monotone" dataKey="prl"
                    stroke="#3b82f6" strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {insight && insight.status === "generated" && (
        <Card className="bg-slate-900 border-purple-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                AI Coaching Insights
                <Badge className="bg-purple-900 text-purple-300 text-xs">
                  Week of {format(new Date(insight.week as unknown as string), "dd MMM")}
                </Badge>
              </CardTitle>
              <button
                className="text-slate-400 hover:text-white"
                onClick={() => setExpandedInsight(!expandedInsight)}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedInsight ? "rotate-180" : ""}`} />
              </button>
            </div>
          </CardHeader>
          {expandedInsight && (
            <CardContent className="space-y-4">
              {risks.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Risks</h4>
                  <ul className="space-y-1">
                    {risks.map((r, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-red-400 mt-0.5">▸</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {patterns.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Patterns</h4>
                  <ul className="space-y-1">
                    {patterns.map((p, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-amber-400 mt-0.5">▸</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recommendations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-green-400 mt-0.5">▸</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Recent Sessions */}
      {dashboard?.recentSessions && dashboard.recentSessions.length > 0 && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Recent Coaching Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.recentSessions.map((s) => (
                <div key={s.id} className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {format(new Date(s.sessionDate as unknown as string), "dd MMM yyyy")}
                    </span>
                    <Badge className="bg-slate-700 text-slate-300 text-xs capitalize">
                      {s.sessionType?.replace("_", " ")}
                    </Badge>
                  </div>
                  {s.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2">{s.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sprint 86: Self-Assessment Panel */}
      {showSelfAssessment && (
        <Card className="bg-slate-900 border-emerald-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-400" />
                Weekly Self-Assessment
              </CardTitle>
              <button onClick={() => setShowSelfAssessment(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>
            <p className="text-xs text-slate-400">Rate yourself 0–100 on each dimension. Your coach will review and approve.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {([
              { key: "strategicClarity", label: "Strategic Clarity", desc: "Vision, direction, and decision-making clarity" },
              { key: "marketValidation", label: "Market Validation", desc: "Customer evidence and demand confirmation" },
              { key: "teamCapability", label: "Team Capability", desc: "Team skills, alignment, and execution capacity" },
              { key: "operationalExecution", label: "Operational Execution", desc: "Process discipline and delivery consistency" },
              { key: "investorPreparedness", label: "Investor Preparedness", desc: "Pitch readiness, data room, and narrative" },
            ] as const).map(({ key, label, desc }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-medium text-white">{label}</span>
                    <span className="text-xs text-slate-500 ml-2">{desc}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 w-8 text-right">{selfScores[key]}</span>
                </div>
                <input
                  type="range" min={0} max={100} step={5}
                  value={selfScores[key]}
                  onChange={(e) => setSelfScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Notes for your coach (optional)</label>
              <Textarea
                value={selfNotes}
                onChange={(e) => setSelfNotes(e.target.value)}
                placeholder="What went well? What blockers are you facing?"
                className="bg-slate-800 border-slate-600 text-white text-sm resize-none"
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Composite preview: <span className="text-emerald-400 font-bold">
                  {(selfScores.strategicClarity * 0.20 + selfScores.marketValidation * 0.25 +
                    selfScores.teamCapability * 0.20 + selfScores.operationalExecution * 0.20 +
                    selfScores.investorPreparedness * 0.15).toFixed(1)}
                </span>
              </div>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={() => submitSelfAssessment.mutate({ founderId: FOUNDER_ID, ...selfScores, founderNotes: selfNotes || undefined })}
                disabled={submitSelfAssessment.isPending}
              >
                {submitSelfAssessment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit for Review"}
              </Button>
            </div>
            {myAssessments && myAssessments.length > 0 && (
              <div className="border-t border-slate-700 pt-3">
                <p className="text-xs text-slate-400 mb-2">Recent submissions</p>
                <div className="space-y-1">
                  {myAssessments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{a.weekOf as unknown as string}</span>
                      <span className="text-white font-medium">{parseFloat(a.compositeScore as unknown as string).toFixed(1)}</span>
                      <Badge className={`text-xs ${
                        a.status === "approved" ? "bg-green-900 text-green-300" :
                        a.status === "rejected" ? "bg-red-900 text-red-300" :
                        "bg-slate-700 text-slate-300"
                      }`}>{a.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sprint 87: Cohort Benchmarking */}
      {benchmarkData && benchmarkData.founderTrend.length > 0 && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Cohort Benchmark
            </CardTitle>
            <p className="text-xs text-slate-400">
              Your PRL vs cohort average — {benchmarkData.cohortStats.sampleSize} founders at VRL Stage {benchmarkData.cohortStats.vrlStage}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={benchmarkData.founderTrend.map((f, i) => ({
                week: f.week,
                yourPrl: f.score,
                cohortAvg: benchmarkData.cohortAverages[i]?.cohortAvg ?? null,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="4 2" label={{ value: "Target", fill: "#22c55e", fontSize: 10 }} />
                <Line type="monotone" dataKey="yourPrl" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 3 }} name="Your PRL" />
                <Line type="monotone" dataKey="cohortAvg" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Cohort Avg" />
              </LineChart>
            </ResponsiveContainer>
            {benchmarkData.cohortStats.median !== null && (
              <div className="flex gap-4 mt-3 text-xs text-slate-400">
                <span>Cohort median: <span className="text-white font-medium">{benchmarkData.cohortStats.median?.toFixed(1)}</span></span>
                <span>Cohort min: <span className="text-white font-medium">{benchmarkData.cohortStats.min?.toFixed(1)}</span></span>
                <span>Cohort max: <span className="text-white font-medium">{benchmarkData.cohortStats.max?.toFixed(1)}</span></span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sprint 88: Commitment Template Library */}
      {showTemplates && (
        <Card className="bg-slate-900 border-cyan-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Library className="w-4 h-4 text-cyan-400" />
                Commitment Template Library
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-slate-600 text-slate-400"
                  onClick={() => seedTemplates.mutate({ force: false })}
                  disabled={seedTemplates.isPending}
                >
                  {seedTemplates.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Seed Defaults"}
                </Button>
                <button onClick={() => setShowTemplates(false)}>
                  <X className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="text"
              placeholder="Search templates..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(templateSearch.length >= 2 ? searchResults : templates)?.map((tmpl) => (
                <div key={tmpl.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-700 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white truncate">{tmpl.title}</span>
                      <Badge className={`text-xs shrink-0 ${
                        tmpl.priority === "critical" ? "bg-red-900 text-red-300" :
                        tmpl.priority === "high" ? "bg-amber-900 text-amber-300" :
                        tmpl.priority === "medium" ? "bg-blue-900 text-blue-300" :
                        "bg-slate-700 text-slate-300"
                      }`}>{tmpl.priority}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>VRL {tmpl.vrlStage}</span>
                      {tmpl.category && <span className="capitalize">{tmpl.category.replace("_", " ")}</span>}
                      <span>{tmpl.durationDays}d</span>
                      {tmpl.usageCount > 0 && (
                        <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />{tmpl.usageCount}</span>
                      )}
                    </div>
                    {tmpl.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tmpl.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 bg-cyan-700 hover:bg-cyan-600 text-white text-xs"
                    onClick={() => applyTemplate.mutate({ templateId: tmpl.id, founderId: FOUNDER_ID })}
                    disabled={applyTemplate.isPending}
                  >
                    Apply
                  </Button>
                </div>
              ))}
              {(templateSearch.length >= 2 ? searchResults : templates)?.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  {templateSearch.length >= 2 ? "No templates match your search" : "No templates yet. Click \"Seed Defaults\" to load the library."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sprint 89: Founder Leaderboard */}
      <FounderLeaderboardCard />

      {/* Sprint 90: Session Booking */}
      <SessionBookingCard />

      {/* Sprint 92: Notification Centre */}
      <NotificationCentreCard />

      {/* Sprint 94: FRL Goal Progress */}
      <FrlGoalCard />

      {/* Onboarding Modal — shown on first login if onboarding not yet complete */}
      <CoachingOnboardingModal
        founderId={String(FOUNDER_ID)}
        founderName="Founder"
        open={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          utils.coaching.onboarding.getState.invalidate();
        }}
      />
    </div>
  );
}

// ── Sprint 89: Founder Leaderboard Card ───────────────────────────────────────────

function FounderLeaderboardCard() {
  const [vrlStage, setVrlStage] = useState(1);
  const [alias, setAlias] = useState("");
  const [showOptIn, setShowOptIn] = useState(false);

  const { data: leaderboard = [], refetch: refetchBoard } = trpc.coaching.founderLeaderboard.get.useQuery({ vrlStage, limit: 10 });
  const { data: myRank, refetch: refetchRank } = trpc.coaching.founderLeaderboard.myRank.useQuery({ ventureId: "ecoblend" }, { retry: false });
  const compute = trpc.coaching.founderLeaderboard.compute.useMutation({
    onSuccess: (d) => { toast.success(`Leaderboard updated — ${d.cohortSize} founders ranked`); refetchBoard(); refetchRank(); },
    onError: () => toast.error("Failed to compute leaderboard"),
  });
  const optIn = trpc.coaching.founderLeaderboard.optIn.useMutation({
    onSuccess: (d) => { toast.success(`Opted in as "${d.alias}"`); setShowOptIn(false); refetchRank(); },
    onError: () => toast.error("Failed to opt in"),
  });
  const optOut = trpc.coaching.founderLeaderboard.optOut.useMutation({
    onSuccess: () => { toast.success("Opted out of leaderboard"); refetchRank(); },
    onError: () => toast.error("Failed to opt out"),
  });

  return (
    <Card className="bg-slate-900 border-yellow-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Cohort Leaderboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={vrlStage}
              onChange={(e) => setVrlStage(Number(e.target.value))}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none"
            >
              {[1,2,3,4,5,6,7,8,9].map((v) => <option key={v} value={v}>VRL {v}</option>)}
            </select>
            <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 text-xs" onClick={() => compute.mutate({ vrlStage })} disabled={compute.isPending}>
              {compute.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
            </Button>
            {myRank?.isOptedIn ? (
              <Button size="sm" variant="outline" className="border-red-700 text-red-400 text-xs" onClick={() => optOut.mutate({ ventureId: "ecoblend" })} disabled={optOut.isPending}>Opt Out</Button>
            ) : (
              <Button size="sm" className="bg-yellow-700 hover:bg-yellow-600 text-white text-xs" onClick={() => setShowOptIn(true)}>Join Leaderboard</Button>
            )}
          </div>
        </div>
        {showOptIn && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text" placeholder="Your display alias (e.g. GreenFounder7)" value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="flex-1 bg-slate-800 border border-yellow-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <Button size="sm" className="bg-yellow-700 hover:bg-yellow-600 text-white text-xs" onClick={() => optIn.mutate({ ventureId: "ecoblend", displayAlias: alias })} disabled={!alias || optIn.isPending}>Confirm</Button>
            <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 text-xs" onClick={() => setShowOptIn(false)}>Cancel</Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {myRank && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-950/30 border border-yellow-700 flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wider">Your Rank</p>
              <p className="text-2xl font-bold text-white">#{myRank.rank} <span className="text-sm text-slate-400">of {myRank.cohortSize}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Percentile</p>
              <p className="text-xl font-bold text-yellow-400">{parseFloat(myRank.percentile as unknown as string).toFixed(0)}th</p>
            </div>
          </div>
        )}
        {leaderboard.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No leaderboard data yet. Click "Refresh" to compute rankings.</p>
        ) : (
          <div className="space-y-1">
            {leaderboard.map((entry) => (
              <div key={entry.rank} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                entry.rank === 1 ? "bg-yellow-950/40 border border-yellow-700" :
                entry.rank === 2 ? "bg-slate-800/60 border border-slate-600" :
                entry.rank === 3 ? "bg-amber-950/30 border border-amber-800" :
                "bg-slate-800/30"
              }`}>
                <span className={`text-sm font-bold w-6 text-center ${
                  entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-slate-300" : entry.rank === 3 ? "text-amber-500" : "text-slate-500"
                }`}>#{entry.rank}</span>
                <span className="flex-1 text-sm text-white">{entry.displayName}</span>
                {entry.frlScore !== null && (
                  <span className="text-sm font-mono text-green-400">{entry.frlScore.toFixed(1)}</span>
                )}
                <span className="text-xs text-slate-500">{entry.percentile.toFixed(0)}th pct</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Sprint 90: Session Booking Card ──────────────────────────────────────────────

function SessionBookingCard() {
  const [showForm, setShowForm] = useState(false);
  const [coachId, setCoachId] = useState("");
  const [sessionType, setSessionType] = useState<"prl_review" | "commitment_check" | "strategy" | "wellbeing" | "ad_hoc">("prl_review");
  const [preferredDate, setPreferredDate] = useState("");
  const [founderNotes, setFounderNotes] = useState("");

  const { data: coaches = [] } = trpc.coaching.coaches.list.useQuery();
  const { data: myRequests = [], refetch } = trpc.coaching.sessionRequests.list.useQuery({ role: "founder" });
  const createRequest = trpc.coaching.sessionRequests.create.useMutation({
    onSuccess: () => {
      toast.success("Session request sent to your coach");
      setShowForm(false); setCoachId(""); setPreferredDate(""); setFounderNotes("");
      refetch();
    },
    onError: () => toast.error("Failed to send session request"),
  });
  const cancelRequest = trpc.coaching.sessionRequests.cancel.useMutation({
    onSuccess: () => { toast.success("Request cancelled"); refetch(); },
    onError: () => toast.error("Failed to cancel"),
  });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-900 text-amber-300",
    confirmed: "bg-green-900 text-green-300",
    rescheduled: "bg-blue-900 text-blue-300",
    cancelled: "bg-slate-700 text-slate-400",
    completed: "bg-purple-900 text-purple-300",
  };

  return (
    <Card className="bg-slate-900 border-blue-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-blue-400" />
            Session Scheduler
          </CardTitle>
          <Button size="sm" className="bg-blue-700 hover:bg-blue-600 text-white text-xs" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="w-3 h-3 mr-1" /> : <CalendarPlus className="w-3 h-3 mr-1" />}
            {showForm ? "Cancel" : "Request Session"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-4 p-4 rounded-lg bg-blue-950/20 border border-blue-700 space-y-3">
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">New Session Request</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Coach</label>
                <select value={coachId} onChange={(e) => setCoachId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none">
                  <option value="">Select coach...</option>
                  {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Session Type</label>
                <select value={sessionType} onChange={(e) => setSessionType(e.target.value as typeof sessionType)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none">
                  {["prl_review","commitment_check","strategy","wellbeing","ad_hoc"].map((t) => (
                    <option key={t} value={t}>{t.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Preferred Date</label>
                <input type="datetime-local" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                <input type="text" value={founderNotes} onChange={(e) => setFounderNotes(e.target.value)}
                  placeholder="What do you want to focus on?" className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none" />
              </div>
            </div>
            <Button size="sm" className="bg-blue-700 hover:bg-blue-600 text-white text-xs"
              onClick={() => createRequest.mutate({ coachId, ventureId: "ecoblend", sessionType, preferredDate: preferredDate || undefined, founderNotes: founderNotes || undefined })}
              disabled={!coachId || createRequest.isPending}>
              {createRequest.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CalendarPlus className="w-3 h-3 mr-1" />}
              Send Request
            </Button>
          </div>
        )}
        {myRequests.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No session requests yet. Click "Request Session" to book time with your coach.</p>
        ) : (
          <div className="space-y-2">
            {myRequests.map((req) => (
              <div key={req.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[req.status] ?? "bg-slate-700 text-slate-400"}`}>
                      {req.status}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{req.sessionType.replace("_", " ")}</span>
                  </div>
                  {req.confirmedDate && (
                    <p className="text-xs text-green-400">Confirmed: {new Date(req.confirmedDate).toLocaleString()}</p>
                  )}
                  {req.meetingLink && (
                    <a href={req.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline">Join meeting</a>
                  )}
                  {req.coachNotes && <p className="text-xs text-slate-400 italic mt-1">{req.coachNotes}</p>}
                </div>
                {req.status === "pending" && (
                  <button onClick={() => cancelRequest.mutate({ requestId: req.id })} className="text-slate-500 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Sprint 92: Notification Centre Card ──────────────────────────────────────

function NotificationCentreCard() {
  const VENTURE_ID = "ecoblend";
  const FOUNDER_ID_STR = String(1);

  const { data: notifications, refetch } = trpc.coaching.notifications.list.useQuery(
    { ventureId: VENTURE_ID, founderId: FOUNDER_ID_STR, limit: 20 },
    { retry: false }
  );
  const { data: unreadData } = trpc.coaching.notifications.unreadCount.useQuery(
    { ventureId: VENTURE_ID, founderId: FOUNDER_ID_STR },
    { retry: false, refetchInterval: 30_000 }
  );

  const markRead = trpc.coaching.notifications.markRead.useMutation({
    onSuccess: () => refetch(),
  });
  const markAllRead = trpc.coaching.notifications.markAllRead.useMutation({
    onSuccess: () => { refetch(); toast.success("All notifications marked as read"); },
  });

  const unreadCount = unreadData?.count ?? 0;

  const typeColor: Record<string, string> = {
    alert_acknowledged: "text-amber-400",
    session_confirmed: "text-green-400",
    session_rescheduled: "text-blue-400",
    session_declined: "text-red-400",
    self_assessment_approved: "text-emerald-400",
    self_assessment_rejected: "text-rose-400",
    leaderboard_rank_change: "text-purple-400",
    commitment_due: "text-orange-400",
    frl_score_updated: "text-cyan-400",
    goal_updated: "text-indigo-400",
    general: "text-slate-400",
  };

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-400" />
            Notification Centre
            {unreadCount > 0 && (
              <span className="bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-slate-400 hover:text-white gap-1"
              onClick={() => markAllRead.mutate({ ventureId: VENTURE_ID, founderId: FOUNDER_ID_STR })}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!notifications || notifications.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No notifications yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  n.isRead
                    ? "bg-slate-800/40 border-slate-700/50 opacity-60"
                    : "bg-slate-800 border-slate-600 hover:border-slate-500"
                }`}
                onClick={() => { if (!n.isRead) markRead.mutate({ id: n.id }); }}
              >
                <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${typeColor[n.type] ?? "text-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${n.isRead ? "text-slate-400" : "text-white"}`}>{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{n.body}</p>
                  <p className="text-xs text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Sprint 94: FRL Goal Progress Card ────────────────────────────────────────

function FrlGoalCard() {
  const VENTURE_ID = "ecoblend";
  const FOUNDER_ID_STR = String(1);

  const { data: goal, refetch } = trpc.coaching.goals.get.useQuery(
    { ventureId: VENTURE_ID, founderId: FOUNDER_ID_STR },
    { retry: false }
  );

  if (!goal) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-indigo-400" />
            FRL Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 text-center py-4">
            No active FRL goal set. Ask your coach to set a target score and deadline.
          </p>
        </CardContent>
      </Card>
    );
  }

  const progress = goal.progressPercent ? parseFloat(goal.progressPercent as unknown as string) : 0;
  const daysLeft = Math.ceil((new Date(goal.targetDate as unknown as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;
  const statusColor = goal.status === "achieved" ? "text-green-400" : isOverdue ? "text-red-400" : "text-indigo-400";

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-indigo-400" />
          FRL Goal
          <span className={`text-xs font-normal ml-auto ${statusColor}`}>
            {goal.status === "achieved" ? "✓ Achieved" : isOverdue ? "Overdue" : `${daysLeft}d remaining`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Start</span>
          <span className="text-white font-mono">{goal.startScore}</span>
          <span className="text-slate-400">→</span>
          <span className="text-white font-mono">{goal.currentScore}</span>
          <span className="text-slate-400">→</span>
          <span className="text-indigo-300 font-bold font-mono">{goal.targetScore}</span>
          <span className="text-slate-400">Target</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              goal.status === "achieved" ? "bg-green-500" : progress >= 75 ? "bg-indigo-500" : progress >= 40 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{progress.toFixed(1)}% progress to goal</span>
          <span>Deadline: {new Date(goal.targetDate as unknown as string).toLocaleDateString()}</span>
        </div>
        {goal.notes && (
          <p className="text-xs text-slate-500 italic border-t border-slate-700 pt-2">{goal.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
