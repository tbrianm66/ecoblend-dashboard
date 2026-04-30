// ============================================================
// MODULE PLACEHOLDER — Displays module info with coming-soon state
// Used for new architecture modules that are scaffolded but not yet built
// ============================================================

import { useLocation } from "wouter";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Map route prefixes to module metadata
const MODULE_META: Record<string, { module: string; phase: string; description: string }> = {
  "/intake": { module: "Venture Intake", phase: "Phase 1", description: "New venture intake, problem statements, hypothesis registers, and founder profiling." },
  "/discovery": { module: "Discovery & Market Validation", phase: "Phase 2", description: "Customer discovery interviews, competitor mapping, demand signals, and willingness-to-pay assessment." },
  "/proposition": { module: "Proposition & Business Model", phase: "Phase 2", description: "Value proposition design, Business Model Canvas, revenue modelling, and unit economics." },
  "/rnd": { module: "R&D Hub", phase: "Phase 3", description: "4-stage R&D lifecycle (Concept → Simulation → Prototype → Integration), technical KPIs, and IP tracking." },
  "/operations": { module: "Operations & Manufacturing", phase: "Phase 3", description: "Operating model design, supplier assessment, manufacturing planning, and quality compliance." },
  "/gtm": { module: "Brand & Go-To-Market", phase: "Phase 3", description: "Brand readiness, messaging tests, marketing strategy, campaign experiments, and sales pipeline." },
  "/sustainability": { module: "Sustainability & Impact", phase: "Phase 3", description: "Sustainability evidence, impact metrics (IRL), LCA/carbon tracking, circularity, and B Corp/ESG." },
  "/risk": { module: "Risk Intelligence", phase: "Phase 4", description: "Central risk register with FMEA-based RPN scoring, risk heatmap, and mitigation planning." },
  "/scoring": { module: "Readiness Scoring", phase: "Phase 4", description: "7-dimension composite readiness score (VRL, TRL, BRL, MRL, SRL, IRL, PRL) with evidence confidence." },
  "/investment": { module: "Investment Readiness", phase: "Phase 5", description: "Investment thesis, financial model, investor data room, and pack export with gating logic." },
  "/execution": { module: "Execution Planning", phase: "Phase 5", description: "Execution roadmap, milestone tracker, budget planning, and hiring plan." },
  "/coaching": { module: "Coaching", phase: "Built", description: "Founder coaching dashboard, studio analytics, and coach management." },
  "/collaboration": { module: "Collaboration", phase: "Phase 5", description: "Team workspace, advisor directory, academic partners, and specialist services." },
  "/governance": { module: "Governance", phase: "Phase 6", description: "Stage-gate approvals, board reporting, audit trail, IP register, and legal repository." },
  "/venture-status": { module: "Venture Status", phase: "Phase 1", description: "Portfolio-wide venture status with stage indicators and recommendation signals." },
  "/alerts": { module: "Alerts & Approvals", phase: "Phase 1", description: "Centralised alert feed and pending approval queue." },
};

function getModuleMeta(path: string) {
  // Try exact match first, then prefix match
  if (MODULE_META[path]) return MODULE_META[path];
  const prefix = Object.keys(MODULE_META).find(p => path.startsWith(p));
  if (prefix) return MODULE_META[prefix];
  return { module: "Module", phase: "Planned", description: "This module is part of the EcoBlend OS architecture and will be built in a future phase." };
}

export default function ModulePlaceholder() {
  const [location, navigate] = useLocation();
  const meta = getModuleMeta(location);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto mt-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(81,175,55,0.1)" }}>
            <Construction size={24} style={{ color: "#51AF37" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {meta.module}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(81,175,55,0.1)", color: "#51AF37" }}>
              {meta.phase}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: "#e5e7eb" }}>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {meta.description}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: "#f0f0f0" }}>
            <p className="text-xs text-gray-500 font-medium mb-2">Architecture Reference</p>
            <p className="text-xs text-gray-400 font-mono">
              Route: {location}
            </p>
            <p className="text-xs text-gray-400 font-mono">
              Build Phase: {meta.phase}
            </p>
          </div>
        </div>

        {/* Back button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={14} />
          Back to Command Centre
        </Button>
      </div>
    </div>
  );
}
