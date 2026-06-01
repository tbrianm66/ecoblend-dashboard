/**
 * TRL/MRL Sync Venture Detail Page
 * Shows full assessment history, delta trend chart, and scenario explorer.
 */

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, FlaskConical, Clock } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  OK:    "bg-green-100 text-green-800 border-green-300",
  WATCH: "bg-yellow-100 text-yellow-800 border-yellow-300",
  AMBER: "bg-orange-100 text-orange-800 border-orange-300",
  RED:   "bg-red-100 text-red-800 border-red-300",
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
      {severity}
    </span>
  );
}

// ── Scenario Explorer ─────────────────────────────────────────────────────────

function ScenarioExplorer() {
  const { data: scenarios, isLoading } = trpc.sync.getScenarios.useQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: result } = trpc.sync.runScenario.useQuery(
    { scenarioId: selectedId! },
    { enabled: !!selectedId }
  );

  if (isLoading) return <div className="text-sm text-gray-400 p-4">Loading scenarios…</div>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        5 canonical scenarios from BEBUS-SYNC-SE-001. Select one to see the computed sync result.
      </p>

      <div className="grid grid-cols-1 gap-2">
        {scenarios?.map(s => {
          const isSelected = s.scenarioId === selectedId;
          return (
            <button
              key={s.scenarioId}
              onClick={() => setSelectedId(s.scenarioId)}
              className={`text-left rounded-lg border p-3 transition-all ${isSelected ? "border-[#3B85BA] bg-blue-50" : "border-[#e5e7eb] hover:border-gray-300 bg-white"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                <span className="text-xs text-gray-400">{s.sector}</span>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>TRL <strong className="text-[#3B85BA]">{s.trl}</strong></span>
                <span>MRL <strong className="text-[#F69111]">{s.mrl}</strong></span>
                <span>Δ <strong className={s.trl - s.mrl === 0 ? "text-green-600" : Math.abs(s.trl - s.mrl) >= 3 ? "text-red-600" : "text-orange-500"}>
                  {s.trl - s.mrl > 0 ? `+${s.trl - s.mrl}` : s.trl - s.mrl}
                </strong></span>
              </div>
            </button>
          );
        })}
      </div>

      {result && (
        <div className="bg-gray-50 rounded-xl border border-[#e5e7eb] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <SeverityBadge severity={result.severity} />
            <span className="text-xs text-gray-500">{PATH_LABELS[result.primaryPath] ?? result.primaryPath}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Ψ (Psi)",  value: result.psi.toFixed(4) },
              { label: "ρ (Rho)",  value: result.rho.toFixed(4) },
              { label: "η (Eta)",  value: result.eta.toFixed(4) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded p-2 border border-gray-200">
                <div className="text-sm font-bold font-mono text-gray-800">{value}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Recommended Actions</p>
            <div className="space-y-1">
              {result.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span>{a.icon}</span>
                  <span className={`font-semibold shrink-0 ${a.priority === "CRITICAL" ? "text-red-600" : a.priority === "HIGH" ? "text-orange-500" : "text-gray-500"}`}>
                    [{a.priority}]
                  </span>
                  <span className="text-gray-700">{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SyncVentureDetail() {
  const params = useParams<{ ventureId: string }>();
  const [, navigate] = useLocation();
  const ventureId = params.ventureId;

  const { data, isLoading } = trpc.sync.getVentureDetail.useQuery({ ventureId });

  if (isLoading) return <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading…</div>;
  if (!data) return <div className="flex-1 flex items-center justify-center text-sm text-red-500">Venture not found</div>;

  const { venture, assessments, history } = data;
  const latest = assessments[0];

  // Chart data — delta trend
  const chartLabels = history
    .slice(0, 15)
    .reverse()
    .map((h, i) => `#${i + 1}`);

  const deltaData = history
    .slice(0, 15)
    .reverse()
    .map(h => h.delta);

  const trlData = history.slice(0, 15).reverse().map(h => h.trl);
  const mrlData = history.slice(0, 15).reverse().map(h => h.mrl);

  const deltaChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Δ (TRL − MRL)",
        data: deltaData,
        borderColor: "#3B85BA",
        backgroundColor: (ctx: any) => {
          const v = ctx.raw as number;
          if (v === 0) return "#22c55e40";
          if (Math.abs(v) >= 3) return "#dc262640";
          return "#f9731640";
        },
        fill: false,
        tension: 0.3,
        pointRadius: 5,
      },
    ],
  };

  const trlMrlChartData = {
    labels: chartLabels,
    datasets: [
      { label: "TRL", data: trlData, borderColor: "#3B85BA", backgroundColor: "#3B85BA20", fill: false, tension: 0.3 },
      { label: "MRL", data: mrlData, borderColor: "#F69111", backgroundColor: "#F6911120", fill: false, tension: 0.3 },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: true, position: "bottom" as const } },
    scales: { y: { min: -9, max: 9, grid: { color: "#f3f4f6" } } },
  };

  const trlMrlOptions = {
    responsive: true,
    plugins: { legend: { display: true, position: "bottom" as const } },
    scales: { y: { min: 0, max: 9, grid: { color: "#f3f4f6" } } },
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-8 py-5">
        <div className="flex items-center gap-3 mb-3">
          <Button size="sm" variant="ghost" onClick={() => navigate("/sync")} className="gap-1.5 text-xs text-gray-500">
            <ArrowLeft size={12} /> Back to Portfolio
          </Button>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full" style={{ background: venture.color ?? "#56A837" }} />
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                {venture.name}
              </h1>
              {latest && <SeverityBadge severity={latest.severity} />}
            </div>
            <p className="text-sm text-gray-500">TRL/MRL Sync Assessment History</p>
          </div>
          {latest && (
            <div className="flex gap-4 text-center">
              {[
                { label: "TRL",      value: latest.trl,                              color: "#3B85BA" },
                { label: "MRL",      value: latest.mrl,                              color: "#F69111" },
                { label: "Δ Delta",  value: latest.delta > 0 ? `+${latest.delta}` : latest.delta, color: latest.delta === 0 ? "#16a34a" : Math.abs(latest.delta) >= 3 ? "#dc2626" : "#ea580c" },
                { label: "η Eta",    value: Number(latest.eta).toFixed(3),           color: "#6b7280" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-lg px-4 py-2 border border-[#e5e7eb]">
                  <div className="text-xl font-bold font-mono" style={{ color }}>{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 size={12} /> Overview</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><Clock size={12} /> Assessment History</TabsTrigger>
            <TabsTrigger value="scenarios" className="gap-1.5"><FlaskConical size={12} /> Scenario Explorer</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Delta trend chart */}
              <Card className="border-[#e5e7eb]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-900">Δ Delta Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length > 0 ? (
                    <div style={{ height: 220 }}>
                      <Line data={deltaChartData} options={chartOptions} />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-8">No history yet — run a sync assessment to begin tracking.</div>
                  )}
                </CardContent>
              </Card>

              {/* TRL vs MRL chart */}
              <Card className="border-[#e5e7eb]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-900">TRL vs MRL Trajectory</CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length > 0 ? (
                    <div style={{ height: 220 }}>
                      <Line data={trlMrlChartData} options={trlMrlOptions} />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-8">No history yet.</div>
                  )}
                </CardContent>
              </Card>

              {/* Latest assessment detail */}
              {latest && (
                <Card className="border-[#e5e7eb] xl:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-gray-900">Latest Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: "Ψ Misalignment Score", value: Number(latest.psi).toFixed(4) },
                        { label: "ρ Risk Score",          value: Number(latest.rho).toFixed(4) },
                        { label: "η Sync Efficiency",     value: Number(latest.eta).toFixed(4) },
                        { label: "VRL Penalty",           value: `${(Number(latest.vrlPenalty) * 100).toFixed(2)}%` },
                        { label: "W_stage",               value: Number(latest.wStage).toFixed(3) },
                        { label: "W_velocity",            value: Number(latest.wVelocity).toFixed(4) },
                        { label: "Adjusted VRL",          value: latest.adjustedVrl ? Number(latest.adjustedVrl).toFixed(2) : "—" },
                        { label: "Path",                  value: PATH_LABELS[latest.primaryPath] ?? latest.primaryPath },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-3 border border-[#e5e7eb]">
                          <div className="text-sm font-bold font-mono text-gray-800">{value}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Recommended Actions</p>
                      <div className="space-y-1.5">
                        {(latest.actions as any[]).map((a: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span>{a.icon}</span>
                            <span className={`font-semibold shrink-0 text-xs ${a.priority === "CRITICAL" ? "text-red-600" : a.priority === "HIGH" ? "text-orange-500" : "text-gray-500"}`}>
                              [{a.priority}]
                            </span>
                            <span className="text-gray-700">{a.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history">
            <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-[#e5e7eb]">
                <h2 className="text-sm font-bold text-gray-900">Assessment History</h2>
              </div>
              {assessments.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No assessments yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">TRL</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">MRL</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Δ</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Ψ</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">ρ</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">η</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map(a => (
                      <tr key={a.syncId} className="border-b border-[#f3f4f6] hover:bg-gray-50">
                        <td className="px-6 py-3 text-xs text-gray-500">
                          {new Date(a.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-[#3B85BA]">{a.trl}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-[#F69111]">{a.mrl}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold">
                          <span className={a.delta === 0 ? "text-green-600" : Math.abs(a.delta) >= 3 ? "text-red-600" : "text-orange-500"}>
                            {a.delta > 0 ? `+${a.delta}` : a.delta}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-600">{Number(a.psi).toFixed(3)}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-600">{Number(a.rho).toFixed(3)}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-600">{Number(a.eta).toFixed(3)}</td>
                        <td className="px-4 py-3 text-center"><SeverityBadge severity={a.severity} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Scenarios tab */}
          <TabsContent value="scenarios">
            <div className="max-w-xl">
              <ScenarioExplorer />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
