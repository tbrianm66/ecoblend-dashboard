// ============================================================
// SRL VENTURE DETAIL — BEBUS-SRL-PIPE-001
// Dimension radar · KPI submission form · Gate panel · Trend chart
// Design: Precision Industrial — EcoBlend design system
// ============================================================

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2, Leaf, TrendingUp, ShieldCheck, ShieldAlert,
  AlertTriangle, ChevronLeft, Play, Lock, Unlock,
  CheckCircle2, XCircle, Clock, BarChart3, FileText,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Radar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  RadialLinearScale, Filler, Title, Tooltip, Legend
);

// ── Constants ─────────────────────────────────────────────────────────────────

const SRL_LEVELS = [
  { level: 0, label: "Unassessed",  color: "#9ca3af", bg: "#f3f4f6" },
  { level: 1, label: "Aware",       color: "#f59e0b", bg: "#fef3c7" },
  { level: 2, label: "Committed",   color: "#f97316", bg: "#ffedd5" },
  { level: 3, label: "Measured",    color: "#3b82f6", bg: "#dbeafe" },
  { level: 4, label: "Optimising",  color: "#56A837", bg: "#E9F6E3" },
  { level: 5, label: "Exemplary",   color: "#3D8526", bg: "#d1fae5" },
];

const DIMS = ["ENV", "LCA", "SMF", "SOC", "ESG"] as const;
type DimCode = typeof DIMS[number];

const DIM_COLORS: Record<DimCode, string> = {
  ENV: "#56A837",
  LCA: "#3B85BA",
  SMF: "#F69111",
  SOC: "#8b5cf6",
  ESG: "#ec4899",
};

const DIM_FULL: Record<DimCode, string> = {
  ENV: "Environmental Impact",
  LCA: "Lifecycle and Circular Economy Alignment",
  SMF: "Sustainable Manufacturing",
  SOC: "Social Value and Impact",
  ESG: "ESG Governance and Compliance",
};

const GATE_THRESHOLDS: Record<string, { composite: number; label: string }> = {
  G1: { composite: 25, label: "G1 — Awareness Gate" },
  G2: { composite: 35, label: "G2 — Commitment Gate" },
  G3: { composite: 55, label: "G3 — Measurement Gate" },
  G4: { composite: 70, label: "G4 — Optimisation Gate" },
  G5: { composite: 85, label: "G5 — Exemplary Gate" },
};

