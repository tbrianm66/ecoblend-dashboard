// ============================================================
// DUAL RISK VENTURE CREATION SYSTEM
// Brief: Dual Risk Venture Creation System – Prompt Brief
// Separates Business Risk (University) and Product Risk (Founder)
// VRL Engine: VRL = (α×TRL + β×BRL) × (1−BRI) × (1−PRI) × Confidence
// Decision Outputs: Build / Validate / Partner / Reject
// Execution Routing: BEBUS (business) ↔ ECORACE (product)
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldAlert, ShieldCheck, Zap, Building2, Wrench, TrendingUp,
  Calculator, ListChecks, RefreshCw, Info, ChevronRight, Trash2,
  MessageSquare, CheckCircle2, XCircle, AlertTriangle, HelpCircle,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────
const ECOBLEND_GREEN = "#51AF37";
const ECOBLEND_BLUE  = "#3A97D3";
const ECOBLEND_AMBER = "#F49C13";
const ECOBLEND_RED   = "#e53e3e";
const ECOBLEND_PURPLE = "#805ad5";

const VRL_9_LEVELS = [
  { level: 1, label: "Opportunity Discovery",  color: "#94a3b8" },
  { level: 2, label: "Concept",                color: "#64748b" },
  { level: 3, label: "Validation",             color: "#f59e0b" },
  { level: 4, label: "Prototype",              color: "#f97316" },
  { level: 5, label: "Market Validation",      color: "#22c55e" },
  { level: 6, label: "Product-Market Fit",     color: "#16a34a" },
  { level: 7, label: "Market Entry",           color: "#3b82f6" },
  { level: 8, label: "Scaling",                color: "#2563eb" },
  { level: 9, label: "Market Leadership",      color: "#7c3aed" },
];

const DECISION_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; desc: string }> = {
  Build:    { color: ECOBLEND_GREEN,  bg: "#f0fdf4", icon: CheckCircle2,  desc: "Strong VRL + low dual risk. Route to BEBUS + ECORACE." },
  Validate: { color: ECOBLEND_BLUE,   bg: "#eff6ff", icon: AlertTriangle,  desc: "Moderate VRL. Validate further before committing resources." },
  Partner:  { color: ECOBLEND_AMBER,  bg: "#fffbeb", icon: HelpCircle,     desc: "High risk in one dimension. Seek external partners or IP licensing." },
  Reject:   { color: ECOBLEND_RED,    bg: "#fef2f2", icon: XCircle,        desc: "Low VRL + high dual risk. Do not proceed without major pivots." },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function riskLabel(score: number): string {
  if (score <= 25) return "Low";
  if (score <= 50) return "Moderate";
  if (score <= 75) return "High";
  return "Critical";
}
function riskColor(score: number): string {
  if (score <= 25) return ECOBLEND_GREEN;
  if (score <= 50) return ECOBLEND_BLUE;
  if (score <= 75) return ECOBLEND_AMBER;
  return ECOBLEND_RED;
}

// ── Semi-circle gauge ─────────────────────────────────────────────────────────
function SemiGauge({ value, max = 100, color, label, sublabel }: {
  value: number; max?: number; color: string; label: string; sublabel?: string;
}) {
  const pct = Math.min(1, value / max);
  const r = 54; const cx = 70; const cy = 70;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - pct);
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>{value.toFixed(0)}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#6b7280">{sublabel ?? `/ ${max}`}</text>
      </svg>
      <span className="text-xs font-semibold text-gray-600 mt-1">{label}</span>
    </div>
  );
}

// ── Risk Slider Row ───────────────────────────────────────────────────────────
function RiskSliderRow({ label, value, onChange, invert = false, tooltip }: {
  label: string; value: number; onChange: (v: number) => void; invert?: boolean; tooltip?: string;
}) {
  const displayScore = invert ? 100 - value : value;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-44 flex items-center gap-1">
        <span className="text-xs text-gray-600 truncate">{label}</span>
        {tooltip && <span title={tooltip} className="text-gray-300 cursor-help"><Info size={11} /></span>}
      </div>
      <div className="flex-1">
        <Slider min={0} max={100} step={1} value={[value]} onValueChange={([v]) => onChange(v)} className="w-full" />
      </div>
      <div className="w-20 flex items-center gap-1">
        <span className="text-xs font-mono font-semibold" style={{ color: riskColor(displayScore) }}>{displayScore.toFixed(0)}</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${riskColor(displayScore)}15`, color: riskColor(displayScore) }}>
          {riskLabel(displayScore)}
        </span>
      </div>
    </div>
  );
}

// ── VRL Level Badge ───────────────────────────────────────────────────────────
function VrlBadge({ level }: { level: number }) {
  const def = VRL_9_LEVELS[level - 1] ?? VRL_9_LEVELS[0];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: def.color }}>
      VRL {level} — {def.label}
    </span>
  );
}

// ── Decision Badge ────────────────────────────────────────────────────────────
function DecisionBadge({ decision }: { decision: string }) {
  const cfg = DECISION_CONFIG[decision];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold" style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}` }}>
      <Icon size={14} /> {decision}
    </span>
  );
}

