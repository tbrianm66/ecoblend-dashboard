// ============================================================
// ECOBLEND PORTFOLIO OVERVIEW PAGE
// Design: Precision Industrial — hub-and-spoke + KPI cards
// Uses VentureContext for live, editable data
// ============================================================

import { useState } from "react";
import { useLocation } from "wouter";
import HubSpokeDiagram from "@/components/HubSpokeDiagram";
import { VRL_STAGES, TRL_LEVELS, Venture } from "@/lib/data";
import { useVentures } from "@/contexts/VentureContext";
import EditReadinessModal from "@/components/EditReadinessModal";
import MilestoneEditModal from "@/components/MilestoneEditModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pencil, UserPlus, RotateCcw, ListChecks, FileDown, Briefcase } from "lucide-react";
import { exportPortfolioPdf, exportInvestorPack } from "@/lib/exportPdf";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/ecoblend-hero-bg-4sozsAnSEGXN6NLMPzPbzp.webp";

const statusColors: Record<string, string> = {
  "Active": "#51AF37",
  "Pre-Launch": "#F49C13",
  "Scaling": "#3A97D3",
  "Paused": "#6b7280",
};

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-1 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-3xl font-bold" style={{ color: accent || "#1a2332", fontFamily: "'Prompt', sans-serif" }}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

function VentureCard({
  venture,
  onClick,
  onEdit,
  onEditMilestones,
}: {
  venture: Venture;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onEditMilestones: (e: React.MouseEvent) => void;
}) {
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
            <span className="text-lg font-bold" style={{ color: venture.color, fontFamily: "'Prompt', sans-serif" }}>
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
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${statusColors[venture.status]}15`, color: statusColors[venture.status] }}
          >
            {venture.status}
          </span>
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
            title="Edit readiness scores"
          >
            <Pencil size={13} style={{ color: "#6b7280" }} />
          </button>
          <button
            onClick={onEditMilestones}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
            title="Edit milestones"
          >
            <ListChecks size={13} style={{ color: "#6b7280" }} />
          </button>
        </div>
      </div>

      {/* VRL Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#22c55e" }} />
            VRL {venture.vrl} — {vrlStage?.label}
          </span>
          <span className="text-xs font-mono text-gray-400">{venture.vrlPercent}%</span>
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
            TRL {venture.trl} — {trlLevel?.label}
          </span>
          <span className="text-xs font-mono text-gray-400">{venture.trlPercent}%</span>
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
  const { ventures, stats, resetToDefaults } = useVentures();
  const portfolioBrands = ventures.filter(v => !v.isInternalLab);
  const internalLab = ventures.find(v => v.isInternalLab);
  const [editingVenture, setEditingVenture] = useState<Venture | null>(null);
  const [milestonesVenture, setMilestonesVenture] = useState<Venture | null>(null);

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
    }
  };

  const handleVentureClick = (ventureId: string) => {
    navigate(`/venture/${ventureId}`);
  };

  const handleEditClick = (e: React.MouseEvent, venture: Venture) => {
    e.stopPropagation();
    setEditingVenture(venture);
  };

  const handleMilestonesClick = (e: React.MouseEvent, venture: Venture) => {
    e.stopPropagation();
    setMilestonesVenture(venture);
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
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#51AF3715", color: "#51AF37" }}>
                EcoRace VBS
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">H4 Lean Methodology</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              EcoBlend Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Dual-readiness portfolio intelligence — tracking Venture Readiness Level (VRL) and Technology Readiness Level (TRL) across all active ventures.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => navigate("/onboarding")}
              style={{ borderColor: "#51AF37", color: "#51AF37" }}
            >
              <UserPlus size={13} /> Onboard Founder
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => exportPortfolioPdf(ventures)}
              style={{ borderColor: "#3A97D3", color: "#3A97D3" }}
            >
              <FileDown size={13} /> Export PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => exportInvestorPack(ventures)}
              style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}
            >
              <Briefcase size={13} /> Investor Pack
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs text-gray-400"
              onClick={() => {
                resetToDefaults();
                toast.success("Data reset to defaults");
              }}
            >
              <RotateCcw size={13} /> Reset Data
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* KPI row — live from context */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Active Ventures" value={stats.activeVentures} sub={`of ${stats.totalVentures} total`} accent="#51AF37" />
          <KpiCard label="Avg VRL Stage" value={stats.avgVrl.toFixed(1)} sub="of 4 stages" accent="#51AF37" />
          <KpiCard label="Avg TRL Level" value={stats.avgTrl.toFixed(1)} sub="of 9 levels" accent="#3A97D3" />
          <KpiCard
            label="Milestones"
            value={`${stats.totalMilestonesCompleted}/${stats.totalMilestones}`}
            sub="completed"
            accent="#F49C13"
          />
        </div>

        {/* Main content: Hub diagram + Venture cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* Hub-and-spoke diagram */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  Portfolio Analytics Hub
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Click a domain node to navigate · Click a venture to drill down</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 rounded inline-block" style={{ background: "#51AF37" }} />
                  VRL
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 rounded inline-block" style={{ background: "#3A97D3" }} />
                  TRL
                </span>
              </div>
            </div>
            <HubSpokeDiagram
              onDomainClick={handleDomainClick}
              onVentureClick={handleVentureClick}
              activeDomain={activeDomain}
              ventures={ventures}
            />
          </div>

          {/* Venture cards */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Portfolio Brands
              </h2>
              <span className="text-xs text-gray-400 font-mono">{portfolioBrands.length} brands tracked</span>
            </div>
            {portfolioBrands.map((venture) => (
              <VentureCard
                key={venture.id}
                venture={venture}
                onClick={() => handleVentureClick(venture.id)}
                onEdit={(e) => handleEditClick(e, venture)}
                onEditMilestones={(e) => handleMilestonesClick(e, venture)}
              />
            ))}
            {/* Internal Lab — shown separately */}
            {internalLab && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Internal R&amp;D Lab</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <VentureCard
                  venture={internalLab}
                  onClick={() => handleVentureClick(internalLab.id)}
                  onEdit={(e) => handleEditClick(e, internalLab)}
                  onEditMilestones={(e) => handleMilestonesClick(e, internalLab)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Readiness Modal */}
      {editingVenture && (
        <EditReadinessModal
          venture={editingVenture}
          open={!!editingVenture}
          onClose={() => setEditingVenture(null)}
        />
      )}

      {/* Milestone Edit Modal */}
      {milestonesVenture && (
        <MilestoneEditModal
          venture={milestonesVenture}
          open={!!milestonesVenture}
          onClose={() => setMilestonesVenture(null)}
        />
      )}
    </div>
  );
}
