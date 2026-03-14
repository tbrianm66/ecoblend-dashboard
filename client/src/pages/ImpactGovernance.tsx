// ============================================================
// IMPACT GOVERNANCE ENGINE — IRL Analytics Dashboard
// IRL = (ESG + LCA + PCF + CSR + Certification) / 5
// Total Venture Intelligence Score = VRL + IRL
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Leaf, Users, Building2, FlaskConical, Recycle, BarChart3,
  Award, CheckCircle2, Clock, AlertCircle, RefreshCw, ChevronDown, ChevronUp,
  Globe, Zap, Droplets, TreePine, Factory, Truck, ShoppingCart, Trash2,
  TrendingUp, Shield, Heart, Star,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

// ── Colour helpers ────────────────────────────────────────────────────────────
const scoreColor = (v: number) =>
  v >= 7 ? "#51AF37" : v >= 4 ? "#F49C13" : "#ef4444";

const scoreLabel = (v: number) =>
  v >= 7 ? "Strong" : v >= 4 ? "Developing" : "Early Stage";

const certStatusColor: Record<string, string> = {
  "Certified":     "#51AF37",
  "Under Review":  "#3A97D3",
  "In Progress":   "#F49C13",
  "Gap Analysis":  "#a855f7",
  "Not Started":   "#9ca3af",
  "Lapsed":        "#ef4444",
};

const certStatusIcon: Record<string, React.ReactNode> = {
  "Certified":     <CheckCircle2 size={14} />,
  "Under Review":  <Clock size={14} />,
  "In Progress":   <RefreshCw size={14} />,
  "Gap Analysis":  <AlertCircle size={14} />,
  "Not Started":   <AlertCircle size={14} />,
  "Lapsed":        <AlertCircle size={14} />,
};

// ── IRL Score Gauge ───────────────────────────────────────────────────────────
function IrlGauge({ score, label }: { score: number; label: string }) {
  const pct = (score / 10) * 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={scoreColor(score)} strokeWidth="10"
            strokeDasharray={`${pct * 2.51} 251`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold" style={{ color: scoreColor(score) }}>
            {score.toFixed(1)}
          </span>
          <span className="text-[9px] text-gray-400 font-mono">/10</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <Badge
        variant="outline"
        className="text-[10px] px-1.5"
        style={{ borderColor: scoreColor(score), color: scoreColor(score) }}
      >
        {scoreLabel(score)}
      </Badge>
    </div>
  );
}

