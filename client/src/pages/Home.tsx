// ============================================================
// VENTURE OS — PORTFOLIO OVERVIEW
// Design: Apple-style clarity · Deference · Depth
// Typography: 34/28/20/16/12px scale
// Spacing: 8px grid (8/16/24/40px)
// ============================================================

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import HubSpokeDiagram from "@/components/HubSpokeDiagram";
import { VRL_STAGES, TRL_LEVELS, Venture } from "@/lib/data";
import { useVentures } from "@/contexts/VentureContext";
import EditReadinessModal from "@/components/EditReadinessModal";
import MilestoneEditModal from "@/components/MilestoneEditModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Pencil, ListChecks, FileDown, Briefcase, RotateCcw,
  TrendingUp, FlaskConical, CheckCircle2, Circle,
  ArrowRight, Zap, Leaf
} from "lucide-react";
import { exportPortfolioPdf, exportInvestorPack } from "@/lib/exportPdf";
import { trpc } from "@/lib/trpc";
import { useHypothesisStore, selectVrlByVenture } from "@/stores/hypothesisStore";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/ecoblend-hero-bg-4sozsAnSEGXN6NLMPzPbzp.webp";

// Venture lifecycle stages from the design brief
const LIFECYCLE_STAGES = ["Idea", "Validation", "MVP", "Market Entry", "Scale"];

