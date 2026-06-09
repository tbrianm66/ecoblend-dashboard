/**
 * COACHING MODULE V2 — Studio Dashboard
 * Architecture: BEBUS-COACH-V2-001 Phase 3 UI
 *
 * Shows: Venture health table, risk heatmap, portfolio PRL average,
 *        execution trend chart, coach performance analytics
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine, Cell
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, Users, Star, UserPlus, X, Check, Mail, PlusCircle, Bell, Trophy, RefreshCw, Calendar, Send, BarChart2, ClipboardList, Library, Briefcase, Crosshair, Flag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";
import { ventures as staticVentures } from "@/lib/data";

function getRagColor(score: number | null): string {
  if (score === null) return "#64748b";
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function getRagLabel(score: number | null): string {
  if (score === null) return "NO DATA";
  if (score >= 70) return "LOW";
  if (score >= 40) return "MED";
  return "HIGH";
}

function TrendIcon({ trend }: { trend: string | null }) {
  if (trend === "improving") return <TrendingUp className="w-3 h-3 text-green-500" />;
  if (trend === "declining") return <TrendingDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-amber-500" />;
}

// ── Coach Assignment Panel ─────────────────────────────────────────────────────
function CoachAssignmentPanel() {
  const [showForm, setShowForm] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [selectedFounderId, setSelectedFounderId] = useState("");
  const [selectedVentureId, setSelectedVentureId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: coaches = [] } = trpc.coaching.coaches.list.useQuery();
  const { data: assignments = [], refetch: refetchAssignments } = trpc.coaching.assignments.list.useQuery();
  const utils = trpc.useUtils();

  const assign = trpc.coaching.assignments.create.useMutation({
    onSuccess: () => {
      toast.success("Coach assigned successfully");
      setShowForm(false);
      setSelectedCoachId("");
      setSelectedFounderId("");
      setSelectedVentureId("");
      refetchAssignments();
      utils.coaching.dashboard.studioDashboard.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const unassign = trpc.coaching.assignments.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Assignment ended");
      refetchAssignments();
    },
    onError: (e) => toast.error(e.message),
  });

  const dbVentures = staticVentures.filter((v) => !(v as any).isInternalLab);

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-400" />
              Coach Assignments
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Assign coaches to founders to activate the PRL scoring cycle</p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
          >
            {showForm ? <X className="w-3 h-3 mr-1" /> : <UserPlus className="w-3 h-3 mr-1" />}
            {showForm ? "Cancel" : "New Assignment"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Assignment Form */}
        {showForm && (
          <div className="mb-6 p-4 rounded-lg border border-purple-500/30 bg-purple-950/20">
            <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-3">New Coach Assignment</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Coach</label>
                <select
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(e.target.value)}
                  className="w-full rounded-md bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2"
                >
                  <option value="">Select a coach...</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.coachType})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Venture</label>
                <select
                  value={selectedVentureId}
                  onChange={(e) => setSelectedVentureId(e.target.value)}
                  className="w-full rounded-md bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2"
                >
                  <option value="">Select a venture...</option>
                  {dbVentures.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Founder User ID</label>
                <input
                  type="text"
                  value={selectedFounderId}
                  onChange={(e) => setSelectedFounderId(e.target.value)}
                  placeholder="Enter founder user ID..."
                  className="w-full rounded-md bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2"
                />
              </div>
            </div>
            <Button
              size="sm"
              disabled={!selectedCoachId || !selectedFounderId || !selectedVentureId || assign.isPending}
              onClick={() => assign.mutate({
                coachId: selectedCoachId,
                founderId: selectedFounderId,
                ventureId: selectedVentureId,
                startDate: new Date(startDate),
              })}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              {assign.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
              Confirm Assignment
            </Button>
          </div>
        )}

        {/* Active Assignments Table */}
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No active assignments. Click "New Assignment" to assign a coach to a founder.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium">Coach</th>
                  <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium">Founder ID</th>
                  <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium">Venture</th>
                  <th className="text-center py-2 px-3 text-xs text-slate-400 font-medium">Started</th>
                  <th className="text-center py-2 px-3 text-xs text-slate-400 font-medium">Status</th>
                  <th className="text-center py-2 px-3 text-xs text-slate-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 text-white font-medium">{a.coachName}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-xs">{a.founderId.substring(0, 12)}...</td>
                    <td className="py-2.5 px-3 text-slate-300">{a.ventureName}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400 text-xs">
                      {format(new Date(a.startDate), "dd MMM yyyy")}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        a.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-400"
                      }`}>
                        {a.isActive ? "Active" : "Ended"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {a.isActive && (
                        <button
                          onClick={() => unassign.mutate({ assignmentId: a.id })}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          End
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Coach Registration Panel ──────────────────────────────────────────────────
function CoachRegistrationPanel() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"executive" | "technical" | "commercial" | "wellbeing" | "specialist">("executive");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [specialisms, setSpecialisms] = useState("");
  const utils = trpc.useUtils();

  const { data: coaches = [] } = trpc.coaching.coachRegistration.list.useQuery({ includeInactive: false });

  const register = trpc.coaching.coachRegistration.register.useMutation({
    onSuccess: (data) => {
      toast.success(`Coach "${data.name}" registered successfully`);
      utils.coaching.coachRegistration.list.invalidate();
      utils.coaching.coaches.list.invalidate();
      setShowForm(false);
      setName(""); setBio(""); setHourlyRate(""); setSpecialisms("");
    },
    onError: (err) => toast.error(`Registration failed: ${err.message}`),
  });

  const deactivate = trpc.coaching.coachRegistration.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Coach deactivated");
      utils.coaching.coachRegistration.list.invalidate();
    },
  });

  const COACH_TYPES = ["executive", "technical", "commercial", "wellbeing", "specialist"] as const;

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" /> Coach Registry
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="gap-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Register Coach
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-xl border border-purple-700 bg-slate-800 p-4 space-y-3">
            <p className="text-sm font-semibold text-purple-300">New Coach Registration</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Full Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Johnson"
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Coach Type *</label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {COACH_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-white capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Hourly Rate (£)</label>
                <Input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="e.g. 150"
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Specialisms (comma-separated)</label>
                <Input
                  value={specialisms}
                  onChange={(e) => setSpecialisms(e.target.value)}
                  placeholder="e.g. TRL, MRL, ESG"
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief coach biography and experience..."
                className="bg-slate-700 border-slate-600 text-white text-sm resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                className="flex-1 border-slate-600 text-slate-400 bg-transparent hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!name || register.isPending}
                onClick={() => register.mutate({
                  name,
                  type,
                  bio: bio || undefined,
                  hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
                  specialisms: specialisms ? specialisms.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
                })}
                className="flex-1 bg-purple-700 hover:bg-purple-600 text-white"
              >
                {register.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register Coach"}
              </Button>
            </div>
          </div>
        )}

        {coaches.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No coaches registered yet. Click "Register Coach" to add the first one.</p>
        ) : (
          <div className="space-y-2">
            {coaches.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{c.name}</span>
                    <Badge className="text-xs capitalize bg-purple-900 text-purple-300 border-0">{c.type}</Badge>
                    {c.hourlyRate && <span className="text-xs text-slate-400">£{c.hourlyRate}/hr</span>}
                  </div>
                  {c.bio && <p className="text-xs text-slate-500 mt-0.5 truncate">{c.bio}</p>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deactivate.mutate({ id: c.id })}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30 ml-2 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CoachingStudio() {
  const { data: studio, isLoading } = trpc.coaching.dashboard.studioDashboard.useQuery(
    undefined,
    { refetchInterval: 60_000 }
  );

  const utils = trpc.useUtils();

  // Sprint 80: Alert summary — must be declared before any early return
  const { data: alertSummary } = trpc.coaching.alerts.summary.useQuery();
  const generateAlerts = trpc.coaching.alerts.generate.useMutation({
    onSuccess: (data) => toast.success(`${data.generated} alert(s) generated for ${data.foundersScanned} founders`),
    onError: () => toast.error("Failed to generate alerts"),
  });
  const acknowledgeAlert = trpc.coaching.alerts.acknowledge.useMutation({
    onSuccess: () => utils.coaching.alerts.summary.invalidate(),
  });

  // Sprint 83: Alert Schedule Log
  const { data: scheduleLog = [], refetch: refetchLog } = trpc.coaching.alertScheduling.getLog.useQuery({ limit: 5 });
  const runScheduled = trpc.coaching.alertScheduling.runScheduled.useMutation({
    onSuccess: (data) => {
      refetchLog();
      utils.coaching.alerts.summary.invalidate();
      toast.success(`Alert engine ran: ${data.alertsGenerated} alerts generated for ${data.foundersScanned} founders (${data.durationMs}ms)`);
    },
    onError: () => toast.error("Alert engine failed"),
  });

  // Sprint 84: Report Delivery
  const { data: reportList = [] } = trpc.coaching.reportDelivery.listWithStatus.useQuery({ limit: 10 });
  const sendReport = trpc.coaching.reportDelivery.sendToFounder.useMutation({
    onSuccess: (data) => {
      utils.coaching.reportDelivery.listWithStatus.invalidate();
      toast.success(`Report sent to ${data.founderName}`);
    },
    onError: () => toast.error("Failed to send report"),
  });

  // Sprint 85: Leaderboard Sparklines
  const { data: sparklines = [] } = trpc.coaching.leaderboardTrend.getSparklines.useQuery({});
  const computeSparklines = trpc.coaching.leaderboardTrend.computeSparklines.useMutation({
    onSuccess: (data) => {
      utils.coaching.leaderboardTrend.getSparklines.invalidate();
      toast.success(`Sparklines computed for ${data.computed} coaches`);
    },
    onError: () => toast.error("Failed to compute sparklines"),
  });

  // Sprint 82: Coach Performance Leaderboard
  const { data: leaderboard = [] } = trpc.coaching.leaderboard.get.useQuery({ limit: 10 });
  const computeLeaderboard = trpc.coaching.leaderboard.compute.useMutation({
    onSuccess: (data) => {
      utils.coaching.leaderboard.get.invalidate();
      toast.success(`Leaderboard computed for ${data.computed} coaches`);
    },
    onError: () => toast.error("Failed to compute leaderboard"),
  });

  const sendDigest = trpc.coaching.digest.sendWeeklyDigest.useMutation({
    onSuccess: (data) => {
      if (data.sent) {
        toast.success(`Weekly PRL digest sent — ${data.foundersReported} founders reported`);
      } else {
        toast.info("No PRL data available to send");
      }
    },
    onError: (err) => toast.error(`Digest failed: ${err.message}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const avgPrl = studio?.avgPortfolioPrl || 0;
  const avgColor = getRagColor(avgPrl);

  const heatmapData = (studio?.ventureHealth || []).map((v) => ({
    name: v.ventureName.length > 16 ? v.ventureName.substring(0, 14) + "…" : v.ventureName,
    prl: v.avgFounderPrl !== null ? Math.round(v.avgFounderPrl) : 0,
    vrl: v.adjustedVrl !== null ? Math.round(v.adjustedVrl) : 0,
    risk: v.riskFlagged,
    founders: v.founderCount,
  }));

  const trendData = (studio?.completionTrend || []).map((t) => ({
    week: format(new Date(t.week), "dd MMM"),
    rate: t.avgCompletionRate,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Studio Execution Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Portfolio-level execution intelligence · BEBUS-COACH-V2-001
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => sendDigest.mutate()}
          disabled={sendDigest.isPending}
          className="gap-2 bg-indigo-700 hover:bg-indigo-600 text-white text-xs"
        >
          {sendDigest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
          Send Weekly PRL Digest
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Portfolio PRL",
            value: avgPrl.toFixed(1),
            sub: getRagLabel(avgPrl) + " RISK",
            color: avgColor,
          },
          {
            label: "High Risk",
            value: String(studio?.highRiskCount || 0),
            sub: "founders flagged",
            color: studio?.highRiskCount ? "#ef4444" : "#22c55e",
          },
          {
            label: "Founders Scored",
            value: `${studio?.scoredFounders || 0}/${studio?.totalFounders || 0}`,
            sub: "with PRL data",
            color: "#3b82f6",
          },
          {
            label: "Active Coaches",
            value: String(studio?.coachPerformance.length || 0),
            sub: "in portfolio",
            color: "#a78bfa",
          },
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

      {/* Heatmap + Trend */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Venture Health Heatmap (bar chart) */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Venture Execution Health</CardTitle>
            <p className="text-xs text-slate-400">Average founder PRL per venture · GREEN ≥70 · AMBER 40–69 · RED &lt;40</p>
          </CardHeader>
          <CardContent>
            {heatmapData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                No venture PRL data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={heatmapData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                    labelStyle={{ color: "#94a3b8" }}
                    formatter={(value: number) => [`PRL: ${value}`, ""]}
                  />
                  <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="4 4" />
                  <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" />
                  <Bar dataKey="prl" radius={[4, 4, 0, 0]}>
                    {heatmapData.map((entry, index) => (
                      <Cell key={index} fill={getRagColor(entry.prl)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Completion Trend */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Portfolio Completion Trend</CardTitle>
            <p className="text-xs text-slate-400">Average weekly commitment completion rate across all founders</p>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                No completion trend data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#3b82f6" }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`, "Avg Completion"]}
                  />
                  <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Target 80%", fill: "#22c55e", fontSize: 10 }} />
                  <Line
                    type="monotone" dataKey="rate"
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

      {/* Venture Health Table */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Venture Health Table</CardTitle>
          <p className="text-xs text-slate-400">PRL-adjusted VRL scores per venture</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-xs text-slate-400 font-medium">Venture</th>
                  <th className="text-center py-2 px-3 text-xs text-slate-400 font-medium">Founders</th>
                  <th className="text-center py-2 px-3 text-xs text-slate-400 font-medium">Avg PRL</th>
                  <th className="text-center py-2 px-3 text-xs text-slate-400 font-medium">Adj. VRL</th>
                  <th className="text-center py-2 px-3 text-xs text-slate-400 font-medium">Risk</th>
                  <th className="text-center py-2 px-3 text-xs text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {studio?.ventureHealth.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No venture data available.
                    </td>
                  </tr>
                )}
                {studio?.ventureHealth.map((v) => {
                  const prl = v.avgFounderPrl;
                  const ragColor = getRagColor(prl);
                  return (
                    <tr key={v.ventureId} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-white font-medium">{v.ventureName}</td>
                      <td className="py-2.5 px-3 text-center text-slate-300">{v.founderCount}</td>
                      <td className="py-2.5 px-3 text-center">
                        {prl !== null ? (
                          <span className="font-mono font-bold" style={{ color: ragColor }}>
                            {prl.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {v.adjustedVrl !== null ? (
                          <span className="font-mono text-blue-300">{v.adjustedVrl.toFixed(1)}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${ragColor}20`, color: ragColor }}
                        >
                          {getRagLabel(prl)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {v.riskFlagged ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <AlertTriangle className="w-3 h-3" /> Flagged
                          </span>
                        ) : (
                          <span className="text-xs text-green-400">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Coach Assignment */}
      <CoachAssignmentPanel />

      {/* Coach Registration */}
      <CoachRegistrationPanel />

      {/* Sprint 80: PRL Alert Summary */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              PRL Trend Alerts
              {alertSummary && alertSummary.total > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-900 text-red-300">
                  {alertSummary.total}
                </span>
              )}
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs border-amber-600 text-amber-300 hover:bg-amber-900/30"
              onClick={() => generateAlerts.mutate({})}
              disabled={generateAlerts.isPending}
            >
              {generateAlerts.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Run Alert Engine
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!alertSummary || alertSummary.total === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">No active alerts. All founders are within normal PRL parameters.</div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-4 mb-3">
                {alertSummary.critical > 0 && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-900/60 text-red-300">{alertSummary.critical} Critical</span>}
                {alertSummary.warning > 0 && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-900/60 text-amber-300">{alertSummary.warning} Warning</span>}
                {alertSummary.info > 0 && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-900/60 text-blue-300">{alertSummary.info} Info</span>}
              </div>
              {alertSummary.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 px-3 py-2 rounded-lg border text-xs ${
                    alert.severity === "critical" ? "bg-red-950/50 border-red-800 text-red-200"
                    : alert.severity === "warning" ? "bg-amber-950/50 border-amber-800 text-amber-200"
                    : "bg-blue-950/50 border-blue-800 text-blue-200"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span className="flex-1">{alert.message}</span>
                  <button
                    onClick={() => acknowledgeAlert.mutate({ id: alert.id, acknowledgedBy: "studio" })}
                    className="flex-shrink-0 opacity-50 hover:opacity-100 ml-2"
                    title="Acknowledge"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sprint 82: Coach Performance Leaderboard */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Coach Performance Leaderboard
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs border-amber-600 text-amber-300 hover:bg-amber-900/30"
              onClick={() => computeLeaderboard.mutate({})}
              disabled={computeLeaderboard.isPending}
            >
              {computeLeaderboard.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Compute This Week
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No leaderboard data yet. Click "Compute This Week" to generate rankings.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-xs text-slate-400 font-semibold">Rank</th>
                    <th className="text-left py-2 px-3 text-xs text-slate-400 font-semibold">Coach</th>
                    <th className="text-left py-2 px-3 text-xs text-slate-400 font-semibold">Type</th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400 font-semibold">Score</th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400 font-semibold">PRL Δ</th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400 font-semibold">Commit %</th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400 font-semibold">Sessions</th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400 font-semibold">Founders</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((coach, i) => (
                    <tr key={coach.id} className={`border-b border-slate-800 ${ i === 0 ? "bg-amber-950/20" : "" }`}>
                      <td className="py-2 px-3">
                        <span className={`text-sm font-bold ${ i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "text-slate-500" }`}>
                          #{coach.rank ?? i + 1}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-white font-medium">{coach.coachName}</td>
                      <td className="py-2 px-3">
                        <span className="text-xs capitalize text-slate-400">{coach.coachType}</span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-sm font-bold" style={{ color: getRagColor(parseFloat(coach.compositeScore as unknown as string)) }}>
                          {parseFloat(coach.compositeScore as unknown as string).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={`text-xs font-mono ${ parseFloat(coach.avgPrlImprovement as unknown as string) >= 0 ? "text-green-400" : "text-red-400" }`}>
                          {parseFloat(coach.avgPrlImprovement as unknown as string) >= 0 ? "+" : ""}{parseFloat(coach.avgPrlImprovement as unknown as string).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300 text-xs font-mono">
                        {parseFloat(coach.commitmentCompletionRate as unknown as string).toFixed(0)}%
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300 text-xs">{coach.sessionCount}</td>
                      <td className="py-2 px-3 text-right text-slate-300 text-xs">{coach.foundersAssigned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sprint 83: Alert Schedule Log */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-400" />
              Alert Schedule Log
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs border-green-600 text-green-300 hover:bg-green-900/30"
              onClick={() => runScheduled.mutate({ triggeredBy: "manual" })}
              disabled={runScheduled.isPending}
            >
              {runScheduled.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Run Now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scheduleLog.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">No scheduled runs yet. Click "Run Now" to trigger the alert engine.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400">Triggered</th>
                    <th className="text-left py-2 px-3 text-slate-400">By</th>
                    <th className="text-right py-2 px-3 text-slate-400">Scanned</th>
                    <th className="text-right py-2 px-3 text-slate-400">Alerts</th>
                    <th className="text-right py-2 px-3 text-slate-400">Critical</th>
                    <th className="text-right py-2 px-3 text-slate-400">Duration</th>
                    <th className="text-left py-2 px-3 text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleLog.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800">
                      <td className="py-2 px-3 text-slate-300">{new Date(log.triggeredAt).toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <span className="capitalize text-slate-400">{log.triggeredBy}</span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">{log.foundersScanned}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{log.alertsGenerated}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={log.alertsCritical > 0 ? "text-red-400 font-bold" : "text-slate-500"}>{log.alertsCritical}</span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">{log.durationMs ? `${log.durationMs}ms` : "—"}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                          log.status === "success" ? "bg-green-900/60 text-green-300" :
                          log.status === "failed" ? "bg-red-900/60 text-red-300" :
                          "bg-amber-900/60 text-amber-300"
                        }`}>{log.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sprint 84: Progress Report Delivery */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400" />
            Progress Report Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportList.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">No progress reports generated yet. Use the Founder Dashboard to generate reports.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400">Founder</th>
                    <th className="text-left py-2 px-3 text-slate-400">Period</th>
                    <th className="text-left py-2 px-3 text-slate-400">Generated</th>
                    <th className="text-left py-2 px-3 text-slate-400">Status</th>
                    <th className="text-right py-2 px-3 text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reportList.map((report) => (
                    <tr key={report.id} className="border-b border-slate-800">
                      <td className="py-2 px-3 text-slate-300">Founder #{report.founderId}</td>
                      <td className="py-2 px-3 text-slate-400">{report.periodStart} → {report.periodEnd}</td>
                      <td className="py-2 px-3 text-slate-400">{new Date(report.generatedAt).toLocaleDateString()}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                          report.status === "sent" ? "bg-green-900/60 text-green-300" :
                          report.status === "ready" ? "bg-blue-900/60 text-blue-300" :
                          "bg-slate-700 text-slate-400"
                        }`}>{report.status}</span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {report.status !== "sent" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs text-blue-300 hover:text-blue-200 h-6 px-2"
                            onClick={() => sendReport.mutate({ reportId: report.id, sentBy: "studio" })}
                            disabled={sendReport.isPending}
                          >
                            <Send className="w-3 h-3" /> Send
                          </Button>
                        )}
                        {report.status === "sent" && (
                          <span className="text-xs text-green-400">✓ Sent {report.sentAt ? new Date(report.sentAt).toLocaleDateString() : ""}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sprint 85: Leaderboard Trend Sparklines */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              Coach Score Trends (6-Week Sparklines)
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs border-purple-600 text-purple-300 hover:bg-purple-900/30"
              onClick={() => computeSparklines.mutate({})}
              disabled={computeSparklines.isPending}
            >
              {computeSparklines.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Refresh Sparklines
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sparklines.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">No sparkline data yet. Compute the leaderboard first, then click "Refresh Sparklines".</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sparklines.map((s) => {
                const data = (s.sparklineData as Array<{ week: string; score: number }>) || [];
                const latest = parseFloat(s.latestScore as unknown as string);
                const min = parseFloat(s.minScore as unknown as string);
                const max = parseFloat(s.maxScore as unknown as string);
                const range = max - min || 1;
                const points = data.map((d, i) => {
                  const x = (i / Math.max(data.length - 1, 1)) * 100;
                  const y = 40 - ((d.score - min) / range) * 36;
                  return `${x},${y}`;
                }).join(" ");
                return (
                  <div key={s.id} className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-white">{s.coachName}</p>
                        <p className="text-xs text-slate-400">{s.weekCount} weeks tracked</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: getRagColor(latest) }}>{latest.toFixed(1)}</p>
                        <span className={`text-xs ${
                          s.trendDirection === "improving" ? "text-green-400" :
                          s.trendDirection === "declining" ? "text-red-400" :
                          "text-amber-400"
                        }`}>
                          {s.trendDirection === "improving" ? "↑" : s.trendDirection === "declining" ? "↓" : "→"} {s.trendDirection}
                        </span>
                      </div>
                    </div>
                    {data.length > 1 && (
                      <svg viewBox="0 0 100 44" className="w-full h-10" preserveAspectRatio="none">
                        <polyline
                          points={points}
                          fill="none"
                          stroke={s.trendDirection === "improving" ? "#22c55e" : s.trendDirection === "declining" ? "#ef4444" : "#f59e0b"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coach Performance (original cards) */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Coach Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studio?.coachPerformance.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No coaches registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {studio?.coachPerformance.map((c) => (
                <div key={c.coachId} className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{c.coachName}</p>
                      <p className="text-xs text-slate-400 capitalize">{c.coachType} coach</p>
                    </div>
                    {c.rating && (
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span className="text-xs font-mono">{parseFloat(c.rating as unknown as string).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <p className="text-xs text-slate-400">Founders</p>
                      <p className="text-lg font-bold text-blue-300">{c.assignedFounders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Sessions</p>
                      <p className="text-lg font-bold text-purple-300">{c.sessionCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sprint 86: Pending Self-Assessments */}
      <Card className="bg-slate-900 border-emerald-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-400" />
            Pending Self-Assessments
          </CardTitle>
          <p className="text-xs text-slate-400">Founder self-assessments awaiting coach review and approval</p>
        </CardHeader>
        <CardContent>
          <PendingSelfAssessmentsPanel />
        </CardContent>
      </Card>

      {/* Sprint 88: Template Library Management */}
      <Card className="bg-slate-900 border-cyan-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Library className="w-4 h-4 text-cyan-400" />
            Commitment Template Library
          </CardTitle>
          <p className="text-xs text-slate-400">Manage reusable commitment templates by VRL stage</p>
        </CardHeader>
        <CardContent>
          <TemplateLibraryPanel />
        </CardContent>
      </Card>

      {/* Sprint 90: Session Requests (Coach View) */}
      <Card className="bg-slate-900 border-blue-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Session Requests
          </CardTitle>
          <p className="text-xs text-slate-400">Confirm, reschedule, or decline founder session requests</p>
        </CardHeader>
        <CardContent>
          <SessionRequestsPanel />
        </CardContent>
      </Card>

      {/* Sprint 91: Template Effectiveness Analytics */}
      <Card className="bg-slate-900 border-purple-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            Template Effectiveness — Top 5
          </CardTitle>
          <p className="text-xs text-slate-400">Templates ranked by PRL uplift and commitment completion rate</p>
        </CardHeader>
        <CardContent>
          <TemplateEffectivenessPanel />
        </CardContent>
      </Card>

      {/* Sprint 93: Coach Workload Dashboard */}
      <Card className="bg-slate-900 border-slate-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-sky-400" />
            Coach Workload Dashboard
          </CardTitle>
          <p className="text-xs text-slate-400">Active assignments, pending requests, and unreviewed assessments per coach</p>
        </CardHeader>
        <CardContent>
          <CoachWorkloadPanel />
        </CardContent>
      </Card>

      {/* Sprint 94: FRL Goal Management */}
      <Card className="bg-slate-900 border-indigo-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-indigo-400" />
            FRL Goal Management
          </CardTitle>
          <p className="text-xs text-slate-400">Set and track PRL targets for each founder</p>
        </CardHeader>
        <CardContent>
          <FrlGoalManagementPanel />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sprint 86: Pending Self-Assessments Panel ─────────────────────────────────

function PendingSelfAssessmentsPanel() {
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const { data: pending, refetch } = trpc.coaching.selfAssessment.pending.useQuery({ limit: 20 });
  const approve = trpc.coaching.selfAssessment.approve.useMutation({
    onSuccess: () => { toast.success("Assessment approved — PRL record created"); refetch(); },
    onError: () => toast.error("Failed to approve"),
  });
  const reject = trpc.coaching.selfAssessment.reject.useMutation({
    onSuccess: () => { toast.success("Assessment rejected"); refetch(); },
    onError: () => toast.error("Failed to reject"),
  });

  if (!pending || pending.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-6">No pending self-assessments.</p>;
  }

  return (
    <div className="space-y-3">
      {pending.map((a) => (
        <div key={a.id} className="p-4 rounded-lg bg-slate-800 border border-slate-700">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-white">Founder #{a.founderId}</p>
              <p className="text-xs text-slate-400">Week of {a.weekOf as unknown as string}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-400">{parseFloat(a.compositeScore as unknown as string).toFixed(1)}</p>
              <p className="text-xs text-slate-400">composite</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1 mb-3 text-center">
            {([
              { label: "Strategy", val: a.strategicClarity },
              { label: "Market", val: a.marketValidation },
              { label: "Team", val: a.teamCapability },
              { label: "Ops", val: a.operationalExecution },
              { label: "Investor", val: a.investorPreparedness },
            ] as const).map(({ label, val }) => (
              <div key={label} className="bg-slate-700 rounded p-1">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-bold text-white">{val}</p>
              </div>
            ))}
          </div>
          {a.founderNotes && (
            <p className="text-xs text-slate-400 italic mb-2">"{a.founderNotes}"</p>
          )}
          <input
            type="text"
            placeholder="Review notes (optional)"
            value={reviewNotes[a.id] ?? ""}
            onChange={(e) => setReviewNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500 mb-2 focus:outline-none focus:border-emerald-500"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs flex-1"
              onClick={() => approve.mutate({ assessmentId: a.id, reviewedBy: "coach", reviewNotes: reviewNotes[a.id], createPrlRecord: true })}
              disabled={approve.isPending}
            >
              <Check className="w-3 h-3 mr-1" /> Approve &amp; Create PRL
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-700 text-red-400 hover:bg-red-950 text-xs flex-1"
              onClick={() => reject.mutate({ assessmentId: a.id, reviewedBy: "coach", reviewNotes: reviewNotes[a.id] ?? "Not approved" })}
              disabled={reject.isPending}
            >
              <X className="w-3 h-3 mr-1" /> Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sprint 88: Template Library Panel ────────────────────────────────────────────

function TemplateLibraryPanel() {
  const [search, setSearch] = useState("");
  const [vrlFilter, setVrlFilter] = useState<number | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVrl, setNewVrl] = useState(1);
  const [newDays, setNewDays] = useState(7);
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "critical">("medium");

  const { data: templates, refetch } = trpc.coaching.commitmentTemplates.list.useQuery({ vrlStage: vrlFilter, limit: 50 });
  const { data: searchResults } = trpc.coaching.commitmentTemplates.search.useQuery(
    { query: search, limit: 20 },
    { enabled: search.length >= 2 }
  );
  const createTemplate = trpc.coaching.commitmentTemplates.create.useMutation({
    onSuccess: () => { toast.success("Template created"); refetch(); setShowCreate(false); setNewTitle(""); setNewDesc(""); },
    onError: () => toast.error("Failed to create template"),
  });
  const deleteTemplate = trpc.coaching.commitmentTemplates.delete.useMutation({
    onSuccess: () => { toast.success("Template deleted"); refetch(); },
    onError: () => toast.error("Failed to delete template"),
  });
  const seedTemplates = trpc.coaching.commitmentTemplates.seed.useMutation({
    onSuccess: (data) => { toast.success(data.message); refetch(); },
    onError: () => toast.error("Failed to seed templates"),
  });

  const displayed = search.length >= 2 ? searchResults : templates;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-32 bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <select
          value={vrlFilter ?? ""}
          onChange={(e) => setVrlFilter(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
        >
          <option value="">All VRL</option>
          {[1,2,3,4,5,6,7,8,9].map((v) => <option key={v} value={v}>VRL {v}</option>)}
        </select>
        <Button size="sm" className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs" onClick={() => setShowCreate(!showCreate)}>
          <PlusCircle className="w-3 h-3 mr-1" /> New
        </Button>
        <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 text-xs" onClick={() => seedTemplates.mutate({ force: false })} disabled={seedTemplates.isPending}>
          Seed Defaults
        </Button>
      </div>

      {showCreate && (
        <div className="p-3 rounded-lg bg-slate-800 border border-cyan-700 space-y-2">
          <input type="text" placeholder="Template title *" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none" />
          <textarea placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none resize-none" />
          <div className="flex gap-2 flex-wrap">
            <select value={newVrl} onChange={(e) => setNewVrl(Number(e.target.value))}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none">
              {[1,2,3,4,5,6,7,8,9].map((v) => <option key={v} value={v}>VRL {v}</option>)}
            </select>
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as "low" | "medium" | "high" | "critical")}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none">
              {["low","medium","high","critical"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="number" min={1} max={365} value={newDays} onChange={(e) => setNewDays(Number(e.target.value))}
              className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none" placeholder="Days" />
            <Button size="sm" className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs ml-auto"
              onClick={() => createTemplate.mutate({ title: newTitle, description: newDesc || undefined, vrlStage: newVrl, priority: newPriority, durationDays: newDays, createdBy: "coach" })}
              disabled={!newTitle || createTemplate.isPending}>
              {createTemplate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Create"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {displayed?.map((tmpl) => (
          <div key={tmpl.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-white truncate">{tmpl.title}</span>
                <Badge className={`text-xs shrink-0 ${
                  tmpl.priority === "critical" ? "bg-red-900 text-red-300" :
                  tmpl.priority === "high" ? "bg-amber-900 text-amber-300" :
                  tmpl.priority === "medium" ? "bg-blue-900 text-blue-300" :
                  "bg-slate-700 text-slate-300"
                }`}>{tmpl.priority}</Badge>
                {tmpl.isDefault && <Badge className="text-xs bg-slate-700 text-slate-400">default</Badge>}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>VRL {tmpl.vrlStage}</span>
                {tmpl.category && <span className="capitalize">{tmpl.category.replace("_", " ")}</span>}
                <span>{tmpl.durationDays}d</span>
                <span>Used {tmpl.usageCount}x</span>
              </div>
            </div>
            <button
              onClick={() => deleteTemplate.mutate({ id: tmpl.id })}
              className="text-slate-500 hover:text-red-400 transition-colors"
              title="Delete template"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {displayed?.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            {search.length >= 2 ? "No templates match your search" : "No templates yet. Click \"Seed Defaults\" to load the library."}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Sprint 90: Session Requests Panel (Coach View) ────────────────────────────

function SessionRequestsPanel() {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmedDate, setConfirmedDate] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [coachNotes, setCoachNotes] = useState("");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const { data: requests = [], refetch } = trpc.coaching.sessionRequests.list.useQuery({ role: "coach" });
  const confirm = trpc.coaching.sessionRequests.confirm.useMutation({
    onSuccess: () => { toast.success("Session confirmed"); setConfirmId(null); setConfirmedDate(""); setMeetingLink(""); setCoachNotes(""); refetch(); },
    onError: () => toast.error("Failed to confirm session"),
  });
  const reschedule = trpc.coaching.sessionRequests.reschedule.useMutation({
    onSuccess: () => { toast.success("Session rescheduled"); setRescheduleId(null); setRescheduleDate(""); refetch(); },
    onError: () => toast.error("Failed to reschedule"),
  });
  const decline = trpc.coaching.sessionRequests.decline.useMutation({
    onSuccess: () => { toast.success("Request declined"); refetch(); },
    onError: () => toast.error("Failed to decline"),
  });
  const complete = trpc.coaching.sessionRequests.complete.useMutation({
    onSuccess: () => { toast.success("Session marked as completed"); refetch(); },
    onError: () => toast.error("Failed to mark complete"),
  });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-900 text-amber-300",
    confirmed: "bg-green-900 text-green-300",
    rescheduled: "bg-blue-900 text-blue-300",
    cancelled: "bg-slate-700 text-slate-400",
    completed: "bg-purple-900 text-purple-300",
  };

  if (requests.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-6">No session requests from founders yet.</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="p-4 rounded-lg bg-slate-800 border border-slate-700">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[req.status] ?? "bg-slate-700 text-slate-400"}`}>
                  {req.status}
                </span>
                <span className="text-xs text-slate-400 capitalize">{req.sessionType.replace("_", " ")}</span>
                <span className="text-xs text-slate-500 font-mono">{req.ventureId}</span>
              </div>
              {req.preferredDate && (
                <p className="text-xs text-slate-400">Preferred: {new Date(req.preferredDate).toLocaleString()}</p>
              )}
              {req.founderNotes && <p className="text-xs text-slate-300 italic mt-1">"{req.founderNotes}"</p>}
              {req.confirmedDate && (
                <p className="text-xs text-green-400 mt-1">Confirmed: {new Date(req.confirmedDate).toLocaleString()}</p>
              )}
              {req.meetingLink && (
                <a href={req.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 underline mt-1 block">Meeting link</a>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {req.status === "pending" && (
                <>
                  <Button size="sm" className="bg-green-700 hover:bg-green-600 text-white text-xs h-7 px-2" onClick={() => setConfirmId(req.id)}>Confirm</Button>
                  <Button size="sm" variant="outline" className="border-blue-600 text-blue-400 text-xs h-7 px-2" onClick={() => setRescheduleId(req.id)}>Reschedule</Button>
                  <Button size="sm" variant="outline" className="border-red-700 text-red-400 text-xs h-7 px-2" onClick={() => decline.mutate({ requestId: req.id })} disabled={decline.isPending}>Decline</Button>
                </>
              )}
              {req.status === "confirmed" && (
                <Button size="sm" className="bg-purple-700 hover:bg-purple-600 text-white text-xs h-7 px-2" onClick={() => complete.mutate({ requestId: req.id })} disabled={complete.isPending}>Mark Done</Button>
              )}
            </div>
          </div>
          {confirmId === req.id && (
            <div className="mt-3 p-3 rounded bg-green-950/30 border border-green-700 space-y-2">
              <p className="text-xs font-semibold text-green-300">Confirm Session</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="datetime-local" value={confirmedDate} onChange={(e) => setConfirmedDate(e.target.value)}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none" />
                <input type="url" placeholder="Meeting link (optional)" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none" />
              </div>
              <input type="text" placeholder="Notes for founder (optional)" value={coachNotes} onChange={(e) => setCoachNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none" />
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-700 hover:bg-green-600 text-white text-xs"
                  onClick={() => confirm.mutate({ requestId: req.id, confirmedDate: confirmedDate || undefined, meetingLink: meetingLink || undefined, coachNotes: coachNotes || undefined })}
                  disabled={confirm.isPending}>
                  {confirm.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                  Confirm
                </Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 text-xs" onClick={() => setConfirmId(null)}>Cancel</Button>
              </div>
            </div>
          )}
          {rescheduleId === req.id && (
            <div className="mt-3 p-3 rounded bg-blue-950/30 border border-blue-700 space-y-2">
              <p className="text-xs font-semibold text-blue-300">Propose New Time</p>
              <input type="datetime-local" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none" />
              <div className="flex gap-2">
                <Button size="sm" className="bg-blue-700 hover:bg-blue-600 text-white text-xs"
                  onClick={() => reschedule.mutate({ requestId: req.id, newDate: rescheduleDate })}
                  disabled={!rescheduleDate || reschedule.isPending}>
                  {reschedule.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                </Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 text-xs" onClick={() => setRescheduleId(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Sprint 91: Template Effectiveness Panel ───────────────────────────────────

function TemplateEffectivenessPanel() {
  const utils = trpc.useUtils();
  const { data: top5 = [], isLoading } = trpc.coaching.templateEffectiveness.top.useQuery({ limit: 5 });
  const compute = trpc.coaching.templateEffectiveness.compute.useMutation({
    onSuccess: (d) => { toast.success(`Effectiveness computed for ${d.templatesAnalysed} templates`); utils.coaching.templateEffectiveness.top.invalidate(); },
    onError: () => toast.error("Failed to compute effectiveness"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400">Composite score = 60% PRL uplift + 40% completion rate</p>
        <Button size="sm" variant="outline" className="border-purple-600 text-purple-400 text-xs"
          onClick={() => compute.mutate({})} disabled={compute.isPending}>
          {compute.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Recompute
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
      ) : top5.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No effectiveness data yet. Click "Recompute" to analyse templates.</p>
      ) : (
        <div className="space-y-3">
          {top5.map((t, idx) => {
            const prlUplift = parseFloat(t.avgPrlUplift as unknown as string);
            const completionRate = parseFloat(t.avgCompletionRate as unknown as string);
            const composite = parseFloat(t.compositeScore as unknown as string);
            return (
              <div key={t.templateId} className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold w-6 text-center ${idx === 0 ? "text-yellow-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-500" : "text-slate-500"}`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.templateTitle}</p>
                      <p className="text-xs text-slate-400">VRL {t.vrlStage} · {t.usageCount} uses · {t.completedCount} completed</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-purple-400">{composite.toFixed(1)}</p>
                    <p className="text-xs text-slate-500">composite</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">PRL Uplift</p>
                    <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(100, Math.max(0, prlUplift))}%` }} />
                    </div>
                    <p className="text-xs text-green-400 mt-0.5">+{prlUplift.toFixed(1)} pts</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Completion Rate</p>
                    <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${completionRate}%` }} />
                    </div>
                    <p className="text-xs text-blue-400 mt-0.5">{completionRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sprint 93: Coach Workload Panel ──────────────────────────────────────────

function CoachWorkloadPanel() {
  const { data, isLoading } = trpc.coaching.workload.summary.useQuery(undefined, { retry: false });

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-sky-400" /></div>;

  if (!data || data.coaches.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-4">No coach assignment data available yet.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Portfolio totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Coaches", value: data.totals.totalCoaches, color: "text-sky-400" },
          { label: "Active Assignments", value: data.totals.totalActiveAssignments, color: "text-green-400" },
          { label: "Pending Requests", value: data.totals.totalPendingRequests, color: "text-amber-400" },
          { label: "Unreviewed Assessments", value: data.totals.totalUnreviewedAssessments, color: "text-rose-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Per-coach rows */}
      <div className="space-y-2">
        {data.coaches.map((coach) => {
          const workloadScore = coach.activeFounderCount + coach.pendingSessionRequests * 0.5 + coach.unreviewedAssessments * 0.3;
          const workloadColor = workloadScore > 8 ? "text-red-400" : workloadScore > 5 ? "text-amber-400" : "text-green-400";
          return (
            <div key={coach.coachId} className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{coach.coachName}</p>
                  <span className="text-xs text-slate-500 capitalize">{coach.coachType}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{coach.activeFounderCount} founders</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-amber-400" />{coach.pendingSessionRequests} pending</span>
                  <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3 text-rose-400" />{coach.unreviewedAssessments} unreviewed</span>
                  {coach.highRiskFounders > 0 && (
                    <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="w-3 h-3" />{coach.highRiskFounders} high risk</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Avg PRL</p>
                <p className={`text-lg font-bold ${coach.avgPrl >= 70 ? "text-green-400" : coach.avgPrl >= 40 ? "text-amber-400" : "text-red-400"}`}>
                  {coach.avgPrl}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Load</p>
                <p className={`text-sm font-semibold ${workloadColor}`}>{workloadScore.toFixed(1)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sprint 94: FRL Goal Management Panel ─────────────────────────────────────

function FrlGoalManagementPanel() {
  const [showSetGoal, setShowSetGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    ventureId: "",
    founderId: "",
    coachId: "",
    targetScore: 70,
    targetDate: "",
    startScore: 50,
    notes: "",
  });

  const { data: goals, refetch } = trpc.coaching.goals.list.useQuery(
    { status: "active", limit: 50 },
    { retry: false }
  );

  const setGoal = trpc.coaching.goals.set.useMutation({
    onSuccess: () => {
      toast.success("FRL goal set successfully");
      setShowSetGoal(false);
      setGoalForm({ ventureId: "", founderId: "", coachId: "", targetScore: 70, targetDate: "", startScore: 50, notes: "" });
      refetch();
    },
    onError: () => toast.error("Failed to set goal"),
  });

  const cancelGoal = trpc.coaching.goals.cancel.useMutation({
    onSuccess: () => { toast.success("Goal cancelled"); refetch(); },
    onError: () => toast.error("Failed to cancel goal"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{goals?.length ?? 0} active goals across portfolio</p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs border-indigo-600 text-indigo-300 hover:bg-indigo-900/30"
          onClick={() => setShowSetGoal(!showSetGoal)}
        >
          <Flag className="w-3.5 h-3.5" />
          Set New Goal
        </Button>
      </div>

      {showSetGoal && (
        <div className="bg-slate-800 rounded-lg p-4 border border-indigo-700 space-y-3">
          <p className="text-sm font-medium text-indigo-300">Set FRL Goal</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Venture ID</label>
              <Input
                value={goalForm.ventureId}
                onChange={(e) => setGoalForm({ ...goalForm, ventureId: e.target.value })}
                placeholder="e.g. ecoblend"
                className="bg-slate-700 border-slate-600 text-white text-xs h-8"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Founder ID</label>
              <Input
                value={goalForm.founderId}
                onChange={(e) => setGoalForm({ ...goalForm, founderId: e.target.value })}
                placeholder="e.g. 1"
                className="bg-slate-700 border-slate-600 text-white text-xs h-8"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Coach ID</label>
              <Input
                value={goalForm.coachId}
                onChange={(e) => setGoalForm({ ...goalForm, coachId: e.target.value })}
                placeholder="Coach UUID"
                className="bg-slate-700 border-slate-600 text-white text-xs h-8"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Score (1-100)</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={goalForm.targetScore}
                onChange={(e) => setGoalForm({ ...goalForm, targetScore: parseInt(e.target.value) || 70 })}
                className="bg-slate-700 border-slate-600 text-white text-xs h-8"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start Score</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={goalForm.startScore}
                onChange={(e) => setGoalForm({ ...goalForm, startScore: parseInt(e.target.value) || 50 })}
                className="bg-slate-700 border-slate-600 text-white text-xs h-8"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Date</label>
              <Input
                type="date"
                value={goalForm.targetDate}
                onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white text-xs h-8"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes (optional)</label>
            <Textarea
              value={goalForm.notes}
              onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
              placeholder="Coaching context or milestones..."
              className="bg-slate-700 border-slate-600 text-white text-xs"
              rows={2}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowSetGoal(false)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-indigo-700 hover:bg-indigo-600 text-white text-xs gap-1"
              onClick={() => setGoal.mutate(goalForm)}
              disabled={setGoal.isPending || !goalForm.ventureId || !goalForm.founderId || !goalForm.coachId || !goalForm.targetDate}
            >
              {setGoal.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
              Set Goal
            </Button>
          </div>
        </div>
      )}

      {!goals || goals.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No active goals set. Use "Set New Goal" to create the first one.</p>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => {
            const progress = goal.progressPercent ? parseFloat(goal.progressPercent as unknown as string) : 0;
            const daysLeft = Math.ceil((new Date(goal.targetDate as unknown as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysLeft < 0;
            return (
              <div key={goal.id} className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-400 font-mono">{goal.ventureId}</span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-400">Founder {goal.founderId}</span>
                    <span className={`text-xs ml-auto ${isOverdue ? "text-red-400" : "text-slate-400"}`}>
                      {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{goal.currentScore}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progress >= 75 ? "bg-indigo-500" : progress >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <span className="text-xs text-indigo-300 font-bold">{goal.targetScore}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{progress.toFixed(1)}% progress · deadline {new Date(goal.targetDate as unknown as string).toLocaleDateString()}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-500 hover:text-red-400 text-xs"
                  onClick={() => cancelGoal.mutate({ id: goal.id })}
                  disabled={cancelGoal.isPending}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
