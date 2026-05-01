// ============================================================
// READINESS SCORING MODULE — 7-Dimension Composite Dashboard
// Architecture Module 10 — Phase 4 MVP
// ============================================================
import ContextualWidgetPanel from "@/components/ContextualWidgetPanel";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PieChart, TrendingUp, FlaskConical, Briefcase, Factory,
  Leaf, Heart, Users, AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import { useVentures } from "@/contexts/VentureContext";

// ── Scoring Configuration ──
const DIMENSIONS = [
  { key: "vrl", label: "VRL", fullLabel: "Venture Readiness", weight: 0.20, icon: TrendingUp, color: "#51AF37" },
  { key: "trl", label: "TRL", fullLabel: "Technology Readiness", weight: 0.20, icon: FlaskConical, color: "#3A97D3" },
  { key: "brl", label: "BRL", fullLabel: "Business Readiness", weight: 0.20, icon: Briefcase, color: "#F49C13" },
  { key: "mrl", label: "MRL", fullLabel: "Manufacturing Readiness", weight: 0.15, icon: Factory, color: "#8b5cf6" },
  { key: "srl", label: "SRL", fullLabel: "Sustainability Readiness", weight: 0.10, icon: Leaf, color: "#059669" },
  { key: "irl", label: "IRL", fullLabel: "Impact Readiness", weight: 0.10, icon: Heart, color: "#ec4899" },
  { key: "prl", label: "PRL", fullLabel: "People Readiness", weight: 0.05, icon: Users, color: "#6366f1" },
];

// ── Recommendation Logic ──
function getRecommendation(composite: number, confidence: number, criticalRisks: number) {
  if (composite >= 6.0 && confidence >= 3.5 && criticalRisks === 0) return { label: "Proceed", color: "#16a34a", bg: "#dcfce7" };
  if (composite >= 4.0 && confidence >= 3.0 && criticalRisks <= 2) return { label: "Pause", color: "#d97706", bg: "#fef3c7" };
  if (composite < 4.0) return { label: "Pivot", color: "#dc2626", bg: "#fee2e2" };
  return { label: "Terminate", color: "#7f1d1d", bg: "#fecaca" };
}

// ── Sample venture scoring data ──
interface VentureScore {
  ventureId: string;
  ventureName: string;
  color: string;
  scores: Record<string, { score: number; confidence: number; evidenceCount: number }>;
  criticalRisks: number;
}