function getSrlLevel(level: number) {
  return SRL_LEVELS[level] ?? SRL_LEVELS[0];
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GateStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    PASS: { color: "text-[#56A837]", icon: <CheckCircle2 size={12} /> },
    FAIL: { color: "text-red-500", icon: <XCircle size={12} /> },
    HOLDING: { color: "text-amber-500", icon: <Clock size={12} /> },
    REMEDIATION: { color: "text-orange-500", icon: <AlertTriangle size={12} /> },
  };
  const m = map[status] ?? { color: "text-gray-400", icon: null };
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${m.color}`}>
      {m.icon}{status}
    </span>
  );
}

function DimScoreCard({ dimCode, score, coverage, gatePass }: {
  dimCode: string; score: number; coverage: number; gatePass: boolean;
}) {
  const color = DIM_COLORS[dimCode as DimCode] ?? "#9ca3af";
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{dimCode}</span>
        {gatePass
          ? <ShieldCheck size={13} className="text-[#56A837]" />
          : <ShieldAlert size={13} className="text-amber-500" />}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
        {score.toFixed(1)}
      </div>
      <div className="text-xs text-gray-400 mb-2">{DIM_FULL[dimCode as DimCode]}</div>
      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, background: color }} />
      </div>
      <div className="text-[10px] text-gray-400 mt-1">Coverage: {(coverage * 100).toFixed(0)}%</div>
    </div>
  );
}

// ── KPI Submission Form ────────────────────────────────────────────────────────

function KpiSubmissionForm({ ventureId, onSuccess }: { ventureId: string; onSuccess: () => void }) {
  const [activeDim, setActiveDim] = useState<DimCode>("ENV");
  const [periodStart, setPeriodStart] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: kpiDefs, isLoading: defsLoading } = trpc.srl.getKpiDefinitions.useQuery(
    { dimensionCode: activeDim },
    { staleTime: 300_000 }
  );

  const submitMutation = trpc.srl.submitKpiValues.useMutation({
    onSuccess: (res) => {
      toast.success(`${res.submitted} KPI values submitted for ${activeDim}`);
      setValues({});
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const kpiValues = Object.entries(values)
      .filter(([, v]) => v !== "" && v !== undefined)
      .map(([kpiCode, rawValue]) => ({
        kpiCode,
        rawValue: parseFloat(rawValue),
        periodStart,
        periodEnd,
      }));
    if (kpiValues.length === 0) {
      toast.error("Enter at least one KPI value before submitting");
      return;
    }
    submitMutation.mutate({ ventureId, dimensionCode: activeDim, periodStart, periodEnd, kpiValues });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
          Submit KPI Data
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Enter raw KPI values per dimension to trigger scoring</p>
      </div>

      {/* Dimension Tabs */}
      <div className="flex border-b border-gray-50 px-4">
        {DIMS.map(d => (
          <button
            key={d}
            onClick={() => { setActiveDim(d); setValues({}); }}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeDim === d
                ? "border-current"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
            style={activeDim === d ? { color: DIM_COLORS[d], borderColor: DIM_COLORS[d] } : {}}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Period */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <Label className="text-xs text-gray-500 mb-1">Period Start</Label>
            <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1">Period End</Label>
            <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="text-sm" />
          </div>
        </div>

        {/* KPI Inputs */}
        {defsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {(kpiDefs ?? []).map((kpi) => (
              <div key={kpi.kpiCode} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-gray-500">{kpi.kpiCode}</span>
                    {kpi.isMandatory ? (
                      <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-semibold">Required</span>
                    ) : (
                      <span className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded">Optional</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 truncate">{kpi.kpiName}</div>
                </div>
                <Input
                  type="number"
                  placeholder="Value"
                  value={values[kpi.kpiCode] ?? ""}
                  onChange={e => setValues(prev => ({ ...prev, [kpi.kpiCode]: e.target.value }))}
                  className="w-28 text-sm text-right"
                />
              </div>
            ))}
          </div>
        )}

        <Button
          className="w-full mt-5 bg-[#56A837] hover:bg-[#3D8526] text-white text-sm"
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
          Submit {activeDim} KPI Values
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SrlVentureDetail() {
  const [location, navigate] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const ventureId = params.get("id") ?? "ecoblend";

  const [selectedGate, setSelectedGate] = useState<string>("G3");

  const { data: profile, refetch: refetchProfile } = trpc.srl.getVentureProfile.useQuery(
    { ventureId },
    { refetchInterval: 30_000 }
  );

  const { data: assessmentHistory, refetch: refetchHistory } = trpc.srl.getAssessmentHistory.useQuery(
    { ventureId, limit: 1 },
    { refetchInterval: 30_000 }
  );

  const { data: trendsData, refetch: refetchTrends } = trpc.srl.getTrends.useQuery(
    { ventureId, limit: 8 },
    { refetchInterval: 60_000 }
  );

  const { data: gateStatus } = trpc.srl.getGateStatus.useQuery(
    { ventureId },
    { refetchInterval: 30_000 }
  );

  const { data: riskConditions } = trpc.srl.listRiskConditions.useQuery(
    { ventureId },
    { refetchInterval: 30_000 }
  );

  const latestAssessment = assessmentHistory?.[0] ?? null;

  const runAssessmentMutation = trpc.srl.runAssessment.useMutation({
    onSuccess: (res) => {
      toast.success(`Assessment complete — SRL-${res.srlLevel} (${Number(res.compositeFinal).toFixed(1)})`);
      refetchProfile();
      refetchHistory();
      refetchTrends();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateReportMutation = trpc.srl.generateReport.useMutation({
    onSuccess: () => toast.success("Report generation queued — check Assessment History"),
    onError: (err) => toast.error(err.message),
  });

  // Radar chart data from latest assessment dimension scores
  const latestDetail = trpc.srl.getAssessmentDetail.useQuery(
    { assessmentId: latestAssessment?.id ?? "" },
    { enabled: !!latestAssessment?.id }
  );

  const dimScores = useMemo(() => {
    if (!latestDetail.data?.dimensionScores) return {};
    const result: Record<string, { rawScore: number; coveredScore: number; coveragePct: number; gatePass: boolean }> = {};
    for (const ds of latestDetail.data.dimensionScores) {
      const code = ds.srl_dimension_definitions?.dimensionCode ?? ds.srl_dimension_scores?.dimensionCode ?? "";
      if (code) {
        result[code] = {
          rawScore: Number(ds.srl_dimension_scores?.rawScore ?? 0),
          coveredScore: Number(ds.srl_dimension_scores?.weightedScore ?? 0),
          coveragePct: Number(ds.srl_dimension_scores?.kpiCoveragePct ?? 0) / 100,
          gatePass: Boolean(ds.srl_dimension_scores?.gatePass),
        };
      }
    }
    return result;
  }, [latestDetail.data]);

  const radarData = {
    labels: DIMS.map(d => d),
    datasets: [{
      label: "Covered Score",
      data: DIMS.map(d => dimScores[d]?.coveredScore ?? 0),
      backgroundColor: "rgba(86, 168, 55, 0.15)",
      borderColor: "#56A837",
      borderWidth: 2,
      pointBackgroundColor: "#56A837",
      pointRadius: 4,
    }, {
      label: "Raw Score",
      data: DIMS.map(d => dimScores[d]?.rawScore ?? 0),
      backgroundColor: "rgba(59, 133, 186, 0.08)",
      borderColor: "#3B85BA",
      borderWidth: 1.5,
      borderDash: [4, 4],
      pointBackgroundColor: "#3B85BA",
      pointRadius: 3,
    }],
  };

  // Trend line chart
  const trendSeries = trendsData?.series ?? [];
  const trendLineData = {
    labels: trendSeries.map(s => {
      const d = s.assessmentDate;
      return d ? new Date(d as unknown as string).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) : "—";
    }),
    datasets: [{
      label: "Composite Score",
      data: trendSeries.map(s => s.compositeScore),
      borderColor: "#56A837",
      backgroundColor: "rgba(86, 168, 55,0.08)",
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: "#56A837",
    }],
  };

  const lvl = getSrlLevel(profile?.srlCurrentLevel ?? 0);
  const compositeScore = Number(latestAssessment?.compositeScore ?? 0);
  const gateThreshold = GATE_THRESHOLDS[selectedGate]?.composite ?? 55;
  const gatePass = compositeScore >= gateThreshold;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => navigate("/srl-portfolio")}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-2 transition-colors"
            >
              <ChevronLeft size={13} /> Portfolio Overview
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Leaf size={16} className="text-[#56A837]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#56A837]">SRL Venture Detail</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {ventureId}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: lvl.bg, color: lvl.color }}
              >
                SRL-{profile?.srlCurrentLevel ?? 0} {lvl.label}
              </span>
              <span className="text-xs text-gray-400 font-mono">Stage: {profile?.currentStage ?? "S0"}</span>
              {profile?.sustainabilityWatch && (
                <div className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                  <AlertTriangle size={12} /> Sustainability Watch
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => generateReportMutation.mutate({ assessmentId: latestAssessment?.id ?? "", ventureId, reportType: "SCORECARD", reportFormat: "PDF", reportStandard: "GRI" })}
              disabled={generateReportMutation.isPending || !latestAssessment}
            >
              <FileText size={12} />
              Export Scorecard
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-[#56A837] hover:bg-[#3D8526] text-white"
              onClick={() => runAssessmentMutation.mutate({ ventureId, gateRef: selectedGate as any, lockAssessment: true })}
              disabled={runAssessmentMutation.isPending}
            >
              {runAssessmentMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              Run Assessment
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Score KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Composite Score</div>
            <div className="text-3xl font-bold" style={{ color: lvl.color, fontFamily: "'Prompt', sans-serif" }}>
              {compositeScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {latestAssessment?.scoreDelta !== null && latestAssessment?.scoreDelta !== undefined
                ? `${Number(latestAssessment.scoreDelta) >= 0 ? "+" : ""}${Number(latestAssessment.scoreDelta).toFixed(1)} vs prev`
                : "No prior assessment"}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Trajectory</div>
            <div className="text-3xl font-bold text-[#3B85BA]" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {trendsData?.trajectory.direction === "improving" ? "↑" : trendsData?.trajectory.direction === "declining" ? "↓" : "→"}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {trendsData?.trajectory.avgGain !== undefined
                ? `Avg ${trendsData.trajectory.avgGain >= 0 ? "+" : ""}${trendsData.trajectory.avgGain.toFixed(1)} pts/assessment`
                : "Insufficient data"}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Gate Status</div>
            <div className="text-3xl font-bold" style={{ color: gatePass ? "#56A837" : "#ef4444", fontFamily: "'Prompt', sans-serif" }}>
              {gatePass ? "PASS" : "FAIL"}
            </div>
            <div className="text-xs text-gray-400 mt-1">{GATE_THRESHOLDS[selectedGate]?.label}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Risk Conditions</div>
            <div className="text-3xl font-bold text-amber-500" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {riskConditions?.length ?? 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">active risk flags</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Radar Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Dimension Radar
            </h3>
            <div style={{ height: "260px" }}>
              <Radar
                data={radarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      min: 0, max: 100,
                      ticks: { stepSize: 25, font: { size: 10 } },
                      grid: { color: "#f3f4f6" },
                      pointLabels: { font: { size: 11, weight: "bold" } },
                    },
                  },
                  plugins: {
                    legend: { position: "bottom", labels: { font: { size: 11 }, boxWidth: 12 } },
                  },
                }}
              />
            </div>
          </div>

          {/* Trend Line Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Score Trend
              </h3>
              {trendsData?.trajectory.projected !== null && trendsData?.trajectory.projected !== undefined && (
                <div className="text-xs text-gray-400">
                  Projected next: <span className="font-semibold text-[#56A837]">{trendsData.trajectory.projected.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div style={{ height: "260px" }}>
              {trendSeries.length > 0 ? (
                <Line
                  data={trendLineData}
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
                <div className="flex flex-col items-center justify-center h-full text-sm text-gray-400">
                  <BarChart3 size={32} className="text-gray-200 mb-2" />
                  No locked assessments yet — run an assessment to start tracking trends
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dimension Score Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {DIMS.map(d => (
            <DimScoreCard
              key={d}
              dimCode={d}
              score={dimScores[d]?.rawScore ?? 0}
              coverage={dimScores[d]?.coveragePct ?? 0}
              gatePass={dimScores[d]?.gatePass ?? false}
            />
          ))}
        </div>

        {/* Bottom Grid: Gate Panel + KPI Form + Risk Conditions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Gate Evaluation Panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 pt-5 pb-4 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Gate Evaluation
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Select gate to evaluate against composite score</p>
            </div>
            <div className="p-5 space-y-3">
              {Object.entries(GATE_THRESHOLDS).map(([gateCode, gate]) => {
                const pass = compositeScore >= gate.composite;
                const isSelected = selectedGate === gateCode;
                const holdingEntry = (gateStatus ?? []).find((g: any) => g.gateCode === gateCode);
                return (
                  <button
                    key={gateCode}
                    onClick={() => setSelectedGate(gateCode)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? "border-[#56A837] bg-[#E9F6E3]"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-800">{gate.label}</div>
                      <div className="text-[10px] text-gray-400">Threshold: {gate.composite}</div>
                      {holdingEntry && (
                        <div className="text-[10px] text-amber-500 font-semibold mt-0.5">
                          {holdingEntry.status} — {holdingEntry.gateCode}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {pass
                        ? <><CheckCircle2 size={14} className="text-[#56A837]" /><span className="text-xs font-semibold text-[#56A837]">PASS</span></>
                        : <><XCircle size={14} className="text-red-400" /><span className="text-xs font-semibold text-red-400">FAIL</span></>
                      }
                    </div>
                  </button>
                );
              })}

              {/* Gate progress bar */}
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Score vs {selectedGate} threshold</span>
                  <span>{compositeScore.toFixed(1)} / {gateThreshold}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (compositeScore / gateThreshold) * 100)}%`,
                      background: gatePass ? "#56A837" : "#ef4444",
                    }}
                  />
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {gatePass
                    ? `${(compositeScore - gateThreshold).toFixed(1)} pts above threshold`
                    : `${(gateThreshold - compositeScore).toFixed(1)} pts needed to pass`}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Submission Form */}
          <KpiSubmissionForm
            ventureId={ventureId}
            onSuccess={() => { refetchProfile(); refetchHistory(); refetchTrends(); }}
          />

          {/* Risk Conditions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 pt-5 pb-4 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Risk Conditions
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Active SRL risk flags from latest assessment</p>
            </div>
            <div className="p-5">
              {!riskConditions || riskConditions.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldCheck size={28} className="text-[#56A837] mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No active risk conditions</p>
                  <p className="text-xs text-gray-400 mt-1">Run an assessment to evaluate risks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {riskConditions.map((risk: any, i: number) => {
                    const severityColors: Record<string, string> = {
                      CRITICAL: "bg-red-50 border-red-200 text-red-700",
                      HIGH: "bg-orange-50 border-orange-200 text-orange-700",
                      MEDIUM: "bg-amber-50 border-amber-200 text-amber-700",
                      LOW: "bg-blue-50 border-blue-200 text-blue-700",
                    };
                    const cls = severityColors[risk.severity] ?? "bg-gray-50 border-gray-200 text-gray-700";
                    return (
                      <div key={i} className={`p-3 rounded-lg border ${cls}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold">{risk.code}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{risk.severity}</Badge>
                        </div>
                        <p className="text-xs leading-relaxed">{risk.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
