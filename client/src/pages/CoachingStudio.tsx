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
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, Users, Star, UserPlus, X, Check, Mail, PlusCircle, Bell, Trophy, RefreshCw } from "lucide-react";
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

  // Sprint 80: Alert summary
  const { data: alertSummary } = trpc.coaching.alerts.summary.useQuery();
  const generateAlerts = trpc.coaching.alerts.generate.useMutation({
    onSuccess: (data) => toast.success(`${data.generated} alert(s) generated for ${data.foundersScanned} founders`),
    onError: () => toast.error("Failed to generate alerts"),
  });
  const acknowledgeAlert = trpc.coaching.alerts.acknowledge.useMutation({
    onSuccess: () => utils.coaching.alerts.summary.invalidate(),
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
    </div>
  );
}