export default function ReadinessScoring() {
  const { ventures } = useVentures();

  // Generate sample scores from existing venture data
  const ventureScores: VentureScore[] = ventures.slice(0, 5).map(v => ({
    ventureId: v.id,
    ventureName: v.name,
    color: v.color,
    scores: {
      vrl: { score: Math.min(9, v.vrl * 2.25), confidence: 3.8, evidenceCount: 12 },
      trl: { score: v.trl, confidence: 3.5, evidenceCount: 8 },
      brl: { score: Math.min(9, (v.vrl + v.trl / 2.25) * 1.1), confidence: 3.2, evidenceCount: 6 },
      mrl: { score: Math.min(9, v.trl * 0.7), confidence: 2.8, evidenceCount: 4 },
      srl: { score: 5.5, confidence: 3.0, evidenceCount: 5 },
      irl: { score: 6.0, confidence: 3.2, evidenceCount: 7 },
      prl: { score: v.vrlPercent / 100 * 9, confidence: 4.0, evidenceCount: 15 },
    },
    criticalRisks: v.vrl < 2 ? 2 : 0,
  }));

  const [selectedVenture, setSelectedVenture] = useState<VentureScore | null>(ventureScores[0] || null);

  // Calculate composite for selected venture
  const composite = selectedVenture
    ? DIMENSIONS.reduce((sum, d) => sum + (selectedVenture.scores[d.key]?.score || 0) * d.weight, 0)
    : 0;
  const avgConfidence = selectedVenture
    ? DIMENSIONS.reduce((sum, d) => sum + (selectedVenture.scores[d.key]?.confidence || 0), 0) / 7
    : 0;
  const recommendation = selectedVenture
    ? getRecommendation(composite, avgConfidence, selectedVenture.criticalRisks)
    : { label: "—", color: "#6b7280", bg: "#f3f4f6" };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2 mb-1">
          <PieChart size={18} style={{ color: "#51AF37" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#51AF37" }}>Module 10</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
          Readiness Scoring Engine
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          7-dimension composite readiness assessment with evidence confidence weighting.
        </p>
      </div>

      <div className="p-8">
        {/* Venture selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {ventureScores.map(vs => (
            <button
              key={vs.ventureId}
              onClick={() => setSelectedVenture(vs)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: selectedVenture?.ventureId === vs.ventureId ? `${vs.color}15` : "#f9fafb",
                border: `1px solid ${selectedVenture?.ventureId === vs.ventureId ? vs.color : "#e5e7eb"}`,
                color: selectedVenture?.ventureId === vs.ventureId ? vs.color : "#6b7280",
              }}
            >
              {vs.ventureName}
            </button>
          ))}
        </div>

        {selectedVenture && (
          <>
            {/* Composite Score + Recommendation */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Composite Score</span>
                <div className="text-4xl font-bold mt-2" style={{ color: "#1a2332", fontFamily: "'Prompt', sans-serif" }}>
                  {composite.toFixed(1)}
                  <span className="text-sm font-normal text-gray-400 ml-1">/ 9.0</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 mt-3 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(composite / 9) * 100}%`, background: "#51AF37" }} />
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Evidence Confidence</span>
                <div className="text-4xl font-bold mt-2" style={{ color: avgConfidence >= 3.5 ? "#16a34a" : avgConfidence >= 3.0 ? "#d97706" : "#dc2626", fontFamily: "'Prompt', sans-serif" }}>
                  {avgConfidence.toFixed(1)}
                  <span className="text-sm font-normal text-gray-400 ml-1">/ 5.0</span>
                </div>
                {avgConfidence < 3.0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                    <AlertTriangle size={10} /> Low confidence — more evidence needed
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Recommendation</span>
                <div className="mt-2">
                  <Badge className="text-lg px-3 py-1" style={{ background: recommendation.bg, color: recommendation.color, border: "none" }}>
                    {recommendation.label}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Based on composite ≥ 6.0, confidence ≥ 3.5, 0 critical risks
                </p>
              </div>
            </div>

            {/* 7-Dimension Breakdown */}
            <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  Dimension Breakdown
                </h2>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Info size={10} />
                  Formula: Composite = Σ(Score × Weight)
                </div>
              </div>

              <div className="space-y-3">
                {DIMENSIONS.map(d => {
                  const data = selectedVenture.scores[d.key];
                  const DimIcon = d.icon;
                  const contribution = (data?.score || 0) * d.weight;
                  return (
                    <div key={d.key} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-48">
                        <DimIcon size={14} style={{ color: d.color }} />
                        <span className="text-sm font-medium text-gray-700">{d.fullLabel}</span>
                      </div>
                      <div className="flex-1">
                        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${((data?.score || 0) / 9) * 100}%`, background: d.color }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-sm font-bold" style={{ color: d.color }}>{(data?.score || 0).toFixed(1)}</span>
                        <span className="text-xs text-gray-400">/9</span>
                      </div>
                      <div className="w-16 text-right text-xs text-gray-400">
                        ×{(d.weight * 100).toFixed(0)}%
                      </div>
                      <div className="w-12 text-right text-xs font-mono" style={{ color: d.color }}>
                        {contribution.toFixed(2)}
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{
                          background: (data?.confidence || 0) >= 3.5 ? "#dcfce7" : (data?.confidence || 0) >= 3.0 ? "#fef3c7" : "#fee2e2",
                          color: (data?.confidence || 0) >= 3.5 ? "#16a34a" : (data?.confidence || 0) >= 3.0 ? "#d97706" : "#dc2626",
                        }}>
                          C:{(data?.confidence || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Formula footer */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: "#f3f4f6" }}>
                <span className="text-xs text-gray-400 font-mono">
                  = ({DIMENSIONS.map(d => `${(selectedVenture.scores[d.key]?.score || 0).toFixed(1)}×${(d.weight * 100).toFixed(0)}%`).join(" + ")})
                </span>
                <span className="text-sm font-bold" style={{ color: "#51AF37" }}>
                  = {composite.toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

        {/* Contextual Playbook Guidance */}
        <div className="p-8 pt-0">
          <ContextualWidgetPanel module="Readiness Scoring" ventureId={null} page="scoring" workflowStage="Validation" />
        </div>
    </div>
  );
}
