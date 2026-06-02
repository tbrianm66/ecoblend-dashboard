// ============================================================
// SRL PORTFOLIO OVERVIEW — BEBUS-SRL-PIPE-001
// Heatmap · Level distribution · Gate status · Watch alerts
// Design: Precision Industrial — EcoBlend design system
// ============================================================

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Leaf, TrendingUp, ShieldCheck, ShieldAlert, Eye, ChevronRight, RefreshCw } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// ── Constants ─────────────────────────────────────────────────────────────────

const SRL_LEVELS = [
  { level: 0, label: "Unassessed",  color: "#9ca3af", bg: "#f3f4f6" },
  { level: 1, label: "Aware",       color: "#f59e0b", bg: "#fef3c7" },
  { level: 2, label: "Committed",   color: "#f97316", bg: "#ffedd5" },
  { level: 3, label: "Measured",    color: "#3b82f6", bg: "#dbeafe" },
  { level: 4, label: "Optimising",  color: "#51AF37", bg: "#e8f7e3" },
  { level: 5, label: "Exemplary",   color: "#2d9856", bg: "#d1fae5" },
];

const DIM_COLORS: Record<string, string> = {
  ENV: "#51AF37",
  LCA: "#3A97D3",
  SMF: "#F49C13",
  SOC: "#8b5cf6",
  ESG: "#ec4899",
};

const DIM_LABELS: Record<string, string> = {
  ENV: "Environmental Impact",
  LCA: "Lifecycle and Circular Economy Alignment",
  SMF: "Sustainable Manufacturing",
  SOC: "Social Value and Impact",
  ESG: "ESG Governance and Compliance",
};

