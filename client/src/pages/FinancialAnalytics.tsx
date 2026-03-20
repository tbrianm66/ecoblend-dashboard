// ============================================================
// ECOBLEND — Financial Analytics Module
// DB-backed: trpc.financial.latestAll + trpc.finSummary.getPortfolioSummary
// Revenue forecast, burn rate tracker, ESOP dilution, portfolio health
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function RunwayBadge({ months }: { months: number }) {
  const color = months >= 12 ? "#22c55e" : months >= 6 ? "#f59e0b" : "#ef4444";
  const label = months >= 12 ? "Healthy" : months >= 6 ? "Monitor" : "Critical";
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${color}15`, color }}>
      {label} · {months}m
    </span>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

export default function FinancialAnalytics() {
  const { ventures: allVentures } = useVentures();
  const ventures = allVentures.filter(v => !v.isInternalLab);
  const utils = trpc.useUtils();

  // DB-backed financial snapshots (latest per venture)
  const { data: snapshots, isLoading: snapLoading } = trpc.financial.latestAll.useQuery();
  // DB-backed Financial Model Builder summary
  const { data: finSummary, isLoading: sumLoading } = trpc.finSummary.overview.useQuery();

  const isLoading = snapLoading || sumLoading;

  // Build a map of ventureId → snapshot
  const snapMap: Record<string, {
    monthlyBurn: number;
    cashRunway: number;
    revenueActual: number;
    revenueTarget: number;
    investmentRaised: number;
    investmentTarget: number;
    month: string;
  }> = {};

  if (snapshots) {
    for (const snap of snapshots as any[]) {
      snapMap[snap.ventureId] = {
        monthlyBurn: snap.monthlyBurn ?? 0,
        cashRunway: snap.cashRunway ?? 0,
        revenueActual: snap.revenueActual ?? 0,
        revenueTarget: snap.revenueTarget ?? 0,
        investmentRaised: snap.investmentRaised ?? 0,
        investmentTarget: snap.investmentTarget ?? 0,
        month: snap.month ?? "—",
      };
    }
  }

  // Upsert mutation for adding/updating a financial snapshot
  const upsert = trpc.financial.upsert.useMutation({
    onSuccess: () => {
      utils.financial.latestAll.invalidate();
      toast.success("Financial snapshot updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const totalBurn = ventures.reduce((a, v) => a + (snapMap[v.id]?.monthlyBurn ?? 0), 0);
  const totalRevenue = ventures.reduce((a, v) => a + (snapMap[v.id]?.revenueActual ?? 0), 0);
  const totalInvestment = ventures.reduce((a, v) => a + (snapMap[v.id]?.investmentRaised ?? 0), 0);
  const runwayValues = ventures.map(v => snapMap[v.id]?.cashRunway ?? 0).filter(x => x > 0);
  const avgRunway = runwayValues.length > 0 ? Math.round(runwayValues.reduce((a, b) => a + b, 0) / runwayValues.length) : 0;

  // Build burn chart data from DB snapshots
  const burnData = ventures.map(v => ({
    name: v.name,
    "Monthly Burn": snapMap[v.id]?.monthlyBurn ?? 0,
    color: v.color,
  }));

  // Revenue vs target data
  const revenueData = ventures.map(v => ({
    name: v.name,
    "Revenue (YTD)": snapMap[v.id]?.revenueActual ?? 0,
    "Annual Target": snapMap[v.id]?.revenueTarget ?? 0,
    color: v.color,
  }));

  // ESOP dilution data from equity context (static model — equity structure is in People & ESOP)
  const esopData = ventures.map(v => ({
    name: v.name,
    "Founder/Team": 60,
    "ESOP Pool": 20,
    "Investor": 20,
    color: v.color,
  }));

  // Financial model summary stats
  const finModelStats = finSummary as any;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign size={16} style={{ color: "#22c55e" }} />
          <span className="vos-badge vos-badge-success" style={{ fontSize: "0.65rem" }}>Finance</span>
        </div>
        <h1 className="vos-page-title mb-1">Financial Analytics</h1>
        <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
          Portfolio-level financial health: burn rates, cash runway, revenue vs target, and ESOP equity dilution — all from live database snapshots.
        </p>
      </div>

      <div className="p-8 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Portfolio Monthly Burn", value: fmt(totalBurn), sub: "combined across all ventures", color: "#ef4444", icon: TrendingDown },
            { label: "Total Revenue (YTD)", value: fmt(totalRevenue), sub: "across all ventures", color: "#22c55e", icon: TrendingUp },
            { label: "Investment Raised", value: fmt(totalInvestment), sub: "total to date", color: "#1d4ed8", icon: DollarSign },
            { label: "Avg Cash Runway", value: avgRunway > 0 ? `${avgRunway}m` : "—", sub: "across portfolio", color: "#f59e0b", icon: AlertTriangle },
          ].map(kpi => (
            <div key={kpi.label} className="vos-metric">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon size={13} style={{ color: kpi.color }} />
                <span className="vos-metric-label">{kpi.label}</span>
              </div>
              <span className="vos-metric-value" style={{ color: kpi.color }}>{kpi.value}</span>
              <span className="vos-metric-sub">{kpi.sub}</span>
            </div>
          ))}
        </div>

        {/* Financial Model Summary (from Financial Model Builder) */}
        {finModelStats && (
          <div className="vos-panel p-6">
            <h2 className="vos-section-title mb-4">Financial Model Builder Summary</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Active P&L Models", value: finModelStats.totalPlModels ?? 0, color: "#22c55e" },
                { label: "Runway Scenarios", value: finModelStats.totalRunwayScenarios ?? 0, color: "#3A97D3" },
                { label: "Exit Waterfall Models", value: finModelStats.totalWaterfallModels ?? 0, color: "#7c3aed" },
                { label: "Investor Reports", value: finModelStats.totalReports ?? 0, color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border p-4 text-center" style={{ borderColor: `${s.color}30`, background: `${s.color}08` }}>
                  <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: "'Prompt', sans-serif" }}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Burn Rate + Runway */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Burn bar chart */}
          <div className="vos-panel p-6">
            <h2 className="vos-section-title mb-4">Monthly Burn Rate by Venture</h2>
            {burnData.every(d => d["Monthly Burn"] === 0) ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <DollarSign size={28} className="mb-2 opacity-30" />
                <p className="text-sm">No financial snapshots yet.</p>
                <p className="text-xs mt-1">Add snapshots via the Financial Model Builder.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={burnData} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={(v: number) => [fmt(v), "Monthly Burn"]} />
                  <Bar dataKey="Monthly Burn" radius={[0, 4, 4, 0]}>
                    {burnData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Runway cards */}
          <div className="vos-panel p-6">
            <h2 className="vos-section-title mb-4">Cash Runway & Investment Progress</h2>
            <div className="space-y-4">
              {ventures.map(v => {
                const snap = snapMap[v.id];
                if (!snap) {
                  return (
                    <div key={v.id} className="flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: v.color }}>{v.name}</span>
                      <span className="text-xs text-gray-400">No snapshot</span>
                    </div>
                  );
                }
                return (
                  <div key={v.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold" style={{ color: v.color }}>{v.name}</span>
                      <RunwayBadge months={snap.cashRunway} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Investment: {fmt(snap.investmentRaised)} / {fmt(snap.investmentTarget)}</span>
                      <span>{snap.investmentTarget > 0 ? Math.round((snap.investmentRaised / snap.investmentTarget) * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${snap.investmentTarget > 0 ? (snap.investmentRaised / snap.investmentTarget) * 100 : 0}%`, background: v.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Revenue vs Target */}
        <div className="vos-panel p-6">
          <h2 className="vos-section-title mb-4">Revenue vs Target — by Venture</h2>
          {revenueData.every(d => d["Revenue (YTD)"] === 0 && d["Annual Target"] === 0) ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <TrendingUp size={28} className="mb-2 opacity-30" />
              <p className="text-sm">No revenue data yet.</p>
              <p className="text-xs mt-1">Update financial snapshots to see revenue vs target.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={(v: number, name: string) => [fmt(v), name]} />
                <Legend />
                <Bar dataKey="Revenue (YTD)" radius={[4, 4, 0, 0]}>
                  {revenueData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                </Bar>
                <Bar dataKey="Annual Target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ESOP Dilution Modelling */}
        <div className="vos-panel p-6">
          <h2 className="vos-section-title mb-1">ESOP Equity Dilution Model</h2>
          <p className="text-xs text-gray-400 mb-4">Indicative equity split per venture: Founder/Team equity, ESOP pool allocation, and investor equity. Full ESOP management is in People & ESOP.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={esopData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Bar dataKey="Founder/Team" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="ESOP Pool" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Investor" stackId="a" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {[
              { label: "Founder / Team", color: "#22c55e", desc: "Core founding team equity, vesting over 4 years with 12-month cliff." },
              { label: "ESOP Pool", color: "#f59e0b", desc: "20% reserved for future employees, advisors, and VBS stipend recipients." },
              { label: "Investor", color: "#1d4ed8", desc: "Indicative 20% investor equity at seed round, subject to negotiation." },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-3" style={{ background: `${item.color}08`, border: `1px solid ${item.color}25` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs font-bold" style={{ color: item.color }}>{item.label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue vs Target Summary Table */}
        <div className="vos-panel overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: "#f3f4f6" }}>
            <h2 className="vos-section-title">Revenue vs Target Summary</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Venture", "Channel", "Revenue (YTD)", "Annual Target", "Progress", "Burn/mo", "Runway", "Snapshot Month"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventures.map(v => {
                const snap = snapMap[v.id];
                const pct = snap && snap.revenueTarget > 0 ? Math.round((snap.revenueActual / snap.revenueTarget) * 100) : 0;
                return (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                    <td className="py-3 px-4 font-bold text-sm" style={{ color: v.color }}>{v.name}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{v.channel}</td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: "#22c55e" }}>{snap ? fmt(snap.revenueActual) : "—"}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{snap ? fmt(snap.revenueTarget) : "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: v.color }} />
                        </div>
                        <span className="text-xs font-mono text-gray-500">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{snap ? fmt(snap.monthlyBurn) : "—"}</td>
                    <td className="py-3 px-4">{snap ? <RunwayBadge months={snap.cashRunway} /> : <span className="text-xs text-gray-400">—</span>}</td>
                    <td className="py-3 px-4 text-xs text-gray-400 font-mono">{snap?.month ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
