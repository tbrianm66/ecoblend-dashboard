// ============================================================
// MISSION INTEGRITY INDEX CARD
// Phase 5A — Mission Protection Framework
// Live tRPC integration with calculation engine
// ============================================================

import { useState } from "react";
import { AlertTriangle, TrendingDown, TrendingUp, Minus, RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const DEFAULT_VENTURE_ID = "bebus";

export default function MissionIntegrityCard() {
  const [selectedVenture, setSelectedVenture] = useState(DEFAULT_VENTURE_ID);
  const [showScoreInput, setShowScoreInput] = useState(false);

  // Load live ventures from database
  const { data: ventureList } = trpc.ventures.list.useQuery();
  const VENTURES = (ventureList || []).filter((v: any) => !v.isInternalLab).map((v: any) => ({
    id: v.id,
    name: v.name,
    color: v.color || "#51AF37",
  }));
  const [inputScores, setInputScores] = useState({
    financialVsMissionDrift: 25,
    stakeholderAlignmentScore: 68,
    governanceStrengthScore: 65,
    leadershipContinuityScore: 58,
  });

  const { data: latest, isLoading, refetch } = trpc.missionIntegrity.getLatest.useQuery({ ventureId: selectedVenture });
  const { data: history } = trpc.missionIntegrity.getHistory.useQuery({ ventureId: selectedVenture });
  const { data: alerts } = trpc.missionIntegrity.getAlerts.useQuery({ ventureId: selectedVenture });

  const recordMutation = trpc.missionIntegrity.record.useMutation({
    onSuccess: (data) => {
      toast.success(`Mission Integrity Index updated: ${data.overallScore}/100`);
      refetch();
      setShowScoreInput(false);
    },
    onError: () => toast.error("Failed to record Mission Integrity score"),
  });

  const handleRecord = () => {
    recordMutation.mutate({ ventureId: selectedVenture, ...inputScores });
  };

  // Use live data or fall back to defaults
  const score = latest || {
    overallScore: 0,
    financialVsMissionDrift: 0,
    stakeholderAlignmentScore: 0,
    governanceStrengthScore: 0,
    leadershipContinuityScore: 0,
    trend: "Stable" as const,
    alerts: [],
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return { bg: "#dcfce7", text: "#16a34a" };
    if (s >= 60) return { bg: "#fef3c7", text: "#d97706" };
    if (s >= 40) return { bg: "#ffedd5", text: "#ea580c" };
    return { bg: "#fee2e2", text: "#dc2626" };
  };

  const scoreColor = getScoreColor(score.overallScore);
  const trend = score.trend || "Stable";
  const trendColor = trend === "Improving" ? "#16a34a" : trend === "Declining" ? "#dc2626" : "#6b7280";

  const criticalAlerts = alerts?.filter((a: any) => a.severity === "Critical" || a.severity === "High") || [];

  return (
    <div className="bg-white rounded-xl border" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} style={{ color: "#7c3aed" }} />
              <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Mission Integrity Index
              </h3>
              {criticalAlerts.length > 0 && (
                <Badge className="text-[10px]" style={{ background: "#fee2e2", color: "#dc2626", border: "none" }}>
                  {criticalAlerts.length} alert{criticalAlerts.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400">Composite mission alignment and protection score</p>
          </div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 size={14} className="animate-spin text-gray-400" />
            ) : (
              <div
                className="text-3xl font-bold font-mono"
                style={{ color: scoreColor.text }}
              >
                {score.overallScore}
              </div>
            )}
          </div>
        </div>

        {/* Venture selector */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Venture:</span>
          <div className="flex gap-1">
            {VENTURES.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVenture(v.id)}
                className="px-2 py-0.5 rounded text-[10px] font-medium transition-all"
                style={{
                  background: selectedVenture === v.id ? `${v.color}15` : "transparent",
                  color: selectedVenture === v.id ? v.color : "#9ca3af",
                  border: `1px solid ${selectedVenture === v.id ? v.color : "#f3f4f6"}`,
                }}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Overall score bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-600">Overall Score</span>
            <div className="flex items-center gap-1">
              {trend === "Improving" ? <TrendingUp size={12} style={{ color: trendColor }} /> :
               trend === "Declining" ? <TrendingDown size={12} style={{ color: trendColor }} /> :
               <Minus size={12} style={{ color: trendColor }} />}
              <span className="text-xs font-medium" style={{ color: trendColor }}>{trend}</span>
            </div>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score.overallScore}%`, background: scoreColor.text }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>0 — Critical Risk</span>
            <span>100 — Fully Protected</span>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: "Financial Drift", value: 100 - score.financialVsMissionDrift, desc: "Lower drift = better" },
            { label: "Stakeholder", value: score.stakeholderAlignmentScore, desc: "Investor/founder/employee" },
            { label: "Governance", value: score.governanceStrengthScore, desc: "Mission-protecting structures" },
            { label: "Leadership", value: score.leadershipContinuityScore, desc: "Succession readiness" },
          ].map(({ label, value, desc }) => {
            const c = getScoreColor(value);
            return (
              <div key={label} className="bg-gray-50 rounded-lg p-2.5 border" style={{ borderColor: "#f3f4f6" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-gray-600">{label}</span>
                  <span className="text-xs font-bold" style={{ color: c.text }}>{value}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${value}%`, background: c.text }} />
                </div>
                <p className="text-[9px] text-gray-400 mt-1">{desc}</p>
              </div>
            );
          })}
        </div>

        {/* Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {criticalAlerts.map((alert: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg text-xs" style={{
                background: alert.severity === "Critical" ? "#fee2e2" : "#fef3c7",
                color: alert.severity === "Critical" ? "#dc2626" : "#d97706",
              }}>
                <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                <div>
                  <strong>{alert.severity}:</strong> {alert.message}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History sparkline */}
        {history && history.length > 1 && (
          <div className="mb-4">
            <div className="text-[10px] text-gray-400 mb-1">Score History (last {history.length} readings)</div>
            <div className="flex items-end gap-1 h-8">
              {history.slice(-12).map((h: any, idx: number) => {
                const c = getScoreColor(h.overallScore);
                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-sm"
                    style={{ height: `${(h.overallScore / 100) * 100}%`, background: c.text, opacity: 0.7 }}
                    title={`${h.overallScore}/100`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Interpretation */}
        <div className="bg-blue-50 rounded-lg p-3 border text-xs text-gray-600 mb-4" style={{ borderColor: "#dbeafe" }}>
          <strong>Interpretation:</strong> Scores above 80 indicate strong mission protection. Below 60 requires immediate governance review. Based on Eric Ries' six failure patterns framework.
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs flex-1"
            onClick={() => setShowScoreInput(!showScoreInput)}
          >
            {showScoreInput ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showScoreInput ? "Hide" : "Update"} Scores
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => refetch()}
          >
            <RefreshCw size={12} /> Refresh
          </Button>
        </div>
      </div>

      {/* Score Input Panel */}
      {showScoreInput && (
        <div className="border-t p-6 pt-4 bg-gray-50 rounded-b-xl" style={{ borderColor: "#f3f4f6" }}>
          <h4 className="text-xs font-semibold text-gray-700 mb-3">Update Mission Integrity Scores</h4>
          <div className="space-y-3">
            {[
              { key: "financialVsMissionDrift", label: "Financial vs Mission Drift", desc: "How much are financial pressures pulling away from mission? (0 = no drift, 100 = fully drifted)", inverse: true },
              { key: "stakeholderAlignmentScore", label: "Stakeholder Alignment", desc: "How aligned are key stakeholders (investors, board, employees) with the mission?" },
              { key: "governanceStrengthScore", label: "Governance Strength", desc: "How strong are the governance structures protecting the mission?" },
              { key: "leadershipContinuityScore", label: "Leadership Continuity", desc: "How prepared is the organisation for leadership succession?" },
            ].map(({ key, label, desc, inverse }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">{label}</label>
                  <span className="text-xs font-bold font-mono" style={{ color: getScoreColor(inverse ? 100 - inputScores[key as keyof typeof inputScores] : inputScores[key as keyof typeof inputScores]).text }}>
                    {inputScores[key as keyof typeof inputScores]}
                  </span>
                </div>
                <input
                  type="range" min="0" max="100"
                  value={inputScores[key as keyof typeof inputScores]}
                  onChange={(e) => setInputScores({ ...inputScores, [key]: parseInt(e.target.value) })}
                  className="w-full"
                  style={{ accentColor: "#7c3aed" }}
                />
                <p className="text-[10px] text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            className="w-full mt-4 gap-2"
            style={{ background: "#7c3aed" }}
            onClick={handleRecord}
            disabled={recordMutation.isPending}
          >
            {recordMutation.isPending ? (
              <><Loader2 size={12} className="animate-spin" /> Calculating...</>
            ) : (
              "Calculate & Record Score"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
