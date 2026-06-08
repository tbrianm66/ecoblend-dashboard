// ============================================================================
// PROPOSITION OVERVIEW — Module 4 hub
// Summarises proposition readiness across all sub-sections.
// ============================================================================
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Target, Layers, BarChart2, PieChart, ShieldAlert,
  RotateCcw, CheckSquare, LayoutTemplate, ChevronRight, AlertTriangle,
} from "lucide-react";
import { VentureSelector } from "@/components/discovery/primitives";
import { pmReadinessLabel, generateModelDecision } from "@/lib/proposition-scoring";

const SECTIONS = [
  { href: "/proposition/value-proposition", label: "Value Proposition Canvas", icon: Sparkles,    description: "Define customer jobs, pains, gains, and the value map." },
  { href: "/proposition/jtbd",              label: "Jobs-to-be-Done",           icon: Target,      description: "Identify what the customer is trying to achieve." },
  { href: "/proposition/business-model",   label: "Business Model",            icon: Layers,      description: "Structure revenue model, channel, delivery, and key drivers." },
  { href: "/proposition/revenue-model",    label: "Revenue Model Test",        icon: BarChart2,   description: "Test whether the revenue model is commercially plausible." },
  { href: "/proposition/unit-economics",   label: "Unit Economics",            icon: PieChart,    description: "Model CAC, LTV, margin, and payback period." },
  { href: "/lean/canvas",                  label: "Lean Canvas",               icon: LayoutTemplate, description: "Versioned 11-block Lean Canvas linked to evidence." },
  { href: "/proposition/risks",            label: "Business Model Risk Log",   icon: ShieldAlert, description: "Capture and score risks that could invalidate the model." },
  { href: "/proposition/pivot-history",    label: "Pivot History",             icon: RotateCcw,   description: "Record every major model or proposition change." },
  { href: "/proposition/decision",         label: "Model Readiness Decision",  icon: CheckSquare, description: "Decide whether to proceed to R&D Hub / MVP definition." },
];

function scoreColor(n: number) {
  if (n >= 80) return "#16a34a";
  if (n >= 60) return "#0891b2";
  if (n >= 40) return "#d97706";
  return "#dc2626";
}