function getSrlLevel(level: number) {
  return SRL_LEVELS[level] ?? SRL_LEVELS[0];
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, score)}%`, background: color }}
      />
    </div>
  );
}

function DimCell({ code, score }: { code: string; score: number }) {
  const color = DIM_COLORS[code] ?? "#9ca3af";
  const bg = score >= 60 ? "#e8f7e3" : score >= 40 ? "#fef3c7" : "#fee2e2";
  const textColor = score >= 60 ? "#2d9856" : score >= 40 ? "#b45309" : "#dc2626";
  return (
    <div className="text-center px-2 py-1 rounded" style={{ background: bg }}>
      <div className="text-xs font-bold" style={{ color: textColor }}>{score.toFixed(0)}</div>
      <div className="text-[10px] text-gray-400">{code}</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SrlPortfolio() {
  const [, navigate] = useLocation();
  const [selectedSector, setSelectedSector] = useState<string>("ALL");

  const { data, isLoading, refetch, isFetching } = trpc.srl.getPortfolioSummary.useQuery(
    {},
    { refetchInterval: 60_000 }
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#51AF37]" size={32} />
      </div>
    );
  }

  const ventures = data?.ventures ?? [];
  const sectors = ["ALL", ...Array.from(new Set(ventures.map(v => v.sectorCode ?? "GENERAL")))];
  const filtered = selectedSector === "ALL" ? ventures : ventures.filter(v => v.sectorCode === selectedSector);

  const watchVentures = ventures.filter(v => v.sustainabilityWatch);
  const avgScore = data?.avgScore ?? 0;
  const levelDist = data?.levelDist ?? [];

  // Chart data — level distribution doughnut
  const doughnutData = {
    labels: SRL_LEVELS.map(l => `SRL-${l.level} ${l.label}`),
    datasets: [{
      data: SRL_LEVELS.map(l => levelDist.find(d => d.level === l.level)?.count ?? 0),
      backgroundColor: SRL_LEVELS.map(l => l.color),
      borderWidth: 0,
    }],
  };

  // Chart data — avg score by sector (bar)
  const sectorGroups = sectors.filter(s => s !== "ALL").map(sector => {
    const sectorVentures = ventures.filter(v => (v.sectorCode ?? "GENERAL") === sector);
    const avg = sectorVentures.length > 0
      ? Math.round(sectorVentures.reduce((s, v) => s + Number(v.currentScore ?? 0), 0) / sectorVentures.length * 10) / 10
      : 0;
    return { sector, avg, count: sectorVentures.length };
  });

  const barData = {
    labels: sectorGroups.map(s => s.sector),
    datasets: [{
      label: "Avg SRL Score",
      data: sectorGroups.map(s => s.avg),
      backgroundColor: "#51AF37",
      borderRadius: 6,
    }],
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Leaf size={16} className="text-[#51AF37]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#51AF37]">SRL Module</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400 font-mono">BEBUS-SRL-PIPE-001</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Sustainability Readiness Portfolio
            </h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Portfolio-level SRL snapshot — {ventures.length} ventures tracked
            </p>
          </div>
          <div className="flex items-center gap-2">
            {watchVentures.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle size={13} className="text-red-500" />
                <span className="text-xs font-semibold text-red-600">{watchVentures.length} Watch Active</span>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-[#51AF37] hover:bg-[#2d9856] text-white"
              onClick={() => navigate("/srl-venture")}
            >
              <TrendingUp size={12} />
              Venture Detail
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Portfolio Avg Score</div>
            <div className="text-3xl font-bold text-[#51AF37]" style={{ fontFamily: "'Prompt', sans-serif" }}>{avgScore.toFixed(1)}</div>
            <div className="text-xs text-gray-400 mt-1">out of 100</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Total Ventures</div>
            <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{data?.total ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1">in SRL registry</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Watch Flags</div>
            <div className="text-3xl font-bold text-red-500" style={{ fontFamily: "'Prompt', sans-serif" }}>{data?.watchCount ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1">sustainability watch active</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">SRL-4+ Ventures</div>
            <div className="text-3xl font-bold text-[#2d9856]" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {levelDist.filter(l => l.level >= 4).reduce((s, l) => s + l.count, 0)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Optimising or Exemplary</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Level Distribution Doughnut */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>
              SRL Level Distribution
            </h2>
            <div style={{ height: "200px" }}>
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "right", labels: { font: { size: 11 }, boxWidth: 12 } },
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} ventures` } },
                  },
                  cutout: "65%",
                }}
              />
            </div>
          </div>

          {/* Sector Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm xl:col-span-2">
            <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Average SRL Score by Sector
            </h2>
            <div style={{ height: "200px" }}>
              {sectorGroups.length > 0 ? (
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { min: 0, max: 100, grid: { color: "#f3f4f6" }, ticks: { font: { size: 11 } } },
                      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  No sector data available — run assessments to populate
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Venture SRL Heatmap
            </h2>
            <div className="flex items-center gap-2">
              {sectors.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSector(s)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    selectedSector === s
                      ? "bg-[#51AF37] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Leaf size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No ventures registered in the SRL module yet.</p>
              <p className="text-xs text-gray-300 mt-1">Use the Venture Detail page to create a venture profile and run an assessment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Venture</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stage</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">SRL Level</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Score</th>
                    {["ENV", "LCA", "SMF", "SOC", "ESG"].map(d => (
                      <th key={d} className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: DIM_COLORS[d] }}>{d}</th>
                    ))}
                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => {
                    const lvl = getSrlLevel(v.currentLevel ?? 0);
                    const score = Number(v.currentScore ?? 0);
                    return (
                      <tr
                        key={v.ventureId}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                        onClick={() => navigate(`/srl-venture?id=${v.ventureId}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm text-gray-900">{v.ventureId}</div>
                          <div className="text-xs text-gray-400">{v.sectorCode ?? "GENERAL"}</div>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {v.currentStage ?? "S0"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ background: lvl.bg, color: lvl.color }}
                          >
                            SRL-{v.currentLevel ?? 0} {lvl.label}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <span className="text-sm font-bold text-gray-900 w-10 text-right">{score.toFixed(1)}</span>
                            <div className="flex-1">
                              <ScoreBar score={score} color={lvl.color} />
                            </div>
                          </div>
                        </td>
                        {["ENV", "LCA", "SMF", "SOC", "ESG"].map(d => (
                          <td key={d} className="px-2 py-4 text-center">
                            <DimCell code={d} score={0} />
                          </td>
                        ))}
                        <td className="px-3 py-4 text-center">
                          {v.sustainabilityWatch ? (
                            <div className="flex items-center justify-center gap-1">
                              <AlertTriangle size={12} className="text-red-500" />
                              <span className="text-xs font-semibold text-red-500">Watch</span>
                            </div>
                          ) : score >= 60 ? (
                            <div className="flex items-center justify-center gap-1">
                              <ShieldCheck size={12} className="text-[#51AF37]" />
                              <span className="text-xs font-semibold text-[#51AF37]">Clear</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <ShieldAlert size={12} className="text-amber-500" />
                              <span className="text-xs font-semibold text-amber-500">Review</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <ChevronRight size={14} className="text-gray-300" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Watch Alert Panel */}
        {watchVentures.length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="text-sm font-bold text-red-700">Sustainability Watch — Active Alerts</h3>
            </div>
            <div className="space-y-2">
              {watchVentures.map(v => (
                <div
                  key={v.ventureId}
                  className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-red-100 cursor-pointer hover:border-red-300 transition-colors"
                  onClick={() => navigate(`/srl-venture?id=${v.ventureId}`)}
                >
                  <div className="flex items-center gap-3">
                    <Eye size={13} className="text-red-400" />
                    <span className="text-sm font-semibold text-gray-800">{v.ventureId}</span>
                    <span className="text-xs text-gray-400">Score: {Number(v.currentScore ?? 0).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">SRL-{v.currentLevel ?? 0}</Badge>
                    <ChevronRight size={12} className="text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dimension Legend */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Dimension Key</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(DIM_LABELS).map(([code, label]) => (
              <div key={code} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: DIM_COLORS[code] }} />
                <span className="text-xs text-gray-600"><span className="font-semibold">{code}</span> — {label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {SRL_LEVELS.map(l => (
              <div key={l.level} className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: l.bg, color: l.color }}>
                  SRL-{l.level}
                </span>
                <span className="text-xs text-gray-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
