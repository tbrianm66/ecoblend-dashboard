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
  Bell, FileText, X
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
  const prlScore = prl ? parseFloat(prl.score as unknown as string) : 0;
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
        <div className="flex items-center gap-2">
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
            <PrlRingGauge score={prlScore} riskLevel={prl?.riskLevel || null} />
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
              Personal Readiness Level
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "This Week", value: `${completedCount}/${totalCount}`, sub: "commitments done", color: "#22c55e" },
            { label: "Completion Rate", value: `${completionRate}%`, sub: "coach-verified", color: "#3b82f6" },
            { label: "PRL Score", value: prlScore.toFixed(1), sub: prl?.trend || "no data", color: ragColor },
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
