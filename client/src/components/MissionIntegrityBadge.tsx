// ============================================================
// MISSION INTEGRITY BADGE
// Phase 5F — Cross-module MII integration
// Compact score chip with trend arrow for embedding in page headers
// ============================================================

import { TrendingUp, TrendingDown, Minus, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";

interface MissionIntegrityBadgeProps {
  ventureId?: string;       // If provided, shows score for a specific venture
  variant?: "chip" | "card" | "tile"; // Display variant
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 75) return "#51AF37";
  if (score >= 55) return "#F49C13";
  if (score >= 35) return "#ef4444";
  return "#dc2626";
}

function getScoreLabel(score: number): string {
  if (score >= 75) return "Protected";
  if (score >= 55) return "Moderate";
  if (score >= 35) return "At Risk";
  return "Critical";
}

function getShieldIcon(score: number) {
  if (score >= 75) return ShieldCheck;
  if (score >= 35) return Shield;
  return ShieldAlert;
}

export default function MissionIntegrityBadge({
  ventureId,
  variant = "chip",
  className = "",
}: MissionIntegrityBadgeProps) {
  const [, navigate] = useLocation();

  // If no ventureId, show portfolio summary
  const { data: portfolioSummary } = trpc.missionIntegrity.getPortfolioSummary.useQuery(undefined, {
    enabled: !ventureId,
    staleTime: 60_000,
  });

  const { data: latest } = trpc.missionIntegrity.getLatest.useQuery(
    { ventureId: ventureId! },
    { enabled: !!ventureId, staleTime: 60_000 }
  );

  const score = ventureId
    ? (latest?.overallScore ?? null)
    : (portfolioSummary?.avgScore ?? null);

  const trend = ventureId ? (latest?.trend ?? "Stable") : "Stable";
  const atRisk = ventureId ? false : (portfolioSummary?.atRisk ?? 0) > 0;

  // Loading state — show skeleton
  if (score === null) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 animate-pulse ${className}`}>
        <div className="w-3 h-3 rounded-full bg-gray-300" />
        <div className="w-8 h-3 rounded bg-gray-300" />
      </div>
    );
  }

  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const ShieldIcon = getShieldIcon(score);

  const TrendIcon = trend === "Improving" ? TrendingUp : trend === "Declining" ? TrendingDown : Minus;
  const trendColor = trend === "Improving" ? "#51AF37" : trend === "Declining" ? "#ef4444" : "#6b7280";

  if (variant === "chip") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/risk-intelligence")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80 ${className}`}
              style={{
                background: `${color}12`,
                borderColor: `${color}30`,
                color,
              }}
            >
              <ShieldIcon size={11} />
              <span>MII {score}</span>
              <TrendIcon size={10} style={{ color: trendColor }} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="font-semibold">Mission Integrity Index</div>
            <div className="text-gray-400">{label} · {trend}</div>
            {atRisk && <div className="text-red-400 mt-0.5">⚠ {portfolioSummary?.atRisk} venture(s) at risk</div>}
            <div className="text-gray-400 mt-0.5">Click to view Risk Intelligence</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "tile") {
    return (
      <button
        onClick={() => navigate("/risk-intelligence")}
        className={`flex flex-col gap-1 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow text-left ${className}`}
        style={{ borderColor: `${color}30`, background: `${color}08` }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6b7280" }}>
            Mission Integrity
          </span>
          <TrendIcon size={12} style={{ color: trendColor }} />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold" style={{ color, fontFamily: "'Prompt', sans-serif" }}>
            {score}
          </span>
          <span className="text-xs text-gray-400 pb-0.5">/ 100</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldIcon size={11} style={{ color }} />
          <span className="text-xs font-medium" style={{ color }}>{label}</span>
          {atRisk && (
            <span className="text-xs text-red-400 ml-auto">{portfolioSummary?.atRisk} at risk</span>
          )}
        </div>
      </button>
    );
  }

  // variant === "card"
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border ${className}`}
      style={{ borderColor: `${color}30`, background: `${color}08` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <ShieldIcon size={20} style={{ color }} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Mission Integrity Index
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xl font-bold" style={{ color, fontFamily: "'Prompt', sans-serif" }}>
              {score}/100
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${color}20`, color }}
            >
              {label}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <TrendIcon size={16} style={{ color: trendColor }} />
        <span className="text-xs text-gray-400">{trend}</span>
        {atRisk && (
          <span className="text-xs text-red-400">{portfolioSummary?.atRisk} at risk</span>
        )}
      </div>
    </div>
  );
}
