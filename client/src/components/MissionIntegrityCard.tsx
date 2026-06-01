// ============================================================
// MISSION INTEGRITY INDEX CARD
// Phase 5A — Mission Protection Framework
// Displays composite mission alignment score with trend
// ============================================================

import { AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MissionIntegrityCardProps {
  overallScore: number;           // 0-100
  financialVsMissionDrift: number; // 0-100 divergence
  stakeholderAlignment: number;    // 0-100
  governanceStrength: number;      // 0-100
  leadershipContinuity: number;    // 0-100
  trend: "Improving" | "Stable" | "Declining";
}

export default function MissionIntegrityCard(props: MissionIntegrityCardProps) {
  const {
    overallScore,
    financialVsMissionDrift,
    stakeholderAlignment,
    governanceStrength,
    leadershipContinuity,
    trend,
  } = props;

  // Color coding for score bands
  const getScoreColor = (score: number): { bg: string; text: string; border: string } => {
    if (score >= 80) return { bg: "#dcfce7", text: "#16a34a", border: "#16a34a" };
    if (score >= 60) return { bg: "#fef3c7", text: "#d97706", border: "#d97706" };
    if (score >= 40) return { bg: "#ffedd5", text: "#ea580c", border: "#ea580c" };
    return { bg: "#fee2e2", text: "#dc2626", border: "#dc2626" };
  };

  const scoreColor = getScoreColor(overallScore);
  const driftColor = getScoreColor(100 - financialVsMissionDrift); // Inverse: lower drift = better

  const trendIcon = trend === "Improving" ? <TrendingUp size={14} /> : trend === "Declining" ? <TrendingDown size={14} /> : <Minus size={14} />;
  const trendColor = trend === "Improving" ? "#16a34a" : trend === "Declining" ? "#dc2626" : "#6b7280";

  return (
    <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} style={{ color: "#7c3aed" }} />
            <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Mission Integrity Index
            </h3>
          </div>
          <p className="text-xs text-gray-400">Composite mission alignment & protection score</p>
        </div>
        <Badge
          className="text-xs px-2 py-1"
          style={{
            background: scoreColor.bg,
            color: scoreColor.text,
            border: `1px solid ${scoreColor.border}`,
          }}
        >
          {trend === "Improving" ? "↑" : trend === "Declining" ? "↓" : "→"} {trend}
        </Badge>
      </div>

      {/* Overall Score Gauge */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-600">Overall Score</span>
          <span className="text-2xl font-bold" style={{ color: scoreColor.text, fontFamily: "'Prompt', sans-serif" }}>
            {overallScore}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${overallScore}%`,
              background: scoreColor.text,
            }}
          />
        </div>
      </div>

      {/* Sub-scores Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Financial vs Mission Drift */}
        <div className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: "#f3f4f6" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Financial Drift</span>
            <span className="text-sm font-bold" style={{ color: driftColor.text }}>
              {100 - financialVsMissionDrift}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${100 - financialVsMissionDrift}%`,
                background: driftColor.text,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Lower = better alignment</p>
        </div>

        {/* Stakeholder Alignment */}
        <div className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: "#f3f4f6" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Stakeholder</span>
            <span className="text-sm font-bold" style={{ color: getScoreColor(stakeholderAlignment).text }}>
              {stakeholderAlignment}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${stakeholderAlignment}%`,
                background: getScoreColor(stakeholderAlignment).text,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Investor/founder/employee</p>
        </div>

        {/* Governance Strength */}
        <div className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: "#f3f4f6" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Governance</span>
            <span className="text-sm font-bold" style={{ color: getScoreColor(governanceStrength).text }}>
              {governanceStrength}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${governanceStrength}%`,
                background: getScoreColor(governanceStrength).text,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Mission-protecting structures</p>
        </div>

        {/* Leadership Continuity */}
        <div className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: "#f3f4f6" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Leadership</span>
            <span className="text-sm font-bold" style={{ color: getScoreColor(leadershipContinuity).text }}>
              {leadershipContinuity}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${leadershipContinuity}%`,
                background: getScoreColor(leadershipContinuity).text,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Succession readiness</p>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-blue-50 rounded-lg p-3 border text-xs text-gray-600" style={{ borderColor: "#dbeafe" }}>
        <p>
          <strong>Interpretation:</strong> Mission Integrity Index measures how well a venture is protected against the six failure patterns documented in Eric Ries' "Incorruptible." Higher scores indicate stronger mission protection mechanisms.
        </p>
      </div>

      {/* Trend indicator */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: trendColor }}
        />
        <span className="text-xs text-gray-500">
          Trend: <strong style={{ color: trendColor }}>{trend}</strong>
        </span>
      </div>
    </div>
  );
}
