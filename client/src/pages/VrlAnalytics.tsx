// ============================================================
// ECOBLEND VRL ANALYTICS PAGE — VRL Scoring Engine
// Formula: VRL = (α×TRL + β×BRL) × (1 − Risk Index) × Confidence
// 9-level scale: Opportunity Discovery → Market Leadership
// ============================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ventures as staticVentures } from "@/lib/data";
import {
  TrendingUp, Calculator, Shield, FlaskConical, Briefcase,
  ChevronDown, ChevronUp, Info, Sliders, RefreshCw
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { toast } from "sonner";

// ── VRL 9-Level Definitions ──────────────────────────────────────────────────
const VRL_9_LEVELS = [
  { level: 1, label: "Opportunity Discovery", color: "#94a3b8", desc: "Problem identified and early exploration" },
  { level: 2, label: "Concept",               color: "#64748b", desc: "Solution concept defined" },
  { level: 3, label: "Validation",            color: "#f59e0b", desc: "Customer interviews and market validation" },
  { level: 4, label: "Prototype",             color: "#f97316", desc: "MVP development and early testing" },
  { level: 5, label: "Market Validation",     color: "#22c55e", desc: "Early adopter traction" },
  { level: 6, label: "Product-Market Fit",    color: "#16a34a", desc: "Growing customer demand" },
  { level: 7, label: "Market Entry",          color: "#3b82f6", desc: "Commercial launch" },
  { level: 8, label: "Scaling",               color: "#2563eb", desc: "Revenue growth and operational expansion" },
  { level: 9, label: "Market Leadership",     color: "#7c3aed", desc: "Established venture and market presence" },
];

const RISK_CATEGORIES = ["Technical", "Market", "Financial", "Operational", "Regulatory"];

function getLevelColor(level: number): string {
  return VRL_9_LEVELS[level - 1]?.color ?? "#94a3b8";
}

// ── Venture Selector ─────────────────────────────────────────────────────────
function VentureSelector({
  selectedId,
  onChange,
  ventures,
}: {
  selectedId: string;
  onChange: (id: string) => void;
  ventures: Array<{ id: string; name: string; color: string }>;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {ventures.map(v => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
          style={{
            background: selectedId === v.id ? v.color : "transparent",
            color: selectedId === v.id ? "#fff" : v.color,
            borderColor: v.color,
          }}
        >
          {v.name}
        </button>
      ))}
    </div>
  );
}

