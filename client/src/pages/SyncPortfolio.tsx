/**
 * TRL/MRL Sync Portfolio Page
 * Shows all ventures with their latest sync assessment, severity badges,
 * and a live ad-hoc calculator.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Eye, Zap, RefreshCw } from "lucide-react";

// ── Severity helpers ──────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  OK:    "bg-green-100 text-green-800 border-green-300",
  WATCH: "bg-yellow-100 text-yellow-800 border-yellow-300",
  AMBER: "bg-orange-100 text-orange-800 border-orange-300",
  RED:   "bg-red-100 text-red-800 border-red-300",
};

const SEVERITY_DOT: Record<string, string> = {
  OK:    "bg-green-500",
  WATCH: "bg-yellow-400",
  AMBER: "bg-orange-500",
  RED:   "bg-red-600",
};

const PATH_LABELS: Record<string, string> = {
  ALIGNED:             "Aligned",
  TRL_MINOR_LEAD:      "TRL Minor Lead",
  TRL_MODERATE_LEAD:   "TRL Moderate Lead",
  TRL_CRITICAL_LEAD:   "TRL Critical Lead",
  MRL_MINOR_LEAD:      "MRL Minor Lead",
  MRL_MODERATE_LEAD:   "MRL Moderate Lead",
  MRL_CRITICAL_LEAD:   "MRL Critical Lead",
};

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${SEVERITY_COLORS[severity] ?? "bg-gray-100 text-gray-600 border-gray-300"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[severity] ?? "bg-gray-400"}`} />
      {severity}
    </span>
  );
}

// ── Live Calculator ───────────────────────────────────────────────────────────

function LiveCalculator() {
  const [trl, setTrl] = useState(5);
  const [mrl, setMrl] = useState(5);
  const [supply,     setSupply]     = useState(0.5);
  const [cost,       setCost]       = useState(0.5);
  const [compliance, setCompliance] = useState(0.5);

  const { data, isFetching } = trpc.sync.computeAdHoc.useQuery(
    { trl, mrl, domainCriticality: { supply, cost, compliance } },
    { keepPreviousData: true }
  );

  const delta = trl - mrl;

  return (
    <Card className="border-[#e5e7eb]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Zap size={14} className="text-[#51AF37]" />
          Live Sync Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TRL / MRL sliders */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600">TRL</label>
              <span className="text-xs font-mono font-bold text-[#3A97D3]">{trl}</span>
            </div>
            <Slider min={1} max={9} step={1} value={[trl]} onValueChange={([v]) => setTrl(v)} className="accent-[#3A97D3]" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600">MRL</label>
              <span className="text-xs font-mono font-bold text-[#F49C13]">{mrl}</span>
            </div>
            <Slider min={1} max={9} step={1} value={[mrl]} onValueChange={([v]) => setMrl(v)} className="accent-[#F49C13]" />
          </div>
        </div>

        {/* Domain criticality sliders */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Domain Criticality</p>
          {[
            { label: "Supply Chain", value: supply,     set: setSupply },
            { label: "Cost Model",   value: cost,       set: setCost },
            { label: "Compliance",   value: compliance, set: setCompliance },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
              <Slider min={0} max={1} step={0.05} value={[value]} onValueChange={([v]) => set(v)} className="flex-1" />
              <span className="text-xs font-mono text-gray-600 w-8 text-right">{value.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Results */}
        {data && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <SeverityBadge severity={data.severity} />
              <span className="text-xs text-gray-500">{PATH_LABELS[data.primaryPath] ?? data.primaryPath}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Δ (Delta)",  value: delta > 0 ? `+${delta}` : String(delta), color: delta === 0 ? "text-green-600" : Math.abs(delta) >= 3 ? "text-red-600" : "text-orange-500" },
                { label: "Ψ (Psi)",   value: data.psi.toFixed(3),  color: "text-gray-800" },
                { label: "η (Eta)",   value: data.eta.toFixed(3),  color: "text-gray-800" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded p-2 border border-gray-200">
                  <div className={`text-base font-bold font-mono ${color}`}>{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { label: "ρ Risk Score",    value: data.rho.toFixed(3) },
                { label: "VRL Penalty",     value: `${(data.vrlPenalty * 100).toFixed(1)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded p-2 border border-gray-200">
                  <div className="text-sm font-bold font-mono text-gray-800">{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
            {/* Actions */}
            <div className="space-y-1">
              {data.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span>{a.icon}</span>
                  <span className={`font-semibold shrink-0 ${a.priority === "CRITICAL" ? "text-red-600" : a.priority === "HIGH" ? "text-orange-500" : "text-gray-600"}`}>
                    [{a.priority}]
                  </span>
                  <span className="text-gray-700">{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {isFetching && <div className="text-xs text-gray-400 text-center">Calculating…</div>}
      </CardContent>
    </Card>
  );
}

// ── Portfolio Table ───────────────────────────────────────────────────────────

export default function SyncPortfolio() {
  const [, navigate] = useLocation();
  const { data: portfolio, isLoading, refetch } = trpc.sync.getPortfolio.useQuery();

  const redCount   = portfolio?.filter(v => v.latestSync?.severity === "RED").length   ?? 0;
  const amberCount = portfolio?.filter(v => v.latestSync?.severity === "AMBER").length ?? 0;
  const okCount    = portfolio?.filter(v => v.latestSync?.severity === "OK").length    ?? 0;
  const noSync     = portfolio?.filter(v => !v.latestSync).length ?? 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3A97D315", color: "#3A97D3" }}>
                BEBUS-SYNC-SE-001
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              TRL/MRL Sync Engine
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Misalignment scoring across Technology and Manufacturing Readiness Levels. Identifies synchronisation gaps before they become capital risks.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5 text-xs">
            <RefreshCw size={12} /> Refresh
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          {[
            { label: "Critical (RED)",   value: redCount,   color: "#dc2626", bg: "#fef2f2" },
            { label: "At Risk (AMBER)",  value: amberCount, color: "#ea580c", bg: "#fff7ed" },
            { label: "Aligned (OK)",     value: okCount,    color: "#16a34a", bg: "#f0fdf4" },
            { label: "Not Assessed",     value: noSync,     color: "#6b7280", bg: "#f9fafb" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-xl border p-4" style={{ background: bg, borderColor: color + "30" }}>
              <div className="text-2xl font-bold" style={{ color, fontFamily: "'Prompt', sans-serif" }}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Venture table */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Portfolio Sync Status</h2>
              <span className="text-xs text-gray-400">{portfolio?.length ?? 0} ventures</span>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Venture</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">TRL</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">MRL</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Δ</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ψ</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Path</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {portfolio?.map((v) => {
                    const s = v.latestSync;
                    const delta = s ? s.delta : null;
                    return (
                      <tr
                        key={v.id}
                        className="border-b border-[#f3f4f6] hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/sync/${v.id}`)}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: v.color ?? "#51AF37" }} />
                            <span className="font-semibold text-gray-900">{v.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono font-bold text-[#3A97D3]">{s?.trl ?? v.trl ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono font-bold text-[#F49C13]">{s?.mrl ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {delta !== null ? (
                            <span className={`font-mono font-bold ${delta === 0 ? "text-green-600" : Math.abs(delta) >= 3 ? "text-red-600" : "text-orange-500"}`}>
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-xs text-gray-600">{s ? Number(s.psi).toFixed(2) : "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s ? <SeverityBadge severity={s.severity} /> : <span className="text-xs text-gray-300">Not assessed</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs text-gray-500">{s ? (PATH_LABELS[s.primaryPath] ?? s.primaryPath) : "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
                            <Eye size={11} /> Detail
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Live calculator sidebar */}
        <div className="space-y-4">
          <LiveCalculator />

          {/* Formula reference */}
          <Card className="border-[#e5e7eb]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Formula Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-gray-600">
              <div><span className="font-mono font-bold text-gray-800">Δ</span> = TRL − MRL</div>
              <div><span className="font-mono font-bold text-gray-800">Ψ</span> = |Δ| × W<sub>stage</sub> × W<sub>velocity</sub></div>
              <div><span className="font-mono font-bold text-gray-800">ρ</span> = Ψ × (1 + α·C<sub>s</sub> + β·C<sub>c</sub> + γ·C<sub>r</sub>)</div>
              <div><span className="font-mono font-bold text-gray-800">η</span> = max(0, min(1, 1 − Ψ/8))</div>
              <div><span className="font-mono font-bold text-gray-800">δ<sub>VRL</sub></span> = (1 − η) × 0.30</div>
              <div className="pt-1 border-t border-gray-100 text-gray-400">
                α=0.35 · β=0.25 · γ=0.20 · Ψ<sub>max</sub>=8
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