// ── Slider Row ────────────────────────────────────────────────────────────────
function SliderRow({
  label, value, onChange, icon,
}: {
  label: string; value: number; onChange: (v: number) => void; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 text-gray-400 flex-shrink-0">{icon}</div>
      <span className="text-xs text-gray-600 w-44 flex-shrink-0">{label}</span>
      <input
        type="range" min={0} max={10} step={0.5}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-green-500"
      />
      <span
        className="text-xs font-bold w-8 text-right font-mono"
        style={{ color: scoreColor(value) }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ── ESG Panel ─────────────────────────────────────────────────────────────────
function EsgPanel({ ventureId }: { ventureId: string }) {
  const { data: existing, refetch } = trpc.irl.getEsg.useQuery({ ventureId });
  const upsert = trpc.irl.upsertEsg.useMutation({
    onSuccess: (d) => { toast.success(`ESG score saved: ${d.esgScore}/10`); refetch(); },
    onError: () => toast.error("Failed to save ESG data"),
  });

  const [env, setEnv] = useState({
    carbonEmissionsScore: existing?.carbonEmissionsScore ?? 5,
    energyEfficiencyScore: existing?.energyEfficiencyScore ?? 5,
    waterManagementScore: existing?.waterManagementScore ?? 5,
    wasteCircularityScore: existing?.wasteCircularityScore ?? 5,
    biodiversityScore: existing?.biodiversityScore ?? 5,
  });
  const [soc, setSoc] = useState({
    workerWellbeingScore: existing?.workerWellbeingScore ?? 5,
    diversityInclusionScore: existing?.diversityInclusionScore ?? 5,
    communityEngagementScore: existing?.communityEngagementScore ?? 5,
    supplyChainEthicsScore: existing?.supplyChainEthicsScore ?? 5,
  });
  const [gov, setGov] = useState({
    boardTransparencyScore: existing?.boardTransparencyScore ?? 5,
    ethicsAntiCorruptionScore: existing?.ethicsAntiCorruptionScore ?? 5,
    stakeholderEngagementScore: existing?.stakeholderEngagementScore ?? 5,
    dataPrivacyScore: existing?.dataPrivacyScore ?? 5,
  });
  const [framework, setFramework] = useState(existing?.esgFrameworkUsed ?? "");

  const envAvg = Object.values(env).reduce((a, b) => a + b, 0) / 5;
  const socAvg = Object.values(soc).reduce((a, b) => a + b, 0) / 4;
  const govAvg = Object.values(gov).reduce((a, b) => a + b, 0) / 4;
  const esgAvg = (envAvg + socAvg + govAvg) / 3;

  const radarData = [
    { axis: "Environmental", value: envAvg },
    { axis: "Social", value: socAvg },
    { axis: "Governance", value: govAvg },
  ];

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4">
        <IrlGauge score={esgAvg} label="ESG Score" />
        <IrlGauge score={envAvg} label="Environmental" />
        <IrlGauge score={socAvg} label="Social" />
        <IrlGauge score={govAvg} label="Governance" />
      </div>

      {/* Radar */}
      <div className="bg-gray-50 rounded-xl p-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 10]} tick={false} />
            <Radar dataKey="value" stroke="#51AF37" fill="#51AF37" fillOpacity={0.25} />
            <Tooltip formatter={(v: number) => v.toFixed(1)} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Input sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environmental */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={14} className="text-green-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Environmental</span>
          </div>
          <SliderRow label="Carbon Emissions" value={env.carbonEmissionsScore} onChange={v => setEnv(p => ({ ...p, carbonEmissionsScore: v }))} icon={<Globe size={13} />} />
          <SliderRow label="Energy Efficiency" value={env.energyEfficiencyScore} onChange={v => setEnv(p => ({ ...p, energyEfficiencyScore: v }))} icon={<Zap size={13} />} />
          <SliderRow label="Water Management" value={env.waterManagementScore} onChange={v => setEnv(p => ({ ...p, waterManagementScore: v }))} icon={<Droplets size={13} />} />
          <SliderRow label="Waste & Circularity" value={env.wasteCircularityScore} onChange={v => setEnv(p => ({ ...p, wasteCircularityScore: v }))} icon={<Recycle size={13} />} />
          <SliderRow label="Biodiversity" value={env.biodiversityScore} onChange={v => setEnv(p => ({ ...p, biodiversityScore: v }))} icon={<TreePine size={13} />} />
        </div>

        {/* Social */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Social</span>
          </div>
          <SliderRow label="Worker Wellbeing" value={soc.workerWellbeingScore} onChange={v => setSoc(p => ({ ...p, workerWellbeingScore: v }))} icon={<Heart size={13} />} />
          <SliderRow label="Diversity & Inclusion" value={soc.diversityInclusionScore} onChange={v => setSoc(p => ({ ...p, diversityInclusionScore: v }))} icon={<Users size={13} />} />
          <SliderRow label="Community Engagement" value={soc.communityEngagementScore} onChange={v => setSoc(p => ({ ...p, communityEngagementScore: v }))} icon={<Globe size={13} />} />
          <SliderRow label="Supply Chain Ethics" value={soc.supplyChainEthicsScore} onChange={v => setSoc(p => ({ ...p, supplyChainEthicsScore: v }))} icon={<Shield size={13} />} />
        </div>

        {/* Governance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={14} className="text-purple-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Governance</span>
          </div>
          <SliderRow label="Board Transparency" value={gov.boardTransparencyScore} onChange={v => setGov(p => ({ ...p, boardTransparencyScore: v }))} icon={<Building2 size={13} />} />
          <SliderRow label="Ethics & Anti-Corruption" value={gov.ethicsAntiCorruptionScore} onChange={v => setGov(p => ({ ...p, ethicsAntiCorruptionScore: v }))} icon={<Shield size={13} />} />
          <SliderRow label="Stakeholder Engagement" value={gov.stakeholderEngagementScore} onChange={v => setGov(p => ({ ...p, stakeholderEngagementScore: v }))} icon={<Users size={13} />} />
          <SliderRow label="Data Privacy" value={gov.dataPrivacyScore} onChange={v => setGov(p => ({ ...p, dataPrivacyScore: v }))} icon={<Shield size={13} />} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          className="border rounded px-2 py-1 text-xs flex-1 max-w-xs"
          placeholder="Framework used (GRI, SASB, TCFD…)"
          value={framework}
          onChange={e => setFramework(e.target.value)}
        />
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          style={{ background: "#51AF37" }}
          onClick={() => upsert.mutate({ ventureId, ...env, ...soc, ...gov, esgFrameworkUsed: framework })}
          disabled={upsert.isPending}
        >
          {upsert.isPending ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
          Save ESG Scores
        </Button>
      </div>
    </div>
  );
}

// ── LCA Panel ─────────────────────────────────────────────────────────────────
const LCA_STAGES = [
  { key: "Raw Material Extraction", icon: <TreePine size={14} />, color: "#8b5cf6" },
  { key: "Manufacturing",           icon: <Factory size={14} />,  color: "#3A97D3" },
  { key: "Distribution & Logistics",icon: <Truck size={14} />,    color: "#F49C13" },
  { key: "Use Phase",               icon: <ShoppingCart size={14} />, color: "#51AF37" },
  { key: "End of Life",             icon: <Trash2 size={14} />,   color: "#ef4444" },
] as const;

function LcaPanel({ ventureId }: { ventureId: string }) {
  const { data: stages = [], refetch } = trpc.irl.getLca.useQuery({ ventureId });
  const upsert = trpc.irl.upsertLcaStage.useMutation({
    onSuccess: () => { toast.success("LCA stage saved"); refetch(); },
    onError: () => toast.error("Failed to save LCA stage"),
  });
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [maturity, setMaturity] = useState(5);
  const [actions, setActions] = useState("");
  const [target, setTarget] = useState(30);

  const stageData = (key: string) => stages.find(s => s.stage === key);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Assess the environmental maturity of each product life cycle stage (0 = no assessment, 10 = fully optimised).
      </p>
      <div className="grid grid-cols-5 gap-3">
        {LCA_STAGES.map(({ key, icon, color }) => {
          const row = stageData(key);
          const score = row?.assessmentMaturityScore ?? 0;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveStage(activeStage === key ? null : key);
                setMaturity(row?.assessmentMaturityScore ?? 5);
                setActions(row?.improvementActions ?? "");
                setTarget(row?.targetReductionPercent ?? 30);
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:shadow-md"
              style={{
                borderColor: activeStage === key ? color : "#e5e7eb",
                background: activeStage === key ? `${color}10` : "white",
              }}
            >
              <div style={{ color }}>{icon}</div>
              <span className="text-[10px] font-semibold text-center text-gray-600 leading-tight">{key}</span>
              <div className="w-full h-1.5 rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${score * 10}%`, background: color }} />
              </div>
              <span className="text-xs font-bold font-mono" style={{ color }}>{score.toFixed(1)}</span>
            </button>
          );
        })}
      </div>

      {activeStage && (
        <div className="border rounded-xl p-4 space-y-3" style={{ borderColor: "#e5e7eb" }}>
          <h4 className="text-sm font-bold text-gray-700">{activeStage} — Assessment</h4>
          <SliderRow
            label="Assessment Maturity (0–10)"
            value={maturity}
            onChange={setMaturity}
            icon={<BarChart3 size={13} />}
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 w-44">Target Reduction %</label>
            <input
              type="number" min={0} max={100} step={5}
              value={target}
              onChange={e => setTarget(parseFloat(e.target.value))}
              className="border rounded px-2 py-1 text-xs w-20"
            />
          </div>
          <textarea
            className="w-full border rounded px-2 py-1 text-xs h-20 resize-none"
            placeholder="Improvement actions and initiatives…"
            value={actions}
            onChange={e => setActions(e.target.value)}
          />
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            style={{ background: "#51AF37" }}
            onClick={() => upsert.mutate({
              ventureId,
              stage: activeStage as any,
              assessmentMaturityScore: maturity,
              improvementActions: actions,
              targetReductionPercent: target,
            })}
            disabled={upsert.isPending}
          >
            {upsert.isPending ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Save Stage
          </Button>
        </div>
      )}
    </div>
  );
}

// ── PCF Panel ─────────────────────────────────────────────────────────────────
function PcfPanel({ ventureId }: { ventureId: string }) {
  const { data: existing, refetch } = trpc.irl.getPcf.useQuery({ ventureId });
  const upsert = trpc.irl.upsertPcf.useMutation({
    onSuccess: (d) => { toast.success(`PCF saved — ${d.totalEmissions.toFixed(1)} tCO₂e total`); refetch(); },
    onError: () => toast.error("Failed to save PCF data"),
  });

  const [s1, setS1] = useState(existing?.scope1Emissions ?? 0);
  const [s2, setS2] = useState(existing?.scope2Emissions ?? 0);
  const [s3, setS3] = useState(existing?.scope3Emissions ?? 0);
  const [netZero, setNetZero] = useState(existing?.netZeroCommitment ?? false);
  const [sbt, setSbt] = useState(existing?.scienceBasedTarget ?? false);
  const [targetPct, setTargetPct] = useState(existing?.targetReductionPercent ?? 50);
  const [standard, setStandard] = useState(existing?.measurementStandard ?? "GHG Protocol");

  const total = s1 + s2 + s3;
  let pcfScore = 0;
  if (total > 0) pcfScore += 3;
  if (sbt) pcfScore += 3;
  if (netZero) pcfScore += 2;
  if (targetPct >= 50) pcfScore += 2;

  const scopeData = [
    { scope: "Scope 1", value: s1, color: "#ef4444", desc: "Direct emissions (owned sources)" },
    { scope: "Scope 2", value: s2, color: "#F49C13", desc: "Indirect — purchased energy" },
    { scope: "Scope 3", value: s3, color: "#3A97D3", desc: "Value chain emissions" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4 items-center">
        <IrlGauge score={pcfScore} label="PCF Score" />
        <div className="col-span-3 grid grid-cols-3 gap-3">
          {scopeData.map(({ scope, value, color, desc }) => (
            <div key={scope} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${color}` }}>
              <div className="text-xs font-bold text-gray-500 mb-1">{scope}</div>
              <div className="text-2xl font-bold font-mono" style={{ color }}>{value.toFixed(1)}</div>
              <div className="text-[10px] text-gray-400">tCO₂e</div>
              <div className="text-[10px] text-gray-400 mt-1">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Emissions Input (tCO₂e/year)</h4>
          {[
            { label: "Scope 1 — Direct", val: s1, set: setS1 },
            { label: "Scope 2 — Purchased Energy", val: s2, set: setS2 },
            { label: "Scope 3 — Value Chain", val: s3, set: setS3 },
          ].map(({ label, val, set }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-48">{label}</span>
              <input
                type="number" min={0} step={0.1}
                value={val}
                onChange={e => set(parseFloat(e.target.value) || 0)}
                className="border rounded px-2 py-1 text-xs w-24 font-mono"
              />
              <span className="text-xs text-gray-400">tCO₂e</span>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-1 border-t">
            <span className="text-xs font-bold text-gray-700 w-48">Total Emissions</span>
            <span className="text-sm font-bold font-mono" style={{ color: scoreColor(10 - Math.min(total / 100, 10)) }}>
              {total.toFixed(1)} tCO₂e
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Commitments & Targets</h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={netZero} onChange={e => setNetZero(e.target.checked)} className="accent-green-500" />
            <span className="text-xs text-gray-600">Net-Zero Commitment</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={sbt} onChange={e => setSbt(e.target.checked)} className="accent-green-500" />
            <span className="text-xs text-gray-600">Science Based Targets (SBTi) aligned</span>
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-40">Reduction Target (%)</span>
            <input
              type="number" min={0} max={100} step={5}
              value={targetPct}
              onChange={e => setTargetPct(parseFloat(e.target.value) || 0)}
              className="border rounded px-2 py-1 text-xs w-20 font-mono"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-40">Measurement Standard</span>
            <input
              className="border rounded px-2 py-1 text-xs flex-1"
              value={standard}
              onChange={e => setStandard(e.target.value)}
              placeholder="GHG Protocol, ISO 14064…"
            />
          </div>
        </div>
      </div>

      <Button
        size="sm"
        className="gap-1.5 text-xs"
        style={{ background: "#51AF37" }}
        onClick={() => upsert.mutate({
          ventureId,
          scope1Emissions: s1, scope2Emissions: s2, scope3Emissions: s3,
          netZeroCommitment: netZero, scienceBasedTarget: sbt,
          targetReductionPercent: targetPct, measurementStandard: standard,
        })}
        disabled={upsert.isPending}
      >
        {upsert.isPending ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
        Save PCF Data
      </Button>
    </div>
  );
}

// ── CSR Panel ─────────────────────────────────────────────────────────────────
function CsrPanel({ ventureId }: { ventureId: string }) {
  const { data: existing, refetch } = trpc.irl.getCsr.useQuery({ ventureId });
  const upsert = trpc.irl.upsertCsr.useMutation({
    onSuccess: (d) => { toast.success(`CSR score saved: ${d.csrScore}/10`); refetch(); },
    onError: () => toast.error("Failed to save CSR data"),
  });

  const [scores, setScores] = useState({
    philanthropyScore:          existing?.philanthropyScore ?? 5,
    ethicalSourcingScore:       existing?.ethicalSourcingScore ?? 5,
    communityInvestmentScore:   existing?.communityInvestmentScore ?? 5,
    employeeVolunteeringScore:  existing?.employeeVolunteeringScore ?? 5,
    transparencyReportingScore: existing?.transparencyReportingScore ?? 5,
  });
  const [reportPublished, setReportPublished] = useState(existing?.csrReportPublished ?? false);
  const [framework, setFramework] = useState(existing?.reportingFramework ?? "");
  const [sdgs, setSdgs] = useState(existing?.sdgAlignments ?? "");

  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / 5;

  const csrDimensions = [
    { key: "philanthropyScore",          label: "Philanthropy & Giving",      icon: <Heart size={13} /> },
    { key: "ethicalSourcingScore",        label: "Ethical Sourcing",           icon: <Shield size={13} /> },
    { key: "communityInvestmentScore",    label: "Community Investment",       icon: <Globe size={13} /> },
    { key: "employeeVolunteeringScore",   label: "Employee Volunteering",      icon: <Users size={13} /> },
    { key: "transparencyReportingScore",  label: "Transparency & Reporting",   icon: <BarChart3 size={13} /> },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <IrlGauge score={avg} label="CSR Score" />
        <div className="flex-1 space-y-3">
          {csrDimensions.map(({ key, label, icon }) => (
            <SliderRow
              key={key}
              label={label}
              value={scores[key]}
              onChange={v => setScores(p => ({ ...p, [key]: v }))}
              icon={icon}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={reportPublished} onChange={e => setReportPublished(e.target.checked)} className="accent-green-500" />
          <span className="text-xs text-gray-600">CSR Report Published</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-24">Framework</span>
          <input
            className="border rounded px-2 py-1 text-xs flex-1"
            value={framework}
            onChange={e => setFramework(e.target.value)}
            placeholder="GRI, UN SDGs…"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-24">SDG Alignments</span>
          <input
            className="border rounded px-2 py-1 text-xs flex-1"
            value={sdgs}
            onChange={e => setSdgs(e.target.value)}
            placeholder="SDG 7, 12, 13…"
          />
        </div>
      </div>

      <Button
        size="sm"
        className="gap-1.5 text-xs"
        style={{ background: "#51AF37" }}
        onClick={() => upsert.mutate({ ventureId, ...scores, csrReportPublished: reportPublished, reportingFramework: framework, sdgAlignments: sdgs })}
        disabled={upsert.isPending}
      >
        {upsert.isPending ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
        Save CSR Scores
      </Button>
    </div>
  );
}

// ── Certification Panel ───────────────────────────────────────────────────────
const CERT_OPTIONS = [
  "B Corp", "ISO 14001", "ISO 26000", "ISO 50001", "ISO 9001",
  "ISO 45001", "GRI Standards", "UN Global Compact",
  "Science Based Targets (SBTi)", "Carbon Neutral Certified", "Other",
] as const;

const STATUS_OPTIONS = [
  "Not Started", "Gap Analysis", "In Progress", "Under Review", "Certified", "Lapsed",
] as const;

function CertPanel({ ventureId }: { ventureId: string }) {
  const { data: certs = [], refetch } = trpc.irl.getCertifications.useQuery({ ventureId });
  const upsert = trpc.irl.upsertCertification.useMutation({
    onSuccess: () => { toast.success("Certification saved"); refetch(); setAdding(false); },
    onError: () => toast.error("Failed to save certification"),
  });
  const del = trpc.irl.deleteCertification.useMutation({
    onSuccess: () => { toast.success("Removed"); refetch(); },
  });

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    certificationName: "B Corp" as typeof CERT_OPTIONS[number],
    status: "Not Started" as typeof STATUS_OPTIONS[number],
    progressPercent: 0,
    bImpactScore: 0,
    certifyingBody: "",
    notes: "",
  });

  const avgCertScore = certs.length > 0
    ? certs.reduce((s, c) => s + (c.certificationScore ?? 0), 0) / certs.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IrlGauge score={avgCertScore} label="Cert Score" />
          <div>
            <p className="text-sm font-bold text-gray-700">{certs.length} certification{certs.length !== 1 ? "s" : ""} tracked</p>
            <p className="text-xs text-gray-400">
              {certs.filter(c => c.status === "Certified").length} certified ·{" "}
              {certs.filter(c => c.status === "In Progress").length} in progress
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setAdding(!adding)}>
          {adding ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {adding ? "Cancel" : "Add Certification"}
        </Button>
      </div>

      {adding && (
        <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
          <h4 className="text-sm font-bold text-gray-700">New Certification</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Certification</label>
              <select
                className="w-full border rounded px-2 py-1 text-xs"
                value={form.certificationName}
                onChange={e => setForm(p => ({ ...p, certificationName: e.target.value as any }))}
              >
                {CERT_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select
                className="w-full border rounded px-2 py-1 text-xs"
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
              >
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Progress %</label>
              <input type="number" min={0} max={100} className="w-full border rounded px-2 py-1 text-xs"
                value={form.progressPercent} onChange={e => setForm(p => ({ ...p, progressPercent: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">B Impact Score (if B Corp)</label>
              <input type="number" min={0} max={200} className="w-full border rounded px-2 py-1 text-xs"
                value={form.bImpactScore} onChange={e => setForm(p => ({ ...p, bImpactScore: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Certifying Body</label>
              <input className="w-full border rounded px-2 py-1 text-xs" value={form.certifyingBody}
                onChange={e => setForm(p => ({ ...p, certifyingBody: e.target.value }))} placeholder="B Lab, BSI, SGS…" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notes</label>
              <input className="w-full border rounded px-2 py-1 text-xs" value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#51AF37" }}
            onClick={() => upsert.mutate({ ventureId, ...form })} disabled={upsert.isPending}>
            {upsert.isPending ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Save
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {certs.map(cert => (
          <div key={cert.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center gap-1.5" style={{ color: certStatusColor[cert.status] }}>
              {certStatusIcon[cert.status]}
              <span className="text-xs font-semibold">{cert.status}</span>
            </div>
            <span className="text-sm font-bold text-gray-700 flex-1">{cert.certificationName}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{
                  width: `${cert.progressPercent ?? 0}%`,
                  background: certStatusColor[cert.status],
                }} />
              </div>
              <span className="text-xs font-mono text-gray-400">{cert.progressPercent ?? 0}%</span>
            </div>
            {cert.bImpactScore && cert.bImpactScore > 0 && (
              <Badge variant="outline" className="text-[10px]" style={{ borderColor: "#51AF37", color: "#51AF37" }}>
                B Impact: {cert.bImpactScore}
              </Badge>
            )}
            <button
              onClick={() => del.mutate({ id: cert.id })}
              className="text-gray-300 hover:text-red-400 transition-colors text-xs"
            >✕</button>
          </div>
        ))}
        {certs.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">
            No certifications tracked yet. Add your first certification above.
          </p>
        )}
      </div>
    </div>
  );
}

// ── IRL Score Summary Card ────────────────────────────────────────────────────
function IrlSummaryCard({ ventureId }: { ventureId: string }) {
  const { data: irl, refetch } = trpc.irl.getIrlScore.useQuery({ ventureId });
  const compute = trpc.irl.computeIrl.useMutation({
    onSuccess: () => { toast.success("IRL score recomputed"); refetch(); },
    onError: () => toast.error("Failed to compute IRL score"),
  });

  const components = [
    { label: "ESG",           value: irl?.esgScore ?? 0,           color: "#51AF37" },
    { label: "LCA",           value: irl?.lcaScore ?? 0,           color: "#8b5cf6" },
    { label: "PCF",           value: irl?.pcfScore ?? 0,           color: "#3A97D3" },
    { label: "CSR",           value: irl?.csrScore ?? 0,           color: "#F49C13" },
    { label: "Certification", value: irl?.certificationScore ?? 0, color: "#ec4899" },
  ];

  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">IRL Score</h3>
          <p className="text-xs text-gray-400">Impact Readiness Level = (ESG + LCA + PCF + CSR + Cert) / 5</p>
        </div>
        <Button
          size="sm" variant="outline" className="gap-1.5 text-xs"
          onClick={() => compute.mutate({ ventureId })}
          disabled={compute.isPending}
        >
          {compute.isPending ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Recompute
        </Button>
      </div>

      <div className="flex items-center gap-6">
        <IrlGauge score={irl?.irlScore ?? 0} label="IRL" />
        <div className="flex-1 space-y-2">
          {components.map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-24">{label}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${value * 10}%`, background: color }} />
              </div>
              <span className="text-xs font-bold font-mono w-8 text-right" style={{ color }}>{value.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Total VIS</div>
          <div className="text-3xl font-bold" style={{ color: scoreColor((irl?.totalVentureIntelligenceScore ?? 0) / 2) }}>
            {(irl?.totalVentureIntelligenceScore ?? 0).toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-400">VRL + IRL</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ImpactGovernance() {
  const { ventures } = useVentures();
  const [selectedVenture, setSelectedVenture] = useState(ventures[0]?.id ?? "ecoblend");
  const venture = ventures.find(v => v.id === selectedVenture);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "#51AF3715", color: "#51AF37" }}>
                Impact Governance Engine
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">IRL = (ESG + LCA + PCF + CSR + Certification) / 5</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Impact Readiness Level
            </h1>
            <p className="text-sm text-gray-500 max-w-xl mt-0.5">
              Measure and improve each venture's environmental, social, and governance performance.
              Combined with VRL to produce the Total Venture Intelligence Score.
            </p>
          </div>
          {/* Venture selector */}
          <select
            className="border rounded-lg px-3 py-2 text-sm font-semibold text-gray-700"
            value={selectedVenture}
            onChange={e => setSelectedVenture(e.target.value)}
          >
            {ventures.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* IRL Summary */}
        <IrlSummaryCard ventureId={selectedVenture} />

        {/* Module tabs */}
        <Tabs defaultValue="esg">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="esg" className="gap-1.5 text-xs">
              <Leaf size={12} /> ESG Analytics
            </TabsTrigger>
            <TabsTrigger value="lca" className="gap-1.5 text-xs">
              <Recycle size={12} /> Life Cycle Assessment
            </TabsTrigger>
            <TabsTrigger value="pcf" className="gap-1.5 text-xs">
              <Globe size={12} /> Carbon Footprint
            </TabsTrigger>
            <TabsTrigger value="csr" className="gap-1.5 text-xs">
              <Heart size={12} /> CSR Metrics
            </TabsTrigger>
            <TabsTrigger value="cert" className="gap-1.5 text-xs">
              <Award size={12} /> Certifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="esg">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Leaf size={14} className="text-green-500" />
                  ESG Analytics — Environmental, Social & Governance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EsgPanel ventureId={selectedVenture} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lca">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Recycle size={14} className="text-purple-500" />
                  Life Cycle Assessment — 5-Stage Environmental Maturity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LcaPanel ventureId={selectedVenture} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pcf">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe size={14} className="text-blue-500" />
                  Product Carbon Footprint — Scope 1, 2 & 3 Emissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PcfPanel ventureId={selectedVenture} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="csr">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart size={14} className="text-pink-500" />
                  CSR Metrics — Corporate Social Responsibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CsrPanel ventureId={selectedVenture} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cert">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award size={14} className="text-yellow-500" />
                  Certification Tracker — B Corp, ISO, GRI, SBTi & More
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CertPanel ventureId={selectedVenture} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
