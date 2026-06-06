// ============================================================
// ECOBLEND OS — NoVentureSelectedState
// Shown inside contextual widget panels when no venture is
// selected. Provides actionable CTAs.
// ============================================================

import { Building2, LayoutDashboard, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { useAuth } from "@/_core/hooks/useAuth";

export default function NoVentureSelectedState() {
  const [, navigate] = useLocation();
  const { availableVentures, setSelectedVentureId } = useSelectedVenture();
  const { user } = useAuth();

  const firstVenture = availableVentures[0];

  return (
    <div
      className="rounded-xl p-5 flex flex-col items-center gap-3 text-center"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: "rgba(86, 168, 55,0.12)" }}
      >
        <Building2 size={20} style={{ color: "#56A837" }} />
      </div>

      <div>
        <p
          className="text-sm font-semibold mb-1"
          style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'Prompt', sans-serif" }}
        >
          No venture selected
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif", maxWidth: "240px" }}
        >
          Select a venture to view venture-specific guidance, missing evidence, risks, scores, and stage-gate recommendations.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full mt-1">
        {firstVenture && (
          <button
            onClick={() => setSelectedVentureId(firstVenture.id)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: "#56A837",
              color: "white",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Building2 size={12} />
            Select {firstVenture.name}
          </button>
        )}

        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.65)",
            border: "1px solid rgba(255,255,255,0.09)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <LayoutDashboard size={12} />
          Go to Portfolio Overview
        </button>

        {(user?.role === "admin" || user?.role === "user") && (
          <button
            onClick={() => navigate("/pipeline")}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.07)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Plus size={12} />
            Create New Venture
          </button>
        )}
      </div>
    </div>
  );
}