// ── Formula Breakdown Card ────────────────────────────────────────────────────
function FormulaCard({
  alphaWeight, betaWeight, trlNorm, brlNorm,
  baseReadiness, riskIndex, confidenceScore, vrlScore, vrlLevel, vrlLevelLabel,
}: {
  alphaWeight: number; betaWeight: number; trlNorm: number; brlNorm: number;
  baseReadiness: number; riskIndex: number; confidenceScore: number;
  vrlScore: number; vrlLevel: number; vrlLevelLabel: string;
}) {
  const levelColor = getLevelColor(vrlLevel);
  const riskPenalty = Math.round(riskIndex * 100);
  const confidencePct = Math.round(confidenceScore * 100);

  return (
    <div className="vos-panel p-6">
      <div className="flex items-center gap-2 mb-5">
        <Calculator size={16} style={{ color: "#51AF37" }} />
        <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
          VRL Formula Breakdown
        </h3>
        <span className="text-xs text-gray-400 ml-auto font-mono">
          VRL = (α×TRL + β×BRL) × (1 − Risk) × Confidence
        </span>
      </div>

      <div className="space-y-3">
        {/* Step 1: Base Readiness */}
        <div className="rounded-lg p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Step 1 — Base Readiness</span>
            <span className="font-mono font-bold text-gray-700">{baseReadiness.toFixed(2)} / 9</span>
          </div>
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="px-2 py-0.5 rounded font-mono text-xs" style={{ background: "#3b82f620", color: "#3b82f6" }}>
              α={alphaWeight.toFixed(2)}
            </span>
            <span className="text-gray-400">×</span>
            <span className="px-2 py-0.5 rounded font-mono text-xs" style={{ background: "#3b82f615", color: "#3b82f6" }}>
              TRL {trlNorm.toFixed(1)}
            </span>
            <span className="text-gray-400">+</span>
            <span className="px-2 py-0.5 rounded font-mono text-xs" style={{ background: "#22c55e20", color: "#22c55e" }}>
              β={betaWeight.toFixed(2)}
            </span>
            <span className="text-gray-400">×</span>
            <span className="px-2 py-0.5 rounded font-mono text-xs" style={{ background: "#22c55e15", color: "#22c55e" }}>
              BRL {brlNorm.toFixed(2)}
            </span>
            <span className="text-gray-400 ml-auto">= {baseReadiness.toFixed(2)}</span>
          </div>
        </div>

        {/* Step 2: Risk Adjustment */}
        <div className="rounded-lg p-4" style={{ background: "#fef9f0", border: "1px solid #fed7aa" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Step 2 — Risk Adjustment</span>
            <span className="font-mono font-bold" style={{ color: riskPenalty > 50 ? "#ef4444" : riskPenalty > 25 ? "#f97316" : "#22c55e" }}>
              -{riskPenalty}% penalty
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">{baseReadiness.toFixed(2)}</span>
            <span className="text-gray-400">×</span>
            <span className="px-2 py-0.5 rounded font-mono text-xs" style={{ background: "#f9731620", color: "#f97316" }}>
              (1 - {riskIndex.toFixed(3)})
            </span>
            <span className="text-gray-400">= {(baseReadiness * (1 - riskIndex)).toFixed(2)}</span>
          </div>
        </div>

        {/* Step 3: Confidence */}
        <div className="rounded-lg p-4" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Step 3 — Confidence Multiplier</span>
            <span className="font-mono font-bold" style={{ color: "#0ea5e9" }}>{confidencePct}% confidence</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">{(baseReadiness * (1 - riskIndex)).toFixed(2)}</span>
            <span className="text-gray-400">×</span>
            <span className="px-2 py-0.5 rounded font-mono text-xs" style={{ background: "#0ea5e920", color: "#0ea5e9" }}>
              {confidenceScore.toFixed(2)}
            </span>
            <span className="text-gray-400">= {vrlScore.toFixed(2)}</span>
          </div>
        </div>

        {/* Result */}
        <div className="rounded-xl p-5 flex items-center justify-between" style={{ background: `${levelColor}15`, border: `2px solid ${levelColor}` }}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: levelColor }}>
              VRL Score
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold" style={{ color: levelColor, fontFamily: "'Inter', sans-serif" }}>
                {vrlScore.toFixed(2)}
              </span>
              <span className="text-lg text-gray-400">/ 9</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Level</div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: levelColor }}>
                {vrlLevel}
              </span>
              <span className="font-semibold text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
                {vrlLevelLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 9-Level Indicator ─────────────────────────────────────────────────────────
function VrlLevelIndicator({ currentLevel, vrlScore }: { currentLevel: number; vrlScore: number }) {
  return (
    <div className="vos-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} style={{ color: "#51AF37" }} />
        <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
          9-Level Readiness Scale
        </h3>
        <span className="text-xs text-gray-400 ml-auto">Current: Level {currentLevel}</span>
      </div>
      <div className="space-y-1.5">
        {VRL_9_LEVELS.map(lvl => {
          const isActive = lvl.level === currentLevel;
          const isPast = lvl.level < currentLevel;
          return (
            <div
              key={lvl.level}
              className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
              style={{
                background: isActive ? `${lvl.color}20` : isPast ? `${lvl.color}08` : "transparent",
                border: isActive ? `1.5px solid ${lvl.color}` : "1.5px solid transparent",
              }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: isActive ? lvl.color : isPast ? `${lvl.color}30` : "#f1f5f9",
                  color: isActive ? "#fff" : isPast ? lvl.color : "#94a3b8",
                }}
              >
                {lvl.level}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: isActive ? lvl.color : isPast ? "#374151" : "#9ca3af" }}>
                    {lvl.label}
                  </span>
                  {isActive && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold text-white" style={{ background: lvl.color }}>
                      Current
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{lvl.desc}</span>
              </div>
              {isActive && (
                <span className="font-mono text-xs font-bold" style={{ color: lvl.color }}>
                  {vrlScore.toFixed(2)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Risk Index Breakdown ──────────────────────────────────────────────────────
function RiskIndexPanel({ riskIndex, riskByCategory }: { riskIndex: number; riskByCategory: Record<string, number> }) {
  const riskPct = Math.round(riskIndex * 100);
  const riskColor = riskPct > 50 ? "#ef4444" : riskPct > 25 ? "#f97316" : "#22c55e";

  return (
    <div className="vos-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={16} style={{ color: "#f97316" }} />
        <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
          Risk Index Breakdown
        </h3>
        <span className="font-mono font-bold ml-auto" style={{ color: riskColor }}>
          {riskPct}% aggregate risk
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Risk Index = average normalised score across 5 categories (each scored 0-25 via Likelihood x Impact)
      </p>
      <div className="space-y-3">
        {RISK_CATEGORIES.map(cat => {
          const score = riskByCategory[cat] ?? 0;
          const pct = Math.round(score * 100);
          const catColor = pct > 50 ? "#ef4444" : pct > 25 ? "#f97316" : "#22c55e";
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{cat} Risk</span>
                <span className="font-mono text-xs font-semibold" style={{ color: catColor }}>{pct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: catColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Aggregate Risk Index</span>
          <span className="font-mono font-bold text-lg" style={{ color: riskColor }}>{riskIndex.toFixed(3)}</span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden mt-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${riskPct}%`, background: `linear-gradient(90deg, #22c55e, ${riskColor})` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Confidence Score Panel ────────────────────────────────────────────────────
function ConfidencePanel({
  ventureId,
  confidenceScore,
  alphaWeight,
  betaWeight,
  onUpdate,
}: {
  ventureId: string;
  confidenceScore: number;
  alphaWeight: number;
  betaWeight: number;
  onUpdate: () => void;
}) {
  const [localConf, setLocalConf] = useState(confidenceScore);
  const [localAlpha, setLocalAlpha] = useState(alphaWeight);
  const [expanded, setExpanded] = useState(false);

  const updateParams = trpc.vrlScoring.updateParams.useMutation({
    onSuccess: () => {
      toast.success("Scoring parameters updated");
      onUpdate();
    },
    onError: () => toast.error("Failed to update parameters"),
  });

  const confLabel =
    localConf >= 0.9 ? "Proven commercial traction" :
    localConf >= 0.7 ? "Strong validation" :
    localConf >= 0.5 ? "Moderate validation" :
    "Minimal evidence";

  const confColor =
    localConf >= 0.8 ? "#22c55e" :
    localConf >= 0.5 ? "#f59e0b" :
    "#ef4444";

  return (
    <div className="vos-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sliders size={16} style={{ color: "#0ea5e9" }} />
        <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
          Scoring Parameters
        </h3>
        <button
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Collapse" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg p-3 text-center" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="text-xs text-gray-400 mb-1">alpha (TRL)</div>
          <div className="font-mono font-bold text-blue-600">{alphaWeight.toFixed(2)}</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="text-xs text-gray-400 mb-1">beta (BRL)</div>
          <div className="font-mono font-bold text-green-600">{betaWeight.toFixed(2)}</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="text-xs text-gray-400 mb-1">Confidence</div>
          <div className="font-mono font-bold" style={{ color: confColor }}>{confidenceScore.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500">Evidence strength:</span>
        <span className="text-xs font-semibold" style={{ color: confColor }}>{confLabel}</span>
      </div>

      <div className="rounded-lg p-3 mb-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div className="text-xs text-gray-400 mb-2">Confidence Scale Reference</div>
        <div className="space-y-1">
          {[
            { range: "0.2", label: "Minimal evidence", color: "#ef4444" },
            { range: "0.5", label: "Moderate validation", color: "#f59e0b" },
            { range: "0.8", label: "Strong validation", color: "#22c55e" },
            { range: "1.0", label: "Proven commercial traction", color: "#16a34a" },
          ].map(item => (
            <div key={item.range} className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold w-8" style={{ color: item.color }}>{item.range}</span>
              <span className="text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Confidence Score: {localConf.toFixed(2)}
            </label>
            <input
              type="range" min={0.2} max={1.0} step={0.05}
              value={localConf}
              onChange={e => setLocalConf(parseFloat(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>0.2 (minimal)</span><span>1.0 (proven)</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              alpha (TRL Weight): {localAlpha.toFixed(2)} — beta (BRL Weight): {(1 - localAlpha).toFixed(2)}
            </label>
            <input
              type="range" min={0.1} max={0.9} step={0.05}
              value={localAlpha}
              onChange={e => setLocalAlpha(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>TRL-heavy</span><span>BRL-heavy</span>
            </div>
          </div>
          <button
            className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: "#0ea5e9" }}
            onClick={() => {
              updateParams.mutate({
                ventureId,
                alphaWeight: localAlpha,
                betaWeight: 1 - localAlpha,
                confidenceScore: localConf,
              });
            }}
            disabled={updateParams.isPending}
          >
            {updateParams.isPending ? "Saving..." : "Apply Parameters"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Portfolio VRL Comparison ──────────────────────────────────────────────────
function PortfolioComparison() {
  const { data: portfolioScores = [], isLoading } = trpc.vrlScoring.portfolioScores.useQuery();
  const dbVentures = staticVentures.filter(v => !v.isInternalLab);

  const chartData = portfolioScores.map(s => {
    const v = dbVentures.find(dv => dv.id === s.ventureId);
    return {
      name: s.ventureName,
      vrlScore: s.vrlScore,
      vrlLevel: s.vrlLevel,
      color: v?.color ?? "#94a3b8",
    };
  });

  if (isLoading) {
    return (
      <div className="vos-panel p-6">
        <div className="animate-pulse h-40 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="vos-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} style={{ color: "#51AF37" }} />
        <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
          Portfolio VRL Scores (Computed)
        </h3>
        <span className="text-xs text-gray-400 ml-auto">Formula-derived scores, 0-9 scale</span>
      </div>
      {chartData.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No venture data available. Ventures will appear once database is populated.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barSize={44}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "'Inter', sans-serif", fill: "#6b7280" }} />
            <YAxis domain={[0, 9]} ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
              tick={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fill: "#9ca3af" }} />
            <Tooltip
              formatter={(val: number) => [`${val.toFixed(2)}`, "VRL Score"]}
              contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="vrlScore" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VrlAnalytics() {
  const dbVentures = staticVentures.filter(v => !v.isInternalLab);
  const [selectedVentureId, setSelectedVentureId] = useState(dbVentures[0]?.id ?? "ecoblend");

  const { data: scoreData, isLoading: scoreLoading, refetch: refetchScore } = trpc.vrlScoring.getScore.useQuery(
    { ventureId: selectedVentureId },
    { enabled: !!selectedVentureId }
  );

  const selectedVenture = dbVentures.find(v => v.id === selectedVentureId);

  const score = scoreData ?? {
    vrlScore: 0, vrlLevel: 1, vrlLevelLabel: "Opportunity Discovery",
    trlNorm: 0, brlNorm: 0, riskIndex: 0, riskByCategory: {} as Record<string, number>,
    confidenceScore: 0.5, alphaWeight: 0.45, betaWeight: 0.55, baseReadiness: 0,
  };

  const levelColor = getLevelColor(score.vrlLevel);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} style={{ color: "#51AF37" }} />
          <span className="vos-badge vos-badge-success" style={{ fontSize: "0.65rem" }}>VRL Scoring Engine</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">9-Level Scale</span>
        </div>
        <h1 className="vos-page-title mb-1">Venture Readiness Level Analytics</h1>
        <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
          VRL = (alpha x TRL + beta x BRL) x (1 - Risk Index) x Confidence — integrating technology, business, and risk intelligence
        </p>
      </div>

      <div className="p-8 space-y-8">
        <PortfolioComparison />

        <div className="vos-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-gray-700">Venture Deep-Dive</span>
            <span className="text-xs text-gray-400">Select a venture to see the full VRL formula breakdown</span>
            <button
              className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              onClick={() => refetchScore()}
            >
              <RefreshCw size={12} /> Recalculate
            </button>
          </div>
          <VentureSelector
            selectedId={selectedVentureId}
            onChange={setSelectedVentureId}
            ventures={dbVentures.map(v => ({ id: v.id, name: v.name, color: v.color }))}
          />
        </div>

        {selectedVenture && (
          <div className="flex items-center gap-4 px-1">
            {selectedVenture.logo && (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: (selectedVenture as any).logoBg ?? "#f8fafc", border: "1px solid #e2e8f0" }}>
                <img src={selectedVenture.logo} alt={selectedVenture.name} className="w-10 h-10 object-contain" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold" style={{ color: selectedVenture.color, fontFamily: "'Inter', sans-serif" }}>
                {selectedVenture.name}
              </h2>
              <p className="text-sm text-gray-500">{selectedVenture.tagline}</p>
            </div>
            {scoreLoading ? (
              <div className="ml-auto animate-pulse h-10 w-32 bg-gray-100 rounded-lg" />
            ) : (
              <div className="ml-auto flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-gray-400">VRL Score</div>
                  <div className="text-3xl font-bold" style={{ color: levelColor, fontFamily: "'Inter', sans-serif" }}>
                    {score.vrlScore.toFixed(2)}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ background: levelColor }}>
                  {score.vrlLevel}
                </div>
              </div>
            )}
          </div>
        )}

        {scoreLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="vos-panel p-6 animate-pulse">
                <div className="h-40 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <FormulaCard
                alphaWeight={score.alphaWeight}
                betaWeight={score.betaWeight}
                trlNorm={score.trlNorm}
                brlNorm={score.brlNorm}
                baseReadiness={score.baseReadiness}
                riskIndex={score.riskIndex}
                confidenceScore={score.confidenceScore}
                vrlScore={score.vrlScore}
                vrlLevel={score.vrlLevel}
                vrlLevelLabel={score.vrlLevelLabel}
              />
              <RiskIndexPanel
                riskIndex={score.riskIndex}
                riskByCategory={score.riskByCategory}
              />
            </div>

            <div className="space-y-6">
              <VrlLevelIndicator currentLevel={score.vrlLevel} vrlScore={score.vrlScore} />
              <ConfidencePanel
                ventureId={selectedVentureId}
                confidenceScore={score.confidenceScore}
                alphaWeight={score.alphaWeight}
                betaWeight={score.betaWeight}
                onUpdate={() => refetchScore()}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="vos-metric" style={{ borderTop: "3px solid #3b82f6" }}>
            <span className="vos-metric-label">TRL Component</span>
            <div className="flex items-baseline gap-1">
              <span className="vos-metric-value" style={{ color: "#3b82f6" }}>{score.trlNorm.toFixed(1)}</span>
              <span className="text-sm text-gray-400">/ 9</span>
            </div>
            <span className="vos-metric-sub">alpha={score.alphaWeight.toFixed(2)} weight</span>
            <div className="flex items-center gap-1 mt-1">
              <FlaskConical size={12} style={{ color: "#3b82f6" }} />
              <span className="text-xs text-gray-400">Technology Readiness</span>
            </div>
          </div>
          <div className="vos-metric" style={{ borderTop: "3px solid #22c55e" }}>
            <span className="vos-metric-label">BRL Component</span>
            <div className="flex items-baseline gap-1">
              <span className="vos-metric-value" style={{ color: "#22c55e" }}>{score.brlNorm.toFixed(2)}</span>
              <span className="text-sm text-gray-400">/ 9</span>
            </div>
            <span className="vos-metric-sub">beta={score.betaWeight.toFixed(2)} weight</span>
            <div className="flex items-center gap-1 mt-1">
              <Briefcase size={12} style={{ color: "#22c55e" }} />
              <span className="text-xs text-gray-400">Business Readiness</span>
            </div>
          </div>
          <div className="vos-metric" style={{ borderTop: "3px solid #51AF37" }}>
            <span className="vos-metric-label">Computed VRL Score</span>
            <div className="flex items-baseline gap-1">
              <span className="vos-metric-value" style={{ color: "#51AF37" }}>{score.vrlScore.toFixed(2)}</span>
              <span className="text-sm text-gray-400">/ 9</span>
            </div>
            <span className="vos-metric-sub">Level {score.vrlLevel}: {score.vrlLevelLabel}</span>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={12} style={{ color: "#51AF37" }} />
              <span className="text-xs text-gray-400">Venture Readiness</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5 flex gap-3" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
          <Info size={16} style={{ color: "#0ea5e9", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-semibold text-sky-800 mb-1">VRL Scoring Methodology</p>
            <p className="text-xs text-sky-700 leading-relaxed">
              The VRL formula integrates three dimensions: (1) <strong>Base Readiness</strong> — a weighted combination of TRL (technology maturity, alpha=0.45 default) and BRL (business readiness, beta=0.55 default), both normalised to a 0-9 scale; (2) <strong>Risk Adjustment</strong> — the base score is penalised by the aggregate Risk Index derived from five risk categories (Technical, Market, Financial, Operational, Regulatory), each scored via Likelihood x Impact; (3) <strong>Confidence Multiplier</strong> — reflects the quality and quantity of validation evidence (0.2 = minimal, 1.0 = proven traction). Default weights: alpha=0.45, beta=0.55. Weights must sum to 1.0.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
