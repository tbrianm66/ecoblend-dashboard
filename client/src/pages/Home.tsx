// ============================================================
// ECOBLEND PORTFOLIO OVERVIEW PAGE
// Design: Precision Industrial — hub-and-spoke + KPI cards
// ============================================================

import { useState } from "react";
import { useLocation } from "wouter";
import HubSpokeDiagram from "@/components/HubSpokeDiagram";
import { ventures, portfolioStats, VRL_STAGES, TRL_LEVELS } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/ecoblend-hero-bg-4sozsAnSEGXN6NLMPzPbzp.webp";

const statusColors: Record<string, string> = {
  "Active": "#22c55e",
  "Pre-Launch": "#f59e0b",
  "Scaling": "#1d4ed8",
  "Paused": "#6b7280",
};

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-1 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-3xl font-bold" style={{ color: accent || "#1c1c1e", fontFamily: "'DM Mono', monospace" }}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

function VentureCard({ venture, onClick }: { venture: typeof ventures[0]; onClick: () => void }) {
  const vrlStage = VRL_STAGES[venture.vrl - 1];
  const trlLevel = TRL_LEVELS[venture.trl - 1];

  return (
    <div
      className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition-all duration-200 group"
      style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${venture.color}` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold" style={{ color: venture.color, fontFamily: "'DM Sans', sans-serif" }}>
              {venture.name}
            </span>
            <Badge
              variant="outline"
              className="text-xs"
              style={{ borderColor: venture.color, color: venture.color, background: `${venture.color}10` }}
            >
              {venture.channel}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">{venture.tagline}</p>
        </div>
        <span
          className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: `${statusColors[venture.status]}15`, color: statusColors[venture.status] }}
        >
          {venture.status}
        </span>
      </div>

      {/* VRL Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#22c55e" }} />
            VRL {venture.vrl} — {vrlStage.label}
          </span>
          <span className="text-xs font-mono text-gray-400">{Math.round((venture.vrl - 1 + venture.vrlPercent / 100) / 4 * 100)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${((venture.vrl - 1) / 4 + venture.vrlPercent / 400) * 100}%`, background: "#22c55e" }}
          />
        </div>
      </div>

      {/* TRL Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#1d4ed8" }} />
            TRL {venture.trl} — {trlLevel.label}
          </span>
          <span className="text-xs font-mono text-gray-400">{Math.round((venture.trl - 1 + venture.trlPercent / 100) / 9 * 100)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${((venture.trl - 1) / 9 + venture.trlPercent / 900) * 100}%`, background: "#1d4ed8" }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-400">Milestones:</span>
        <div className="flex gap-1">
          {venture.milestones.map((m, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: m.completed ? venture.color : "#e5e7eb" }}
              title={m.label}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">
          {venture.milestones.filter(m => m.completed).length}/{venture.milestones.length} done
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeDomain, setActiveDomain] = useState("portfolio");
  const [, navigate] = useLocation();

  const handleDomainClick = (domainId: string) => {
    setActiveDomain(domainId);
    const routes: Record<string, string> = {
      portfolio: "/", vrl: "/vrl", trl: "/trl", risk: "/risk",
      investment: "/investment", brand: "/brand", ip: "/ip",
      people: "/people", marketing: "/marketing", financial: "/financial",
      bcorp: "/bcorp", foundation: "/foundation",
    };
    if (routes[domainId] && routes[domainId] !== "/") {
      navigate(routes[domainId]);
    } else {
      toast.info("Module selected", { description: `Viewing ${domainId} analytics` });
    }
  };

  const handleVentureClick = (ventureId: string) => {
    navigate(`/venture/${ventureId}`);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero header */}
      <div
        className="relative px-8 py-8 border-b"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "right center",
          borderColor: "#e5e7eb",
        }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.88)" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#22c55e15", color: "#22c55e" }}>
              EcoRace VBS
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400 font-mono">H4 Lean Methodology</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            EcoBlend Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 max-w-xl">
            Dual-readiness portfolio intelligence — tracking Venture Readiness Level (VRL) and Technology Readiness Level (TRL) across all active ventures.
          </p>
        </div>
      </div>

      <div className="p-8">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Active Ventures" value={portfolioStats.activeVentures} sub={`of ${portfolioStats.totalVentures} total`} accent="#22c55e" />
          <KpiCard label="Avg VRL Stage" value={portfolioStats.avgVrl.toFixed(1)} sub="of 4 stages" accent="#22c55e" />
          <KpiCard label="Avg TRL Level" value={portfolioStats.avgTrl.toFixed(1)} sub="of 9 levels" accent="#1d4ed8" />
          <KpiCard
            label="Milestones"
            value={`${portfolioStats.totalMilestonesCompleted}/${portfolioStats.totalMilestones}`}
            sub="completed"
            accent="#f59e0b"
          />
        </div>

        {/* Main content: Hub diagram + Venture cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* Hub-and-spoke diagram */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Portfolio Analytics Hub
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Click a domain node to navigate · Click a venture to drill down</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 rounded inline-block" style={{ background: "#22c55e" }} />
                  VRL
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 rounded inline-block" style={{ background: "#1d4ed8" }} />
                  TRL
                </span>
              </div>
            </div>
            <HubSpokeDiagram
              onDomainClick={handleDomainClick}
              onVentureClick={handleVentureClick}
              activeDomain={activeDomain}
            />
          </div>

          {/* Venture cards */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Venture Portfolio
              </h2>
              <span className="text-xs text-gray-400 font-mono">{ventures.length} ventures tracked</span>
            </div>
            {ventures.map((venture) => (
              <VentureCard
                key={venture.id}
                venture={venture}
                onClick={() => handleVentureClick(venture.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