// ── Venture Selector ──────────────────────────────────────────────────────────
function VentureSelector({ selectedId, onChange, ventures }: {
  selectedId: string; onChange: (id: string) => void;
  ventures: Array<{ id: string; name: string; color: string }>;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {ventures.map(v => (
        <button key={v.id} onClick={() => onChange(v.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
          style={{ background: selectedId === v.id ? v.color : "transparent", color: selectedId === v.id ? "#fff" : v.color, borderColor: v.color }}>
          {v.name}
        </button>
      ))}
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ ventureId, ventures }: { ventureId: string; ventures: any[] }) {
  const { data: summary, isLoading } = trpc.dualRisk.getDualRiskSummary.useQuery({ ventureId }, { enabled: !!ventureId });
  const venture = ventures.find(v => v.id === ventureId);

  const decisionCounts = [
    { name: "Build",    value: summary?.buildCount ?? 0,    fill: ECOBLEND_GREEN },
    { name: "Validate", value: summary?.validateCount ?? 0, fill: ECOBLEND_BLUE },
    { name: "Partner",  value: summary?.partnerCount ?? 0,  fill: ECOBLEND_AMBER },
    { name: "Reject",   value: summary?.rejectCount ?? 0,   fill: ECOBLEND_RED },
  ];

  if (isLoading) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Business Risk Index</p>
          <p className="text-3xl font-bold" style={{ color: riskColor(summary?.businessRiskIndex ?? 50) }}>
            {summary?.businessRiskIndex != null ? `${summary.businessRiskIndex.toFixed(1)}%` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">University Ownership</p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Product Risk Index</p>
          <p className="text-3xl font-bold" style={{ color: riskColor(summary?.productRiskIndex ?? 50) }}>
            {summary?.productRiskIndex != null ? `${summary.productRiskIndex.toFixed(1)}%` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Founder Ownership</p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">VRL Score</p>
          <p className="text-3xl font-bold" style={{ color: VRL_9_LEVELS[(summary?.latestVrlLevel ?? 1) - 1]?.color ?? "#94a3b8" }}>
            {summary?.latestVrlScore != null ? summary.latestVrlScore.toFixed(2) : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">of 9.0 max</p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Latest Decision</p>
          <div className="mt-1">
            {summary?.latestDecision ? <DecisionBadge decision={summary.latestDecision} /> : <span className="text-gray-400 text-sm">No decision yet</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1">{summary?.decisionCount ?? 0} decisions logged</p>
        </div>
      </div>

      {/* Dual gauges + decision bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Dual Risk Gauges</h3>
          <div className="flex justify-around items-end">
            <SemiGauge value={summary?.businessRiskIndex ?? 50} color={riskColor(summary?.businessRiskIndex ?? 50)} label="Business Risk" sublabel="University" />
            <SemiGauge value={summary?.productRiskIndex ?? 50} color={riskColor(summary?.productRiskIndex ?? 50)} label="Product Risk" sublabel="Founder" />
          </div>
          {summary?.latestVrlLevel && (
            <div className="mt-4 text-center">
              <VrlBadge level={summary.latestVrlLevel} />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Decision History</h3>
          {summary?.decisionCount ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={decisionCounts} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {decisionCounts.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 text-gray-400">
              <Calculator size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Run the VRL Engine to generate decisions</p>
            </div>
          )}
        </div>
      </div>

      {/* Formula reference */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Calculator size={14} /> VRL Formula</h3>
        <div className="font-mono text-sm text-gray-700 bg-white rounded-lg p-3 border mb-3">
          VRL = (α×TRL + β×BRL) × (1 − BRI×0.5) × (1 − PRI×0.5) × Confidence
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { sym: "α = 0.45", desc: "TRL weight (product)" },
            { sym: "β = 0.55", desc: "BRL weight (business)" },
            { sym: "BRI", desc: "Business Risk Index (0–1)" },
            { sym: "PRI", desc: "Product Risk Index (0–1)" },
          ].map(({ sym, desc }) => (
            <div key={sym} className="bg-white rounded-lg p-2 border">
              <span className="font-bold text-gray-800">{sym}</span>
              <p className="text-gray-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {Object.entries(DECISION_CONFIG).map(([d, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={d} className="flex items-center gap-1.5 p-2 rounded-lg border" style={{ background: cfg.bg, borderColor: cfg.color }}>
                <Icon size={12} style={{ color: cfg.color }} />
                <span className="font-semibold" style={{ color: cfg.color }}>{d}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution routing */}
      {summary?.latestDecision && (
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Zap size={14} /> Execution Routing</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 rounded-lg p-3 border text-center" style={{ borderColor: ECOBLEND_BLUE, background: "#eff6ff" }}>
              <Building2 size={20} className="mx-auto mb-1" style={{ color: ECOBLEND_BLUE }} />
              <p className="text-xs font-bold text-blue-700">BEBUS</p>
              <p className="text-xs text-blue-500">Business Validation</p>
              <Badge variant="outline" className="mt-1 text-xs" style={{ borderColor: ECOBLEND_BLUE, color: ECOBLEND_BLUE }}>
                {["Build", "Validate"].includes(summary.latestDecision) ? "Active" : "Hold"}
              </Badge>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
            <div className="flex-1 rounded-lg p-3 border text-center" style={{ borderColor: ECOBLEND_GREEN, background: "#f0fdf4" }}>
              <Wrench size={20} className="mx-auto mb-1" style={{ color: ECOBLEND_GREEN }} />
              <p className="text-xs font-bold text-green-700">ECORACE</p>
              <p className="text-xs text-green-500">Product Development</p>
              <Badge variant="outline" className="mt-1 text-xs" style={{ borderColor: ECOBLEND_GREEN, color: ECOBLEND_GREEN }}>
                {["Build", "Validate"].includes(summary.latestDecision) ? "Active" : "Hold"}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Business Risk Tab (University Ownership) ──────────────────────────────────
function BusinessRiskTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.dualRisk.getBusinessRisk.useQuery({ ventureId }, { enabled: !!ventureId });
  const upsert = trpc.dualRisk.upsertBusinessRisk.useMutation({
    onSuccess: () => { utils.dualRisk.getBusinessRisk.invalidate(); utils.dualRisk.getDualRiskSummary.invalidate(); toast.success("Business risk saved"); },
    onError: () => toast.error("Failed to save"),
  });

  const [vals, setVals] = useState({
    marketRiskScore: 50, marketSizeScore: 50, competitorIntensity: 50, demandValidation: 50,
    esgRiskScore: 50, carbonFootprintRisk: 50, socialLicenceRisk: 50, supplyChainEsgRisk: 50,
    regulatoryRiskScore: 50, complianceComplexity: 50, certificationBarrier: 50, jurisdictionRisk: 50,
    commercialViabilityScore: 50, revenueModelClarity: 50, unitEconomicsScore: 50, partnershipReadiness: 50,
    strategicRiskScore: 50, ipProtectionStrength: 50, teamCapabilityRisk: 50,
    executionTrack: "BEBUS" as "BEBUS" | "ECORACE" | "Both",
    notes: "",
  });

  // Sync from DB
  useMemo(() => {
    if (existing) {
      setVals(prev => ({
        ...prev,
        marketRiskScore: existing.marketRiskScore ?? 50,
        marketSizeScore: existing.marketSizeScore ?? 50,
        competitorIntensity: existing.competitorIntensity ?? 50,
        demandValidation: existing.demandValidation ?? 50,
        esgRiskScore: existing.esgRiskScore ?? 50,
        carbonFootprintRisk: existing.carbonFootprintRisk ?? 50,
        socialLicenceRisk: existing.socialLicenceRisk ?? 50,
        supplyChainEsgRisk: existing.supplyChainEsgRisk ?? 50,
        regulatoryRiskScore: existing.regulatoryRiskScore ?? 50,
        complianceComplexity: existing.complianceComplexity ?? 50,
        certificationBarrier: existing.certificationBarrier ?? 50,
        jurisdictionRisk: existing.jurisdictionRisk ?? 50,
        commercialViabilityScore: existing.commercialViabilityScore ?? 50,
        revenueModelClarity: existing.revenueModelClarity ?? 50,
        unitEconomicsScore: existing.unitEconomicsScore ?? 50,
        partnershipReadiness: existing.partnershipReadiness ?? 50,
        strategicRiskScore: existing.strategicRiskScore ?? 50,
        ipProtectionStrength: existing.ipProtectionStrength ?? 50,
        teamCapabilityRisk: existing.teamCapabilityRisk ?? 50,
        executionTrack: (existing.executionTrack as any) ?? "BEBUS",
        notes: existing.notes ?? "",
      }));
    }
  }, [existing]);

  const set = (key: keyof typeof vals) => (v: number) => setVals(prev => ({ ...prev, [key]: v }));

  // Compute live BRI
  const liveBri = Math.round((
    vals.marketRiskScore * 0.30 +
    vals.esgRiskScore * 0.25 +
    vals.regulatoryRiskScore * 0.20 +
    vals.strategicRiskScore * 0.15 +
    (100 - vals.commercialViabilityScore) * 0.10
  ) * 10) / 10;

  const radarData = [
    { subject: "Market", value: vals.marketRiskScore },
    { subject: "ESG", value: vals.esgRiskScore },
    { subject: "Regulatory", value: vals.regulatoryRiskScore },
    { subject: "Commercial", value: 100 - vals.commercialViabilityScore },
    { subject: "Strategic", value: vals.strategicRiskScore },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><Building2 size={16} style={{ color: ECOBLEND_BLUE }} /> Business Risk Engine</h2>
          <p className="text-xs text-gray-500 mt-0.5">University Ownership · Market, ESG, Regulatory, Commercial, Strategic dimensions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400">Business Risk Index</p>
            <p className="text-2xl font-bold" style={{ color: riskColor(liveBri) }}>{liveBri.toFixed(1)}%</p>
          </div>
          <Button size="sm" onClick={() => upsert.mutate({ ventureId, ...vals })} disabled={upsert.isPending}
            style={{ background: ECOBLEND_BLUE, color: "#fff" }}>
            {upsert.isPending ? <RefreshCw size={13} className="animate-spin mr-1" /> : null} Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Risk Radar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar dataKey="value" stroke={ECOBLEND_BLUE} fill={ECOBLEND_BLUE} fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Sliders */}
        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Market Risk (30%)</h3>
          <RiskSliderRow label="Market Size Confidence" value={vals.marketSizeScore} onChange={set("marketSizeScore")} tooltip="TAM/SAM/SOM confidence" />
          <RiskSliderRow label="Competitor Intensity" value={vals.competitorIntensity} onChange={set("competitorIntensity")} />
          <RiskSliderRow label="Demand Validation" value={vals.demandValidation} onChange={set("demandValidation")} />
          <RiskSliderRow label="Market Risk Score" value={vals.marketRiskScore} onChange={set("marketRiskScore")} />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-3 mb-2">ESG Risk (25%)</h3>
          <RiskSliderRow label="Carbon Footprint Risk" value={vals.carbonFootprintRisk} onChange={set("carbonFootprintRisk")} />
          <RiskSliderRow label="Social Licence Risk" value={vals.socialLicenceRisk} onChange={set("socialLicenceRisk")} />
          <RiskSliderRow label="Supply Chain ESG" value={vals.supplyChainEsgRisk} onChange={set("supplyChainEsgRisk")} />
          <RiskSliderRow label="ESG Risk Score" value={vals.esgRiskScore} onChange={set("esgRiskScore")} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Regulatory Risk (20%)</h3>
          <RiskSliderRow label="Compliance Complexity" value={vals.complianceComplexity} onChange={set("complianceComplexity")} />
          <RiskSliderRow label="Certification Barrier" value={vals.certificationBarrier} onChange={set("certificationBarrier")} />
          <RiskSliderRow label="Jurisdiction Risk" value={vals.jurisdictionRisk} onChange={set("jurisdictionRisk")} />
          <RiskSliderRow label="Regulatory Risk Score" value={vals.regulatoryRiskScore} onChange={set("regulatoryRiskScore")} />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-3 mb-2">Commercial Viability (10% inverted)</h3>
          <RiskSliderRow label="Revenue Model Clarity" value={vals.revenueModelClarity} onChange={set("revenueModelClarity")} invert />
          <RiskSliderRow label="Unit Economics" value={vals.unitEconomicsScore} onChange={set("unitEconomicsScore")} invert />
          <RiskSliderRow label="Partnership Readiness" value={vals.partnershipReadiness} onChange={set("partnershipReadiness")} invert />
          <RiskSliderRow label="Commercial Viability" value={vals.commercialViabilityScore} onChange={set("commercialViabilityScore")} invert />
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Strategic Risk (15%)</h3>
          <RiskSliderRow label="IP Protection Strength" value={vals.ipProtectionStrength} onChange={set("ipProtectionStrength")} invert />
          <RiskSliderRow label="Team Capability Risk" value={vals.teamCapabilityRisk} onChange={set("teamCapabilityRisk")} />
          <RiskSliderRow label="Strategic Risk Score" value={vals.strategicRiskScore} onChange={set("strategicRiskScore")} />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-3 mb-2">Execution Track</h3>
          <Select value={vals.executionTrack} onValueChange={(v: any) => setVals(prev => ({ ...prev, executionTrack: v }))}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BEBUS">BEBUS (Business Validation)</SelectItem>
              <SelectItem value="ECORACE">ECORACE (Product Dev)</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
            </SelectContent>
          </Select>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-3 mb-2">Notes</h3>
          <Textarea value={vals.notes} onChange={e => setVals(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="University risk assessment notes..." className="text-sm resize-none" rows={4} />
        </div>
      </div>
    </div>
  );
}

// ── Product Risk Tab (Founder Ownership) ─────────────────────────────────────
function ProductRiskTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.dualRisk.getProductRisk.useQuery({ ventureId }, { enabled: !!ventureId });
  const upsert = trpc.dualRisk.upsertProductRisk.useMutation({
    onSuccess: () => { utils.dualRisk.getProductRisk.invalidate(); utils.dualRisk.getDualRiskSummary.invalidate(); toast.success("Product risk saved"); },
    onError: () => toast.error("Failed to save"),
  });

  const [vals, setVals] = useState({
    technicalFeasibilityScore: 50, prototypeMaturity: 50, technologyReadiness: 50,
    performanceRiskScore: 50, benchmarkGap: 50, qualityRisk: 50, reliabilityRisk: 50,
    scalabilityRiskScore: 50, manufacturingRisk: 50, supplyChainRisk: 50, unitCostScalability: 50,
    engineeringComplexity: 50, integrationRisk: 50, dependencyRisk: 50,
    rdMaturityScore: 50, labValidationScore: 50, pilotTestScore: 50,
    executionTrack: "ECORACE" as "BEBUS" | "ECORACE" | "Both",
    notes: "",
  });

  useMemo(() => {
    if (existing) {
      setVals(prev => ({
        ...prev,
        technicalFeasibilityScore: existing.technicalFeasibilityScore ?? 50,
        prototypeMaturity: existing.prototypeMaturity ?? 50,
        technologyReadiness: existing.technologyReadiness ?? 50,
        performanceRiskScore: existing.performanceRiskScore ?? 50,
        benchmarkGap: existing.benchmarkGap ?? 50,
        qualityRisk: existing.qualityRisk ?? 50,
        reliabilityRisk: existing.reliabilityRisk ?? 50,
        scalabilityRiskScore: existing.scalabilityRiskScore ?? 50,
        manufacturingRisk: existing.manufacturingRisk ?? 50,
        supplyChainRisk: existing.supplyChainRisk ?? 50,
        unitCostScalability: existing.unitCostScalability ?? 50,
        engineeringComplexity: existing.engineeringComplexity ?? 50,
        integrationRisk: existing.integrationRisk ?? 50,
        dependencyRisk: existing.dependencyRisk ?? 50,
        rdMaturityScore: existing.rdMaturityScore ?? 50,
        labValidationScore: existing.labValidationScore ?? 50,
        pilotTestScore: existing.pilotTestScore ?? 50,
        executionTrack: (existing.executionTrack as any) ?? "ECORACE",
        notes: existing.notes ?? "",
      }));
    }
  }, [existing]);

  const set = (key: keyof typeof vals) => (v: number) => setVals(prev => ({ ...prev, [key]: v }));

  const livePri = Math.round((
    vals.performanceRiskScore * 0.25 +
    vals.scalabilityRiskScore * 0.25 +
    vals.engineeringComplexity * 0.20 +
    (100 - vals.technicalFeasibilityScore) * 0.15 +
    (100 - vals.rdMaturityScore) * 0.15
  ) * 10) / 10;

  const radarData = [
    { subject: "Performance", value: vals.performanceRiskScore },
    { subject: "Scalability", value: vals.scalabilityRiskScore },
    { subject: "Engineering", value: vals.engineeringComplexity },
    { subject: "Feasibility", value: 100 - vals.technicalFeasibilityScore },
    { subject: "R&D Maturity", value: 100 - vals.rdMaturityScore },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><Wrench size={16} style={{ color: ECOBLEND_GREEN }} /> Product Risk Engine</h2>
          <p className="text-xs text-gray-500 mt-0.5">Founder Ownership · Technical, Performance, Scalability, Engineering, R&D dimensions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400">Product Risk Index</p>
            <p className="text-2xl font-bold" style={{ color: riskColor(livePri) }}>{livePri.toFixed(1)}%</p>
          </div>
          <Button size="sm" onClick={() => upsert.mutate({ ventureId, ...vals })} disabled={upsert.isPending}
            style={{ background: ECOBLEND_GREEN, color: "#fff" }}>
            {upsert.isPending ? <RefreshCw size={13} className="animate-spin mr-1" /> : null} Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Risk Radar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar dataKey="value" stroke={ECOBLEND_GREEN} fill={ECOBLEND_GREEN} fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Technical Feasibility (15% inverted)</h3>
          <RiskSliderRow label="Prototype Maturity" value={vals.prototypeMaturity} onChange={set("prototypeMaturity")} invert />
          <RiskSliderRow label="Technology Readiness" value={vals.technologyReadiness} onChange={set("technologyReadiness")} invert />
          <RiskSliderRow label="Feasibility Score" value={vals.technicalFeasibilityScore} onChange={set("technicalFeasibilityScore")} invert />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-3 mb-2">Performance Risk (25%)</h3>
          <RiskSliderRow label="Benchmark Gap" value={vals.benchmarkGap} onChange={set("benchmarkGap")} />
          <RiskSliderRow label="Quality Risk" value={vals.qualityRisk} onChange={set("qualityRisk")} />
          <RiskSliderRow label="Reliability Risk" value={vals.reliabilityRisk} onChange={set("reliabilityRisk")} />
          <RiskSliderRow label="Performance Risk Score" value={vals.performanceRiskScore} onChange={set("performanceRiskScore")} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Scalability Risk (25%)</h3>
          <RiskSliderRow label="Manufacturing Risk" value={vals.manufacturingRisk} onChange={set("manufacturingRisk")} />
          <RiskSliderRow label="Supply Chain Risk" value={vals.supplyChainRisk} onChange={set("supplyChainRisk")} />
          <RiskSliderRow label="Unit Cost Scalability" value={vals.unitCostScalability} onChange={set("unitCostScalability")} />
          <RiskSliderRow label="Scalability Risk Score" value={vals.scalabilityRiskScore} onChange={set("scalabilityRiskScore")} />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-3 mb-2">Engineering Complexity (20%)</h3>
          <RiskSliderRow label="Integration Risk" value={vals.integrationRisk} onChange={set("integrationRisk")} />
          <RiskSliderRow label="Dependency Risk" value={vals.dependencyRisk} onChange={set("dependencyRisk")} />
          <RiskSliderRow label="Engineering Complexity" value={vals.engineeringComplexity} onChange={set("engineeringComplexity")} />
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">R&D Maturity (15% inverted)</h3>
          <RiskSliderRow label="Lab Validation Score" value={vals.labValidationScore} onChange={set("labValidationScore")} invert tooltip="EcoRace lab results" />
          <RiskSliderRow label="Pilot Test Score" value={vals.pilotTestScore} onChange={set("pilotTestScore")} invert />
          <RiskSliderRow label="R&D Maturity Score" value={vals.rdMaturityScore} onChange={set("rdMaturityScore")} invert />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-3 mb-2">Execution Track</h3>
          <Select value={vals.executionTrack} onValueChange={(v: any) => setVals(prev => ({ ...prev, executionTrack: v }))}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BEBUS">BEBUS (Business Validation)</SelectItem>
              <SelectItem value="ECORACE">ECORACE (Product Dev)</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
            </SelectContent>
          </Select>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-3 mb-2">Notes</h3>
          <Textarea value={vals.notes} onChange={e => setVals(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Founder product risk notes..." className="text-sm resize-none" rows={4} />
        </div>
      </div>
    </div>
  );
}

// ── VRL Engine Tab ────────────────────────────────────────────────────────────
function VrlEngineTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: bizRisk } = trpc.dualRisk.getBusinessRisk.useQuery({ ventureId }, { enabled: !!ventureId });
  const { data: prodRisk } = trpc.dualRisk.getProductRisk.useQuery({ ventureId }, { enabled: !!ventureId });
  const compute = trpc.dualRisk.computeVrl.useMutation({
    onSuccess: (result) => {
      utils.dualRisk.listDecisions.invalidate();
      utils.dualRisk.getDualRiskSummary.invalidate();
      setResult(result);
      toast.success(`Decision: ${result.decision} — VRL ${result.vrlScore.toFixed(2)}`);
    },
    onError: () => toast.error("Computation failed"),
  });

  const [params, setParams] = useState({
    trlScore: 4.5, brlScore: 4.0, esgScore: 60,
    confidenceScore: 0.6, alphaWeight: 0.45, betaWeight: 0.55,
    executionTrack: "Both" as "BEBUS" | "ECORACE" | "Both" | "None",
    decidedBy: "", decisionRationale: "",
  });
  const [result, setResult] = useState<{ vrlScore: number; vrlLevel: number; decision: string; businessRiskIndex: number; productRiskIndex: number; esgBonus: number } | null>(null);

  const liveVrl = useMemo(() => {
    const bri = (bizRisk?.businessRiskIndex ?? 50) / 100;
    const pri = (prodRisk?.productRiskIndex ?? 50) / 100;
    const raw = (params.alphaWeight * params.trlScore + params.betaWeight * params.brlScore)
      * (1 - bri * 0.5) * (1 - pri * 0.5) * params.confidenceScore;
    const esgBonus = params.esgScore > 70 ? 0.3 : 0;
    return Math.min(9, Math.max(0, raw + esgBonus));
  }, [params, bizRisk, prodRisk]);

  const liveLevel = Math.max(1, Math.min(9, Math.round(liveVrl)));
  const liveDecision = liveVrl >= 6 && (bizRisk?.businessRiskIndex ?? 50) < 40 && (prodRisk?.productRiskIndex ?? 50) < 40 ? "Build"
    : liveVrl >= 4 && (bizRisk?.businessRiskIndex ?? 50) < 60 && (prodRisk?.productRiskIndex ?? 50) < 60 ? "Validate"
    : liveVrl >= 3 ? "Partner" : "Reject";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><Calculator size={16} style={{ color: ECOBLEND_PURPLE }} /> VRL Engine</h2>
          <p className="text-xs text-gray-500 mt-0.5">Combines Business Risk + Product Risk → VRL Score → Decision Output</p>
        </div>
        <Button size="sm" onClick={() => compute.mutate({ ventureId, ...params })} disabled={compute.isPending}
          style={{ background: ECOBLEND_PURPLE, color: "#fff" }}>
          {compute.isPending ? <RefreshCw size={13} className="animate-spin mr-1" /> : <Zap size={13} className="mr-1" />} Compute & Log
        </Button>
      </div>

      {/* Live preview */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Live Preview</h3>
          <span className="text-xs text-gray-400">Updates as you adjust inputs</span>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">VRL Score</p>
            <p className="text-4xl font-bold" style={{ color: VRL_9_LEVELS[liveLevel - 1]?.color }}>{liveVrl.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">VRL Level</p>
            <VrlBadge level={liveLevel} />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Decision</p>
            <DecisionBadge decision={liveDecision} />
          </div>
          <div className="flex-1 text-xs text-gray-500 bg-white rounded-lg p-3 border">
            {DECISION_CONFIG[liveDecision]?.desc}
          </div>
        </div>
      </div>

      {/* Input parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Readiness Inputs</h3>
          <div>
            <Label className="text-xs text-gray-600">TRL Score (0–9)</Label>
            <div className="flex items-center gap-3 mt-1">
              <Slider min={0} max={9} step={0.1} value={[params.trlScore]} onValueChange={([v]) => setParams(p => ({ ...p, trlScore: v }))} className="flex-1" />
              <span className="text-sm font-mono font-bold w-10 text-right">{params.trlScore.toFixed(1)}</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">BRL Score (0–9)</Label>
            <div className="flex items-center gap-3 mt-1">
              <Slider min={0} max={9} step={0.1} value={[params.brlScore]} onValueChange={([v]) => setParams(p => ({ ...p, brlScore: v }))} className="flex-1" />
              <span className="text-sm font-mono font-bold w-10 text-right">{params.brlScore.toFixed(1)}</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">ESG Score (0–100)</Label>
            <div className="flex items-center gap-3 mt-1">
              <Slider min={0} max={100} step={1} value={[params.esgScore]} onValueChange={([v]) => setParams(p => ({ ...p, esgScore: v }))} className="flex-1" />
              <span className="text-sm font-mono font-bold w-10 text-right">{params.esgScore}</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Confidence Score (0.2–1.0)</Label>
            <div className="flex items-center gap-3 mt-1">
              <Slider min={0.2} max={1.0} step={0.05} value={[params.confidenceScore]} onValueChange={([v]) => setParams(p => ({ ...p, confidenceScore: v }))} className="flex-1" />
              <span className="text-sm font-mono font-bold w-10 text-right">{params.confidenceScore.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Formula Weights</h3>
          <div>
            <Label className="text-xs text-gray-600">α — TRL Weight</Label>
            <div className="flex items-center gap-3 mt-1">
              <Slider min={0} max={1} step={0.05} value={[params.alphaWeight]} onValueChange={([v]) => setParams(p => ({ ...p, alphaWeight: v, betaWeight: Math.round((1 - v) * 100) / 100 }))} className="flex-1" />
              <span className="text-sm font-mono font-bold w-10 text-right">{params.alphaWeight.toFixed(2)}</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">β — BRL Weight (auto-balanced)</Label>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-2 rounded-full bg-gray-100 relative overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${params.betaWeight * 100}%`, background: ECOBLEND_GREEN }} />
              </div>
              <span className="text-sm font-mono font-bold w-10 text-right">{params.betaWeight.toFixed(2)}</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Execution Track</Label>
            <Select value={params.executionTrack} onValueChange={(v: any) => setParams(p => ({ ...p, executionTrack: v }))}>
              <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BEBUS">BEBUS</SelectItem>
                <SelectItem value="ECORACE">ECORACE</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
                <SelectItem value="None">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Decided By</Label>
            <Input value={params.decidedBy} onChange={e => setParams(p => ({ ...p, decidedBy: e.target.value }))} placeholder="Name or role..." className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Decision Rationale</Label>
            <Textarea value={params.decisionRationale} onChange={e => setParams(p => ({ ...p, decisionRationale: e.target.value }))} placeholder="Why this decision..." className="mt-1 text-sm resize-none" rows={3} />
          </div>
        </div>
      </div>

      {/* Risk index display */}
      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Current Risk Indices (from saved data)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: riskColor(bizRisk?.businessRiskIndex ?? 50) }}>
            <Building2 size={18} style={{ color: riskColor(bizRisk?.businessRiskIndex ?? 50) }} />
            <div>
              <p className="text-xs text-gray-500">Business Risk Index (BRI)</p>
              <p className="text-xl font-bold" style={{ color: riskColor(bizRisk?.businessRiskIndex ?? 50) }}>{(bizRisk?.businessRiskIndex ?? 50).toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: riskColor(prodRisk?.productRiskIndex ?? 50) }}>
            <Wrench size={18} style={{ color: riskColor(prodRisk?.productRiskIndex ?? 50) }} />
            <div>
              <p className="text-xs text-gray-500">Product Risk Index (PRI)</p>
              <p className="text-xl font-bold" style={{ color: riskColor(prodRisk?.productRiskIndex ?? 50) }}>{(prodRisk?.productRiskIndex ?? 50).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border p-5" style={{ background: DECISION_CONFIG[result.decision]?.bg, borderColor: DECISION_CONFIG[result.decision]?.color }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: DECISION_CONFIG[result.decision]?.color }}>Last Computed Result</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            {[
              { label: "VRL Score", val: result.vrlScore.toFixed(2) },
              { label: "VRL Level", val: `Level ${result.vrlLevel}` },
              { label: "Decision", val: result.decision },
              { label: "BRI", val: `${result.businessRiskIndex.toFixed(1)}%` },
              { label: "PRI", val: `${result.productRiskIndex.toFixed(1)}%` },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white rounded-lg p-2 border">
                <p className="text-gray-400">{label}</p>
                <p className="font-bold text-gray-800 mt-0.5">{val}</p>
              </div>
            ))}
          </div>
          {result.esgBonus > 0 && <p className="text-xs mt-2 text-green-600 font-semibold">+{result.esgBonus.toFixed(1)} ESG bonus applied (ESG &gt; 70)</p>}
        </div>
      )}
    </div>
  );
}

// ── Decision Log Tab ──────────────────────────────────────────────────────────
function DecisionLogTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: decisions = [], isLoading } = trpc.dualRisk.listDecisions.useQuery({ ventureId }, { enabled: !!ventureId });
  const updateFeedback = trpc.dualRisk.updateFeedback.useMutation({
    onSuccess: () => { utils.dualRisk.listDecisions.invalidate(); toast.success("Feedback saved"); },
  });
  const deleteDecision = trpc.dualRisk.deleteDecision.useMutation({
    onSuccess: () => { utils.dualRisk.listDecisions.invalidate(); utils.dualRisk.getDualRiskSummary.invalidate(); toast.success("Decision removed"); },
  });

  const [feedbackDialog, setFeedbackDialog] = useState<{ id: number; marketFeedback: string; feedbackScore: number } | null>(null);

  if (isLoading) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><ListChecks size={16} style={{ color: ECOBLEND_AMBER }} /> Decision Log</h2>
          <p className="text-xs text-gray-500 mt-0.5">{decisions.length} decisions logged · Feedback loop tracks market response</p>
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Calculator size={32} className="mb-2 opacity-30" />
          <p className="text-sm">No decisions yet. Use the VRL Engine tab to compute and log decisions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map(d => {
            const cfg = DECISION_CONFIG[d.decision];
            const Icon = cfg?.icon ?? Info;
            return (
              <div key={d.id} className="bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg?.bg, border: `1.5px solid ${cfg?.color}` }}>
                      <Icon size={18} style={{ color: cfg?.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <DecisionBadge decision={d.decision} />
                        <VrlBadge level={d.vrlLevel} />
                        <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</span>
                        {d.executionTrack && d.executionTrack !== "None" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{d.executionTrack}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{d.decisionRationale}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => setFeedbackDialog({ id: d.id, marketFeedback: d.marketFeedback ?? "", feedbackScore: d.feedbackScore ?? 50 })}>
                      <MessageSquare size={11} className="mr-1" /> Feedback
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-red-500 hover:text-red-600" onClick={() => deleteDecision.mutate({ id: d.id })}>
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  {[
                    { label: "VRL Score", val: d.vrlScore.toFixed(2) },
                    { label: "BRI", val: `${d.businessRiskIndex.toFixed(1)}%` },
                    { label: "PRI", val: `${d.productRiskIndex.toFixed(1)}%` },
                    { label: "TRL", val: d.trlScore.toFixed(1) },
                    { label: "BRL", val: d.brlScore.toFixed(1) },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-400">{label}</p>
                      <p className="font-bold text-gray-700">{val}</p>
                    </div>
                  ))}
                </div>
                {d.marketFeedback && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700">
                    <span className="font-semibold">Market Feedback:</span> {d.marketFeedback}
                    {d.feedbackScore != null && <span className="ml-2 font-bold">({d.feedbackScore.toFixed(0)}/100)</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback dialog */}
      {feedbackDialog && (
        <Dialog open onOpenChange={() => setFeedbackDialog(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Market Feedback</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs">Feedback Score (0–100)</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Slider min={0} max={100} step={1} value={[feedbackDialog.feedbackScore]} onValueChange={([v]) => setFeedbackDialog(prev => prev ? { ...prev, feedbackScore: v } : null)} className="flex-1" />
                  <span className="text-sm font-mono font-bold w-10">{feedbackDialog.feedbackScore}</span>
                </div>
              </div>
              <div>
                <Label className="text-xs">Market Feedback Notes</Label>
                <Textarea value={feedbackDialog.marketFeedback} onChange={e => setFeedbackDialog(prev => prev ? { ...prev, marketFeedback: e.target.value } : null)}
                  placeholder="Describe the market response..." className="mt-1 text-sm resize-none" rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFeedbackDialog(null)}>Cancel</Button>
              <Button onClick={() => { updateFeedback.mutate({ id: feedbackDialog.id, marketFeedback: feedbackDialog.marketFeedback, feedbackScore: feedbackDialog.feedbackScore }); setFeedbackDialog(null); }}
                style={{ background: ECOBLEND_AMBER, color: "#fff" }}>Save Feedback</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",  label: "Overview",       icon: TrendingUp },
  { id: "business",  label: "Business Risk",  icon: Building2 },
  { id: "product",   label: "Product Risk",   icon: Wrench },
  { id: "engine",    label: "VRL Engine",     icon: Calculator },
  { id: "log",       label: "Decision Log",   icon: ListChecks },
];

export default function DualRiskEngine() {
  const { ventures } = useVentures();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedVentureId, setSelectedVentureId] = useState(ventures[0]?.id ?? "");

  const ventureList = ventures.map(v => ({ id: v.id, name: v.name, color: v.color }));

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#e53e3e15", color: "#e53e3e" }}>Dual Risk Engine</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">VRL = (α×TRL + β×BRL) × (1−BRI) × (1−PRI) × Confidence</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Dual Risk Venture Creation System</h1>
            <p className="text-sm text-gray-500 mt-0.5">Separates Business Risk (University) and Product Risk (Founder) · Decision Outputs: Build / Validate / Partner / Reject</p>
          </div>
        </div>
        <VentureSelector selectedId={selectedVentureId} onChange={setSelectedVentureId} ventures={ventureList} />
      </div>

      {/* Tabs */}
      <div className="border-b bg-white px-8">
        <div className="flex gap-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{ borderColor: activeTab === tab.id ? "#e53e3e" : "transparent", color: activeTab === tab.id ? "#e53e3e" : "#6b7280" }}>
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {activeTab === "overview"  && <OverviewTab ventureId={selectedVentureId} ventures={ventures} />}
        {activeTab === "business"  && <BusinessRiskTab ventureId={selectedVentureId} />}
        {activeTab === "product"   && <ProductRiskTab ventureId={selectedVentureId} />}
        {activeTab === "engine"    && <VrlEngineTab ventureId={selectedVentureId} />}
        {activeTab === "log"       && <DecisionLogTab ventureId={selectedVentureId} />}
      </div>
    </div>
  );
}
