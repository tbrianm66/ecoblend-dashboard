// ============================================================================
// VENTURE INTAKE — Overview Hub (Module 2)
// Shows intake progress summary across all sub-sections.
// Sub-routes are in client/src/pages/intake/
// ============================================================================
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket, Lightbulb, ShieldAlert, FlaskConical,
  AlertTriangle, CheckSquare, LayoutTemplate,
  ChevronRight, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { VentureSelector } from "@/components/discovery/primitives";

const SECTIONS = [
  { href: "/intake/idea-capture",  label: "Idea Capture",         icon: Lightbulb,      description: "Structure the venture idea with strategic and sustainability context." },
  { href: "/intake/assumptions",   label: "Founder Assumptions",  icon: ShieldAlert,    description: "Capture every belief the team holds before evidence exists." },
  { href: "/intake/hypotheses",    label: "Hypotheses",           icon: FlaskConical,   description: "Define testable customer, problem, and value proposition hypotheses." },
  { href: "/intake/riskiest",      label: "Riskiest Assumption",  icon: AlertTriangle,  description: "Identify the assumption most likely to invalidate the venture.", accentColor: "#dc2626" },
  { href: "/lean/canvas",          label: "Initial Venture Canvas", icon: LayoutTemplate, description: "Capture the first-pass baseline canvas as an intake snapshot with version history." },
  { href: "/intake/decision",      label: "Intake Decision",      icon: CheckSquare,    description: "Review the readiness scorecard and make a structured go/no-go decision." },
];

function scoreColor(score: number) {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#0891b2";
  if (score >= 40) return "#d97706";
  return "#dc2626";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Strong intake package";
  if (score >= 60) return "Ready for initial discovery";
  if (score >= 40) return "Needs more definition";
  return "Not ready";
}

export default function VentureIntake() {
  const [, navigate] = useLocation();
  const { selectedVentureId } = useSelectedVenture();

  const { data: score } = trpc.intake.readiness.score.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId }
  );

  const total = score?.total ?? 0;
  const col = scoreColor(total);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb", background: "linear-gradient(135deg, rgba(86,168,55,0.03) 0%, rgba(59,133,186,0.03) 100%)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Rocket size={18} style={{ color: "#56A837" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>Module 2</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Venture Intake</h1>
        <p className="text-sm text-gray-500 mt-1">
          Front-end hypothesis capture and assumption-definition layer. Every venture must define its assumptions, hypotheses, and riskiest test before entering Discovery &amp; Market.
        </p>
      </div>

      <div className="p-8 space-y-6">
        <VentureSelector />

        {/* Readiness score panel */}
        {selectedVentureId && score && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Intake Readiness Score</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Stage: <strong>{score.currentStage ?? "intake"}</strong> · Status: <strong>{score.currentStatus ?? "idea"}</strong>
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: col }}>{total}</div>
                <div className="text-xs font-semibold mt-1 px-2 py-0.5 rounded" style={{ color: col, background: `${col}18` }}>{scoreLabel(total)}</div>
              </div>
            </div>
            <div className="w-full h-2.5 rounded-full" style={{ background: "#f3f4f6" }}>
              <div className="h-2.5 rounded-full transition-all" style={{ width: `${total}%`, background: col }} />
            </div>
            {score.hasCriticalUntested && (
              <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "#dc2626" }}>
                <AlertTriangle size={12} />
                {score.counts?.criticalUntested} critical assumption{(score.counts?.criticalUntested ?? 0) > 1 ? "s" : ""} without evidence — define riskiest assumption test first.
              </div>
            )}

            {/* Counts row */}
            {score.counts && (
              <div className="grid grid-cols-5 gap-3 mt-4 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
                {[
                  { label: "Ideas",       value: score.counts.ideas },
                  { label: "Assumptions", value: score.counts.assumptions },
                  { label: "Hypotheses",  value: score.counts.hypotheses },
                  { label: "Riskiest",    value: score.counts.riskiest },
                  { label: "High Risk",   value: score.counts.highRisk, color: score.counts.highRisk > 0 ? "#f97316" : undefined },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-xl font-bold" style={{ color: s.color ?? "#1a2332" }}>{s.value}</div>
                    <div className="text-xs text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lean Startup flow diagram */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Lean Startup Intake Flow</h3>
          <div className="flex items-center gap-1 flex-wrap text-xs text-gray-500">
            {["Idea", "Assumptions", "Hypotheses", "Riskiest Assumption", "First Experiment", "Intake Decision"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-1">
                <span className="px-2 py-1 rounded font-medium" style={{ background: "#f3f4f6", color: "#374151" }}>{s}</span>
                {i < arr.length - 1 && <ChevronRight size={12} style={{ color: "#9ca3af" }} />}
              </span>
            ))}
          </div>
        </div>

        {/* Section navigation cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map(({ href, label, icon: Icon, description, accentColor }) => (
            <button
              key={href}
              onClick={() => navigate(href)}
              className="text-left bg-white rounded-xl border p-5 hover:shadow-md transition-all hover:border-gray-300 group"
              style={{ borderColor: "#e5e7eb" }}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(86,168,55,0.08)" }}>
                  <Icon size={16} style={{ color: accentColor ?? "#56A837" }} />
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

        {/* Integration note */}
        <div className="rounded-xl p-4 border text-xs text-gray-500" style={{ background: "#f9fafb", borderColor: "#e5e7eb" }}>
          <span className="font-semibold text-gray-700">Integration outputs:</span>{" "}
          Customer segment + problem + value proposition hypotheses feed <span className="text-blue-600">Discovery &amp; Market</span> ·
          Business model + venture model canvas feed <span className="text-purple-600">Proposition &amp; Model</span> ·
          Solution + technical assumptions feed <span className="text-green-600">R&amp;D Hub</span> ·
          Intake decision + alerts surface in <span className="text-orange-600">Command Centre</span>
        </div>
      </div>
    </div>
  );
}