export default function PropositionOverview() {
  const [, navigate] = useLocation();
  const { selectedVentureId } = useSelectedVenture();

  const { data: score } = trpc.proposition.readiness.score.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId }
  );

  const total = score?.total ?? 0;
  const col = scoreColor(total);
  const decision = score ? generateModelDecision(total, score.overrides ?? {}) : null;

  const breakdown = score?.breakdown ?? {};
  const BREAKDOWN_ROWS = [
    { key: "vpQuality",       label: "Value Proposition Quality", weight: "20%" },
    { key: "jtbdClarity",     label: "Job Clarity (JTBD)",        weight: "15%" },
    { key: "bmReadiness",     label: "Business Model Readiness",  weight: "20%" },
    { key: "revenueEvidence", label: "Revenue Evidence",          weight: "20%" },
    { key: "unitEconConf",    label: "Unit Economics Confidence", weight: "15%" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb", background: "linear-gradient(135deg, rgba(86,168,55,0.03) 0%, rgba(59,133,186,0.03) 100%)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} style={{ color: "#56A837" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>Module 4</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Proposition & Model</h1>
        <p className="text-sm text-gray-500 mt-1">Convert discovery evidence into a structured, testable business model. Answer: can this validated problem become a repeatable, scalable, investable business?</p>
      </div>

      <div className="p-8 space-y-6">
        <VentureSelector />

        {/* Lean Startup chain */}
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Evidence flow</p>
          <div className="flex items-center gap-1 flex-wrap text-xs text-gray-500">
            {["Discovery Evidence", "Value Proposition", "JTBD", "Business Model", "Revenue Test", "Unit Economics", "Model Decision"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-1">
                <span className="px-2 py-1 rounded font-medium" style={{ background: "#f3f4f6", color: "#374151" }}>{s}</span>
                {i < arr.length - 1 && <ChevronRight size={12} style={{ color: "#9ca3af" }} />}
              </span>
            ))}
          </div>
        </div>

        {/* Readiness card */}
        {selectedVentureId && score && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Proposition & Model Readiness</h3>
                <p className="text-xs text-gray-400 mt-0.5">Weighted across VP, JTBD, BM, revenue, and unit economics</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold" style={{ color: col }}>{total}</div>
                <div className="text-xs font-semibold mt-1 px-2 py-0.5 rounded" style={{ color: col, background: `${col}18` }}>{pmReadinessLabel(total)}</div>
              </div>
            </div>
            <div className="w-full h-2.5 rounded-full mb-4" style={{ background: "#f3f4f6" }}>
              <div className="h-2.5 rounded-full transition-all" style={{ width: `${total}%`, background: col }} />
            </div>
            {/* Score breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {BREAKDOWN_ROWS.map(({ key, label, weight }) => {
                const val = (breakdown as any)[key] ?? 0;
                const c = val >= 70 ? "#16a34a" : val >= 40 ? "#d97706" : "#dc2626";
                return (
                  <div key={key} className="rounded-lg p-3" style={{ background: "#f9fafb" }}>
                    <div className="flex justify-between mb-1"><span className="text-xs text-gray-500">{label}</span><span className="text-xs text-gray-400">{weight}</span></div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#e5e7eb" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${val}%`, background: c }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: c, minWidth: 28 }}>{val}%</span>
                    </div>
                  </div>
                );
              })}
              <div className="rounded-lg p-3" style={{ background: "#f9fafb" }}>
                <div className="text-xs text-gray-500 mb-1">Lean Canvas</div>
                <div className="text-sm font-bold" style={{ color: (breakdown as any).canvasVersion > 0 ? "#16a34a" : "#6b7280" }}>
                  {(breakdown as any).canvasVersion > 0 ? `v${(breakdown as any).canvasVersion}` : "Not started"}
                </div>
              </div>
            </div>
            {/* Counts */}
            {score.counts && (
              <div className="grid grid-cols-6 gap-2 mt-4 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
                {[
                  { l: "VPs",       v: score.counts.vps },
                  { l: "JTBDs",     v: score.counts.jtbds },
                  { l: "BM Hyps",   v: score.counts.bms },
                  { l: "Rev Tests", v: score.counts.revTests },
                  { l: "UE Models", v: score.counts.ues },
                  { l: "Risks",     v: score.counts.risks, danger: score.counts.criticalRisks > 0 },
                ].map(s => (
                  <div key={s.l} className="text-center">
                    <div className="text-lg font-bold" style={{ color: s.danger ? "#dc2626" : "#1a2332" }}>{s.v}</div>
                    <div className="text-xs text-gray-400">{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Overrides */}
        {decision && decision.overrides.length > 0 && (
          <div className="space-y-2">
            {decision.overrides.map((o, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-3 border" style={{ background: "#fee2e2", borderColor: "#fca5a5" }}>
                <AlertTriangle size={14} style={{ color: "#dc2626", marginTop: 2, flexShrink: 0 }} />
                <p className="text-sm font-medium" style={{ color: "#991b1b" }}>{o}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recommendation */}
        {decision && (
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">System Recommendation</h3>
            <p className="text-sm text-gray-600">{decision.recommendation}</p>
            {decision.canProceed && (
              <Button size="sm" className="mt-3 gap-2" style={{ background: "#56A837" }} onClick={() => navigate("/proposition/decision")}>
                <CheckSquare size={13} />Review Model Decision
              </Button>
            )}
          </div>
        )}

        {/* Section navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map(({ href, label, icon: Icon, description }) => (
            <button key={href} onClick={() => navigate(href)}
              className="text-left bg-white rounded-xl border p-5 hover:shadow-md transition-all hover:border-gray-300 group"
              style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(86,168,55,0.08)" }}>
                  <Icon size={16} style={{ color: "#56A837" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">{label}</span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