const statusConfig: Record<string, { bg: string; color: string; dot: string }> = {
  "Active":      { bg: "#E9F6E3", color: "#3D8526", dot: "#56A837" },
  "Pre-Launch":  { bg: "#FEF0D9", color: "#b45309", dot: "#F69111" },
  "Scaling":     { bg: "#E4EFF7", color: "#2C6690", dot: "#3B85BA" },
  "Paused":      { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
};

function lifecycleStageFromVrl(vrl: number): string {
  if (vrl <= 1) return "Idea";
  if (vrl <= 2) return "Validation";
  if (vrl <= 3) return "MVP";
  if (vrl <= 4) return "Market Entry";
  return "Scale";
}

// ── Metric Tile (Apple-style: label / large value / sub) ──────────────────
function MetricTile({
  label, value, sub, accent, icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}) {
  return (
    <div className="vos-metric group hover:shadow-sm transition-shadow duration-150">
      <div className="flex items-start justify-between">
        <span className="vos-metric-label">{label}</span>
        {Icon && (
          <span className="opacity-30 group-hover:opacity-60 transition-opacity">
            <Icon size={14} style={{ color: accent ?? "#6b7280" }} />
          </span>
        )}
      </div>
      <span className="vos-metric-value" style={{ color: accent ?? "#1a2332" }}>{value}</span>
      {sub && <span className="vos-metric-sub">{sub}</span>}
    </div>
  );
}

// ── Lifecycle progress strip ───────────────────────────────────────────────
function LifecycleStrip({ currentStage }: { currentStage: string }) {
  const idx = LIFECYCLE_STAGES.indexOf(currentStage);
  return (
    <div className="flex items-center gap-0 mt-2">
      {LIFECYCLE_STAGES.map((stage, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={stage} className="flex items-center">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded"
              style={{
                background: active ? "#56A83718" : done ? "#56A8370a" : "transparent",
                border: active ? "1px solid #56A83740" : "1px solid transparent",
              }}
            >
              {done ? (
                <CheckCircle2 size={9} style={{ color: "#56A837" }} />
              ) : active ? (
                <Zap size={9} style={{ color: "#56A837" }} />
              ) : (
                <Circle size={9} style={{ color: "#d1d5db" }} />
              )}
              <span
                className="text-xs font-medium"
                style={{
                  color: active ? "#3D8526" : done ? "#56A837" : "#9ca3af",
                  fontSize: "0.65rem",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {stage}
              </span>
            </div>
            {i < LIFECYCLE_STAGES.length - 1 && (
              <ArrowRight size={8} style={{ color: i < idx ? "#56A83760" : "#e5e7eb", margin: "0 1px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Venture Card ───────────────────────────────────────────────────────────
const ENGINE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Sticky:  { bg: "#E4EFF7", color: "#2C6690", label: "Sticky" },
  Viral:   { bg: "#f0fdf4", color: "#15803d", label: "Viral" },
  Paid:    { bg: "#FEF0D9", color: "#b45309", label: "Paid" },
};
function VentureCard({
  venture, onClick, onEdit, onEditMilestones, computedVrlScore, computedVrlLevel, engineOfGrowth, pivot, hypothesisVrl,
}: {
  venture: Venture;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onEditMilestones: (e: React.MouseEvent) => void;
  computedVrlScore?: number;
  computedVrlLevel?: number;
  engineOfGrowth?: string | null;
  pivot?: boolean;
  hypothesisVrl?: { vrl: number; stageLabel: string };
}) {
  const vrlStage = VRL_STAGES[venture.vrl - 1];
  // When the venture is driven by the Lean Startup Hypothesis Register, the
  // primary VRL readout + progress bar reflect the live 0-9 engine score.
  const hypDriven = hypothesisVrl !== undefined;
  const vrlBarPercent = hypDriven
    ? Math.round((hypothesisVrl.vrl / 9) * 100)
    : Math.round(((venture.vrl - 1) / 4 + venture.vrlPercent / 400) * 100);
  const trlLevel = TRL_LEVELS[venture.trl - 1];
  const status = statusConfig[venture.status] ?? statusConfig["Paused"];
  const lifecycleStage = lifecycleStageFromVrl(venture.vrl);
  const milestoneDone = venture.milestones.filter(m => m.completed).length;

  return (
    <div
      className="vos-card cursor-pointer group transition-all duration-150"
      style={{ borderLeft: `3px solid ${venture.color}` }}
      onClick={onClick}
    >
      <div className="p-4">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Brand logo */}
            {venture.logo && (
              <div
                className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border shadow-sm"
                style={{
                  borderColor: `${venture.color}40`,
                  background: venture.logoBg || "#f9fafb",
                }}
              >
                <img
                  src={venture.logo}
                  alt={`${venture.name} logo`}
                  className="w-full h-full object-contain p-1.5"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
            {/* Brand name + channel tag */}
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="font-bold truncate"
                style={{ color: venture.color, fontFamily: "'Prompt', sans-serif", fontSize: "1rem" }}
              >
                {venture.name}
              </span>
              <span
                className="vos-badge vos-badge-neutral shrink-0"
                style={{ fontSize: "0.65rem" }}
              >
                {venture.channel}
              </span>
            </div>
            {/* Tagline */}
            <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
              {venture.tagline}
            </p>
            </div>
          </div>

          {/* Status + actions */}
          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            <span
              className="vos-badge"
              style={{ background: status.bg, color: status.color, fontSize: "0.65rem" }}
            >
              <span className="w-1.5 h-1.5 rounded-full mr-1 inline-block" style={{ background: status.dot }} />
              {venture.status}
            </span>
            {engineOfGrowth && ENGINE_COLORS[engineOfGrowth] && (
              <span
                className="vos-badge"
                style={{ background: ENGINE_COLORS[engineOfGrowth].bg, color: ENGINE_COLORS[engineOfGrowth].color, fontSize: "0.6rem" }}
                title="Engine of Growth (Lean Startup)"
              >
                <Zap size={8} className="mr-0.5" />
                {ENGINE_COLORS[engineOfGrowth].label}
              </span>
            )}
            {pivot && (
              <span
                className="vos-badge"
                style={{ background: "rgba(220,38,38,0.10)", color: "#dc2626", fontSize: "0.6rem" }}
                title="A core assumption was invalidated — pivot required"
              >
                <Zap size={8} className="mr-0.5" />
                Pivot Initiated
              </span>
            )}
            <button
              onClick={onEdit}
              className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
              title="Edit readiness"
            >
              <Pencil size={11} className="text-gray-400" />
            </button>
            <button
              onClick={onEditMilestones}
              className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
              title="Edit milestones"
            >
              <ListChecks size={11} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* ── Dual readiness bars ── */}
        <div className="space-y-2 mb-3">
          {/* VRL */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                <TrendingUp size={10} style={{ color: "#56A837" }} />
                {hypDriven
                  ? <>VRL {hypothesisVrl.vrl.toFixed(1)} — {hypothesisVrl.stageLabel}</>
                  : <>VRL {venture.vrl} — {vrlStage?.label}</>}
              </span>
              <div className="flex items-center gap-2">
                {computedVrlScore !== undefined && (
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: "#56A83715", color: "#56A837" }}>
                    Score: {computedVrlScore.toFixed(1)}/9
                  </span>
                )}
                <span className="text-xs font-mono text-gray-400">{vrlBarPercent}%</span>
              </div>
            </div>
            <div className="vos-progress-track">
              <div
                className="vos-progress-fill"
                style={{
                  width: `${vrlBarPercent}%`,
                  background: "#56A837",
                }}
              />
            </div>
          </div>
          {/* TRL */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                <FlaskConical size={10} style={{ color: "#3B85BA" }} />
                TRL {venture.trl} — {trlLevel?.label}
              </span>
              <span className="text-xs font-mono text-gray-400">{venture.trlPercent}%</span>
            </div>
            <div className="vos-progress-track">
              <div
                className="vos-progress-fill"
                style={{
                  width: `${((venture.trl - 1) / 9 + venture.trlPercent / 900) * 100}%`,
                  background: "#3B85BA",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Milestone dots ── */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>Milestones</span>
          <div className="flex gap-1">
            {venture.milestones.map((m, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: m.completed ? venture.color : "#e5e7eb" }}
                title={m.label}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-auto font-mono" style={{ fontFamily: "'Inter', sans-serif" }}>
            {milestoneDone}/{venture.milestones.length}
          </span>
        </div>

        {/* ── Lifecycle strip ── */}
        <LifecycleStrip currentStage={lifecycleStage} />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [activeDomain, setActiveDomain] = useState("portfolio");
  const [, navigate] = useLocation();
  const { ventures, stats, resetToDefaults } = useVentures();
  const portfolioBrands = ventures.filter(v => !v.isInternalLab);
  const internalLab = ventures.find(v => v.isInternalLab);
  const [editingVenture, setEditingVenture] = useState<Venture | null>(null);
  const [milestonesVenture, setMilestonesVenture] = useState<Venture | null>(null);

  // BRL portfolio summary
  const { data: brlSummary = [] } = trpc.brl.portfolioSummary.useQuery();
  const avgBrlScore = brlSummary.length > 0
    ? Math.round(brlSummary.reduce((sum: number, v: { score: number }) => sum + v.score, 0) / brlSummary.length)
    : 0;
  // VRL portfolio scores (computed via scoring engine)
  const { data: vrlPortfolioScores = [] } = trpc.vrlScoring.portfolioScores.useQuery();
  // Live VRL driven by the Lean Startup Hypothesis Register
  const hypotheses = useHypothesisStore((s) => s.hypotheses);
  const vrlByVenture = useMemo(() => selectVrlByVenture(hypotheses), [hypotheses]);
  // Effective VRL score per venture: hypothesis-driven when present, else the
  // server-computed score. The AVG widget averages every venture that has a score.
  const effectiveVrlScore = (ventureId: string): number | undefined =>
    vrlByVenture[ventureId]?.vrl ??
    vrlPortfolioScores.find((s) => s.ventureId === ventureId)?.vrlScore;
  const avgVrlValues = portfolioBrands
    .map((v) => effectiveVrlScore(v.id))
    .filter((x): x is number => x !== undefined);
  const avgComputedVrl = avgVrlValues.length > 0
    ? (avgVrlValues.reduce((sum, x) => sum + x, 0) / avgVrlValues.length).toFixed(1)
    : "--";
  // Innovation Accounting: experiment pass rate + engine of growth
  const { data: leanMetrics = [] } = trpc.leanMetrics.portfolioSummary.useQuery();
  const { data: irlPortfolio } = trpc.irl.portfolioIrlSummary.useQuery();
  const avgIrl = irlPortfolio?.avgIrl != null ? irlPortfolio.avgIrl.toFixed(1) : "--";
  const metricsWithRate = leanMetrics.filter((m: any) => m.experimentPassRate !== null);
  const avgPassRate = metricsWithRate.length > 0
    ? Math.round(metricsWithRate.reduce((sum: number, m: any) => sum + m.experimentPassRate, 0) / metricsWithRate.length)
    : null;

  const handleDomainClick = (domainId: string) => {
    setActiveDomain(domainId);
    const routes: Record<string, string> = {
      portfolio: "/", vrl: "/vrl", trl: "/trl", risk: "/risk",
      investment: "/investment", brand: "/brand", ip: "/ip",
      people: "/people", marketing: "/marketing", financial: "/financial",
      bcorp: "/bcorp", foundation: "/foundation",
    };
    if (routes[domainId] && routes[domainId] !== "/") navigate(routes[domainId]);
  };

  const handleVentureClick = (ventureId: string) => navigate(`/venture/${ventureId}`);
  const handleEditClick = (e: React.MouseEvent, v: Venture) => { e.stopPropagation(); setEditingVenture(v); };
  const handleMilestonesClick = (e: React.MouseEvent, v: Venture) => { e.stopPropagation(); setMilestonesVenture(v); };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">

      {/* ── Page header (Apple-style: content-first, minimal chrome) ── */}
      <div
        className="relative border-b bg-white"
        style={{ borderColor: "#e5e7eb" }}
      >
        {/* Subtle hero tint */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${HERO_BG})`,
            backgroundSize: "cover",
            backgroundPosition: "right center",
          }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(255,255,255,1) 55%, rgba(255,255,255,0.92))" }} />

        <div className="relative px-8 py-6">
          {/* Breadcrumb / context */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="vos-badge vos-badge-success"
              style={{ fontSize: "0.65rem", letterSpacing: "0.07em" }}
            >
              EcoBlend VBS
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
              EcoBlend VBS
            </span>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              {/* 28px Title per design brief */}
              <h1
                className="vos-page-title mb-1"
                style={{ fontSize: "1.75rem" }}
              >
                EcoBlend Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-500 max-w-xl" style={{ fontFamily: "'Inter', sans-serif" }}>
                Dual-readiness portfolio intelligence — tracking Venture Readiness Level (VRL) and Technology Readiness Level (TRL) across all active ventures.
              </p>
            </div>

            {/* Action panel */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={() => exportPortfolioPdf(ventures)}
                style={{ borderColor: "#3B85BA", color: "#3B85BA", borderRadius: "8px" }}
              >
                <FileDown size={12} /> Export PDF
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => exportInvestorPack(ventures)}
                style={{ background: "#8b5cf6", color: "white", borderRadius: "8px" }}
              >
                <Briefcase size={12} /> Investor Pack
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 text-gray-400"
                onClick={() => { resetToDefaults(); toast.success("Data reset to defaults"); }}
                style={{ borderRadius: "8px" }}
              >
                <RotateCcw size={12} /> Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* ── KPI Metric Tiles — Triple Matrix: TRL / BRL / VRL ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricTile
            label="Active Ventures"
            value={stats.activeVentures}
            sub={`of ${stats.totalVentures} total`}
            accent="#56A837"
            icon={TrendingUp}
          />
          <MetricTile
            label="Avg VRL Score"
            value={avgComputedVrl}
            sub="computed, 0-9 scale"
            accent="#56A837"
            icon={TrendingUp}
          />
          <MetricTile
            label="Avg TRL Level"
            value={stats.avgTrl.toFixed(1)}
            sub="of 9 levels"
            accent="#3B85BA"
            icon={FlaskConical}
          />
          <MetricTile
            label="Avg BRL Score"
            value={`${avgBrlScore}%`}
            sub="business readiness"
            accent="#8B5CF6"
            icon={Briefcase}
          />
          <MetricTile
            label="Exp. Pass Rate"
            value={avgPassRate !== null ? `${avgPassRate}%` : "--"}
            sub={avgPassRate !== null ? "innovation accounting" : "no experiments yet"}
            accent="#F69111"
            icon={Zap}
          />
          <MetricTile
            label="Avg IRL Score"
            value={avgIrl}
            sub="impact readiness, 0-10"
            accent="#10b981"
            icon={Leaf}
          />
        </div>

        {/* ── Main grid: Hub diagram + Venture cards ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

          {/* Hub-and-spoke diagram */}
          <div className="vos-panel p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="vos-section-title">Portfolio Analytics Hub</h2>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Click a domain node to navigate · Click a venture to drill down
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="w-3 h-0.5 rounded inline-block" style={{ background: "#56A837" }} /> VRL
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="w-3 h-0.5 rounded inline-block" style={{ background: "#3B85BA" }} /> TRL
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
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="vos-section-title">Portfolio Brands</h2>
              <span
                className="text-xs text-gray-400 font-mono"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {portfolioBrands.length} brands tracked
              </span>
            </div>

            {portfolioBrands.map((venture) => {
              const vrlScore = vrlPortfolioScores.find(s => s.ventureId === venture.id);
              const leanEntry = leanMetrics.find((m: any) => m.id === venture.id);
              const hypVrl = vrlByVenture[venture.id];
              return (
                <VentureCard
                  key={venture.id}
                  venture={venture}
                  onClick={() => handleVentureClick(venture.id)}
                  onEdit={(e) => handleEditClick(e, venture)}
                  onEditMilestones={(e) => handleMilestonesClick(e, venture)}
                  computedVrlScore={hypVrl?.vrl ?? vrlScore?.vrlScore}
                  computedVrlLevel={vrlScore?.vrlLevel}
                  engineOfGrowth={leanEntry?.engineOfGrowth}
                  pivot={hypVrl?.pivot}
                  hypothesisVrl={hypVrl ? { vrl: hypVrl.vrl, stageLabel: hypVrl.stageLabel } : undefined}
                />
              );
            })}

            {/* Internal Lab — separated */}
            {internalLab && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest text-gray-400"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.65rem" }}
                  >
                    Internal R&amp;D Lab
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <VentureCard
                  venture={internalLab}
                  onClick={() => handleVentureClick(internalLab.id)}
                  onEdit={(e) => handleEditClick(e, internalLab)}
                  onEditMilestones={(e) => handleMilestonesClick(e, internalLab)}
                  computedVrlScore={vrlPortfolioScores.find(s => s.ventureId === internalLab.id)?.vrlScore}
                  computedVrlLevel={vrlPortfolioScores.find(s => s.ventureId === internalLab.id)?.vrlLevel}
                  engineOfGrowth={leanMetrics.find((m: any) => m.id === internalLab.id)?.engineOfGrowth}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingVenture && (
        <EditReadinessModal
          venture={editingVenture}
          open={!!editingVenture}
          onClose={() => setEditingVenture(null)}
        />
      )}
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
