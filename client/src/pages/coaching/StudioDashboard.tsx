/**
 * Module 13 — Sub-Module 2: Studio Dashboard
 * Route: /coaching/studio
 * Portfolio-wide coaching overview — NOT filtered by a single venture.
 *
 * Layout:
 *   Top row  — 3 metric cards (Total Hours · Active Coaches · At-Risk Ventures)
 *   Matrix   — Cross-portfolio table with staleness flagging
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Users, AlertTriangle, TrendingUp,
  Calendar, CheckCircle2, Activity, Sparkles,
} from "lucide-react";
import { format, parseISO } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

type PortfolioRow = {
  ventureId: string;
  ventureName: string;
  coaches: string[];
  totalHours: number;
  sessionCount: number;
  lastSessionDate: string | null;
  daysSinceLastSession: number | null;
  isAtRisk: boolean;
  neverCoached: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try { return format(parseISO(dateStr), "d MMM yyyy"); } catch { return dateStr; }
}

function StalenessCell({ row }: { row: PortfolioRow }) {
  if (row.neverCoached) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
        bg-red-900/50 text-red-300 border-red-700 uppercase tracking-wide">
        <AlertTriangle className="w-3 h-3" />
        CRITICAL: No Sessions
      </span>
    );
  }
  if (row.isAtRisk) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
        bg-amber-900/50 text-amber-300 border-amber-700 uppercase tracking-wide animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        CRITICAL: Inactive &gt; 14 Days
      </span>
    );
  }
  const d = row.daysSinceLastSession ?? 0;
  const color =
    d <= 7  ? "bg-emerald-900/40 text-emerald-300 border-emerald-700" :
    d <= 14 ? "bg-blue-900/40 text-blue-300 border-blue-700" :
              "bg-slate-700 text-slate-300 border-slate-600";
  const label =
    d < 0   ? "Upcoming" :
    d === 0 ? "Today" :
    d === 1 ? "Yesterday" :
              `${d}d ago`;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <CheckCircle2 className="w-3 h-3" />
      {label}
    </span>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardContent className="p-5">
        <div className="space-y-3">
          <div className="h-3 w-24 bg-slate-700 rounded animate-pulse" />
          <div className="h-9 w-16 bg-slate-700 rounded animate-pulse" />
          <div className="h-3 w-32 bg-slate-700 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudioDashboard() {
  const { data, isLoading, error } = trpc.coaching.dashboard.getStudioDashboardData.useQuery(
    undefined,
    { refetchInterval: 60_000 }
  );

  const rows: PortfolioRow[] = data?.portfolioRows ?? [];
  const atRiskRows  = rows.filter((r) => r.isAtRisk);
  const healthyRows = rows.filter((r) => !r.isAtRisk);

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Studio Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Portfolio-wide coaching oversight · Module 13 Sub-Module 2
          </p>
        </div>
        <Badge className="bg-purple-900/60 text-purple-300 border border-purple-700 text-xs">
          Module 13
        </Badge>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-red-700 bg-red-900/20 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Failed to load dashboard data. Please refresh.
        </div>
      )}

      {/* ── Top metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Total Portfolio Coaching Hours */}
        {isLoading ? <SkeletonCard /> : (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-900/40 shrink-0">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    Total Portfolio Coaching Hours
                  </p>
                  <p className="text-4xl font-bold text-white leading-none">
                    {data?.totalHours ?? 0}
                    <span className="text-lg text-slate-400 font-normal ml-1">hrs</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Across {rows.length} venture{rows.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Assigned Coaches */}
        {isLoading ? <SkeletonCard /> : (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-900/40 shrink-0">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    Active Assigned Coaches
                  </p>
                  <p className="text-4xl font-bold text-white leading-none">
                    {data?.activeCoachCount ?? 0}
                  </p>
                  {(data?.activeCoaches?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {data!.activeCoaches.slice(0, 3).map((c) => (
                        <span key={c} className="text-xs text-slate-400 bg-slate-800 rounded px-1.5 py-0.5 border border-slate-700 truncate max-w-[120px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* At-Risk Ventures */}
        {isLoading ? <SkeletonCard /> : (
          <Card className={`border transition-colors ${(data?.atRiskCount ?? 0) > 0 ? "bg-amber-950/20 border-amber-700/50" : "bg-emerald-950/20 border-emerald-800/40"}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${(data?.atRiskCount ?? 0) > 0 ? "bg-amber-900/40" : "bg-emerald-900/30"}`}>
                  <AlertTriangle className={`w-6 h-6 ${(data?.atRiskCount ?? 0) > 0 ? "text-amber-400" : "text-emerald-400"}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    At-Risk Ventures
                    <span className="ml-1 text-slate-500 normal-case font-normal">(no session &gt;14d)</span>
                  </p>
                  <p className={`text-4xl font-bold leading-none ${(data?.atRiskCount ?? 0) > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {data?.atRiskCount ?? 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5">
                    {(data?.atRiskCount ?? 0) === 0
                      ? "All ventures actively engaged"
                      : `${data!.atRiskCount} venture${data!.atRiskCount !== 1 ? "s" : ""} need immediate attention`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Cross-Portfolio Matrix ── */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3 border-b border-slate-700/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Cross-Portfolio Coaching Matrix
            </CardTitle>
            {!isLoading && (
              <div className="flex items-center gap-2">
                {atRiskRows.length > 0 && (
                  <Badge className="bg-amber-900/50 text-amber-300 border border-amber-700 text-xs">
                    {atRiskRows.length} at-risk
                  </Badge>
                )}
                <Badge className="bg-slate-700 text-slate-300 border border-slate-600 text-xs">
                  {rows.length} ventures
                </Badge>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sorted by staleness — most overdue ventures listed first.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">No coaching sessions found across the portfolio.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Venture
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Assigned Coach
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Last Session
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rows.map((row) => (
                    <tr
                      key={row.ventureId}
                      className={`transition-colors ${
                        row.isAtRisk
                          ? "bg-amber-950/10 hover:bg-amber-950/20"
                          : "hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Venture name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {row.isAtRisk && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                          )}
                          <span className={`font-semibold ${row.isAtRisk ? "text-amber-200" : "text-white"}`}>
                            {row.ventureName}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{row.ventureId}</span>
                      </td>

                      {/* Coach(es) */}
                      <td className="px-5 py-4">
                        {row.coaches.length === 0 ? (
                          <span className="text-slate-500 text-xs italic">Unassigned</span>
                        ) : (
                          <div className="space-y-0.5">
                            {row.coaches.map((c) => (
                              <div key={c} className="flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="text-slate-300 text-sm">{c}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Session count */}
                      <td className="px-4 py-4 text-center">
                        <span className={`text-base font-bold ${row.sessionCount === 0 ? "text-slate-500" : "text-white"}`}>
                          {row.sessionCount}
                        </span>
                      </td>

                      {/* Total hours */}
                      <td className="px-4 py-4 text-center">
                        <span className={`text-base font-bold ${row.totalHours === 0 ? "text-slate-500" : "text-purple-300"}`}>
                          {row.totalHours === 0 ? "—" : `${row.totalHours}h`}
                        </span>
                      </td>

                      {/* Last session date */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className={`text-sm ${row.lastSessionDate ? "text-slate-300" : "text-slate-500 italic"}`}>
                            {fmtDate(row.lastSessionDate)}
                          </span>
                        </div>
                        {row.daysSinceLastSession !== null && row.daysSinceLastSession > 0 && (
                          <span className={`text-xs mt-0.5 block ${row.isAtRisk ? "text-amber-400 font-semibold" : "text-slate-500"}`}>
                            {row.daysSinceLastSession} day{row.daysSinceLastSession !== 1 ? "s" : ""} ago
                          </span>
                        )}
                      </td>

                      {/* Status / staleness badge */}
                      <td className="px-5 py-4">
                        <StalenessCell row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── At-risk callout ── */}
      {!isLoading && atRiskRows.length > 0 && (
        <div className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-semibold text-sm">
                {atRiskRows.length} venture{atRiskRows.length !== 1 ? "s" : ""} require{atRiskRows.length === 1 ? "s" : ""} immediate coaching intervention
              </p>
              <p className="text-amber-400/70 text-xs mt-0.5">
                {atRiskRows.map((r) => r.ventureName).join(", ")} — no session logged in over 14 days.
                Studio leadership should schedule sessions urgently.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
