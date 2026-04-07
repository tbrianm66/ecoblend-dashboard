/**
 * COACHING MODULE V2 — Studio Dashboard
 * Architecture: BEBUS-COACH-V2-001 Phase 3 UI
 *
 * Shows: Venture health table, risk heatmap, portfolio PRL average,
 *        execution trend chart, coach performance analytics
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine, Cell
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, Users, Star } from "lucide-react";
import { format } from "date-fns";

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Studio Execution Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Portfolio-level execution intelligence · BEBUS-COACH-V2-001
        </p>
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

      {/* Coach Performance */}
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
