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
  DollarSign, CheckSquare, HardHat, Handshake, Scale, PackageX, Wrench,
  ClipboardCheck, Target, Activity, Plus, Wind,
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

        {/* ── LCSSA Section ─────────────────────────────────────────────── */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: "#e5e7eb" }} />
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg, #dcfce7, #dbeafe)", color: "#1a2332" }}>
              <Globe size={12} /> Life Cycle Sustainability Assessment (LCSSA)
            </div>
            <div className="h-px flex-1" style={{ background: "#e5e7eb" }} />
          </div>
          <LcssaSection ventureId={selectedVenture} />
        </div>
      </div>
    </div>
  );
}

// ── LCSSA Colour palette ──────────────────────────────────────────────────────
const LC = {
  env:  { bg: "#16a34a", light: "#dcfce7", text: "#15803d", border: "#86efac" },
  soc:  { bg: "#2563eb", light: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  lcc:  { bg: "#d97706", light: "#fef3c7", text: "#b45309", border: "#fcd34d" },
  gov:  { bg: "#7c3aed", light: "#ede9fe", text: "#6d28d9", border: "#c4b5fd" },
  dec:  { bg: "#0f766e", light: "#ccfbf1", text: "#0d9488", border: "#5eead4" },
};

function LcssaScoreGauge({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize={size < 60 ? 11 : 14}
        fontWeight="700" fill={color}>{Math.round(score)}</text>
    </svg>
  );
}

function LcssaSlider({ label, value, onChange, min = 0, max = 100, step = 1, unit = "", color = "#16a34a" }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; unit?: string; color?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }} />
    </div>
  );
}

function LcssaToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <button onClick={() => onChange(!value)}
        className="w-10 h-5 rounded-full transition-colors flex items-center px-0.5"
        style={{ background: value ? "#16a34a" : "#d1d5db" }}>
        <div className="w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: value ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}

function LcssaNumField({ label, value, onChange, unit = "" }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <div className="flex items-center gap-1">
        <input type="number" value={value} min={0} step={0.1}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1"
          style={{ borderColor: "#e5e7eb" }} />
        {unit && <span className="text-xs text-gray-400 flex-shrink-0">{unit}</span>}
      </div>
    </div>
  );
}

// ── LCSSA Overview ────────────────────────────────────────────────────────────
function LcssaOverview({ ventureId }: { ventureId: string }) {
  const { data: summary, isLoading } = trpc.lcssa.getLcssaSummary.useQuery({ ventureId });
  if (isLoading) return <div className="flex items-center justify-center py-12"><RefreshCw size={18} className="animate-spin text-gray-400" /></div>;
  const envScore = summary?.environmentalScore ?? 0;
  const socScore = summary?.socialScore ?? 0;
  const lccScore = summary?.lccScore ?? 0;
  const govScore = summary?.oversightScore ?? 0;
  const lcssaScore = summary?.lcssaScore ?? 0;
  return (
    <div className="space-y-5">
      {/* LCSSA Score Banner */}
      <div className="rounded-2xl border p-5 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #16a34a 0%, #2563eb 50%, #7c3aed 100%)" }}>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">Integrated Sustainability Framework</div>
            <h3 className="text-xl font-bold mb-1">LCSSA Score</h3>
            <p className="text-xs opacity-80">Planet 35% + People 30% + Profit 20% + Governance 15%</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold">{lcssaScore.toFixed(1)}</div>
            <div className="text-xs opacity-80 mt-1">/ 100</div>
          </div>
        </div>
      </div>
      {/* 4 pillar cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Environmental LCA", sub: "Planet", score: envScore, color: LC.env.bg, icon: <Leaf size={16} /> },
          { label: "Social LCA", sub: "People", score: socScore, color: LC.soc.bg, icon: <Users size={16} /> },
          { label: "Life Cycle Costing", sub: "Profit", score: lccScore, color: LC.lcc.bg, icon: <DollarSign size={16} /> },
          { label: "Oversight", sub: "Governance", score: govScore, color: LC.gov.bg, icon: <Shield size={16} /> },
        ].map(p => (
          <div key={p.label} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-bold" style={{ color: p.color }}>{p.label}</div>
                <div className="text-xs text-gray-400 italic">{p.sub}</div>
              </div>
              <LcssaScoreGauge score={p.score} color={p.color} size={52} />
            </div>
            <Progress value={p.score} className="h-1.5" style={{ backgroundColor: `${p.color}20` }} />
          </div>
        ))}
      </div>
      {/* Decision summary */}
      <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: LC.dec.border }}>
        <div className="flex items-center gap-2 mb-2">
          <CheckSquare size={14} style={{ color: LC.dec.bg }} />
          <span className="text-sm font-bold" style={{ color: LC.dec.bg }}>Sustainable Decision Making</span>
          <span className="ml-auto text-xs text-gray-400">{summary?.decisionCount ?? 0} decisions · {summary?.implementedDecisions ?? 0} implemented</span>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center text-xs">
          {[
            { label: "Environmental LCA", weight: "35%", color: LC.env.bg },
            { label: "Social LCA", weight: "30%", color: LC.soc.bg },
            { label: "Life Cycle Costing", weight: "20%", color: LC.lcc.bg },
            { label: "Governance", weight: "15%", color: LC.gov.bg },
          ].map(p => (
            <div key={p.label} className="rounded-lg p-2 bg-gray-50">
              <div className="text-lg font-bold" style={{ color: p.color }}>{p.weight}</div>
              <div className="text-gray-500 leading-tight">{p.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LCSSA Environmental ───────────────────────────────────────────────────────
function LcssaEnvironmental({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.lcssa.getEnvironmental.useQuery({ ventureId });
  const upsert = trpc.lcssa.upsertEnvironmental.useMutation({
    onSuccess: () => { utils.lcssa.getEnvironmental.invalidate({ ventureId }); utils.lcssa.getLcssaSummary.invalidate({ ventureId }); toast.success("Environmental LCA saved"); },
    onError: e => toast.error(e.message),
  });
  const [form, setForm] = useState({ carbonFootprintKg: 0, carbonFootprintScope1: 0, carbonFootprintScope2: 0, carbonFootprintScope3: 0, carbonReductionTarget: 0, energyConsumptionKwh: 0, waterUsageLitres: 0, renewableEnergyPct: 0, materialEfficiencyPct: 0, wasteGeneratedKg: 0, wasteRecycledPct: 0, airPollutionIndex: 0, waterPollutionIndex: 0, biodiversityScore: 0, landUseHectares: 0, ecosystemServicesScore: 0, notes: "" });
  const sanitise = (obj: Record<string, any>) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v]));
  const values = existing ? { ...form, ...sanitise(existing as any) } : form;
  const set = (k: string, v: number | string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold" style={{ color: LC.env.bg }}>Environmental LCA — Planet</div>
          <div className="text-xs text-gray-400">Carbon Footprint · Resource Use · Pollution & Waste · Ecosystem Impact</div>
        </div>
        <div className="flex items-center gap-2">
          {existing && <LcssaScoreGauge score={existing.environmentalScore ?? 0} color={LC.env.bg} size={48} />}
          <Button size="sm" onClick={() => upsert.mutate({ ventureId, ...values })} disabled={upsert.isPending} style={{ background: LC.env.bg, color: "white" }}>
            {upsert.isPending ? <RefreshCw size={11} className="animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: LC.env.bg }}><Wind size={12} /> Carbon Footprint</div>
          <div className="space-y-3">
            <LcssaSlider label="Total Carbon Footprint" value={values.carbonFootprintKg ?? 0} onChange={v => set("carbonFootprintKg", v)} max={100000} unit=" kg CO₂" color={LC.env.bg} />
            <LcssaSlider label="Scope 1 (Direct)" value={values.carbonFootprintScope1 ?? 0} onChange={v => set("carbonFootprintScope1", v)} max={50000} unit=" kg" color={LC.env.bg} />
            <LcssaSlider label="Scope 2 (Energy)" value={values.carbonFootprintScope2 ?? 0} onChange={v => set("carbonFootprintScope2", v)} max={50000} unit=" kg" color={LC.env.bg} />
            <LcssaSlider label="Scope 3 (Value Chain)" value={values.carbonFootprintScope3 ?? 0} onChange={v => set("carbonFootprintScope3", v)} max={100000} unit=" kg" color={LC.env.bg} />
            <LcssaSlider label="Reduction Target" value={values.carbonReductionTarget ?? 0} onChange={v => set("carbonReductionTarget", v)} max={100} unit="%" color={LC.env.bg} />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: "#0891b2" }}><Zap size={12} /> Resource Use</div>
          <div className="space-y-3">
            <LcssaSlider label="Energy Consumption" value={values.energyConsumptionKwh ?? 0} onChange={v => set("energyConsumptionKwh", v)} max={1000000} unit=" kWh" color="#0891b2" />
            <LcssaSlider label="Water Usage" value={values.waterUsageLitres ?? 0} onChange={v => set("waterUsageLitres", v)} max={1000000} unit=" L" color="#0891b2" />
            <LcssaSlider label="Renewable Energy" value={values.renewableEnergyPct ?? 0} onChange={v => set("renewableEnergyPct", v)} max={100} unit="%" color="#0891b2" />
            <LcssaSlider label="Material Efficiency" value={values.materialEfficiencyPct ?? 0} onChange={v => set("materialEfficiencyPct", v)} max={100} unit="%" color="#0891b2" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: "#dc2626" }}><AlertCircle size={12} /> Pollution & Waste</div>
          <div className="space-y-3">
            <LcssaSlider label="Waste Generated" value={values.wasteGeneratedKg ?? 0} onChange={v => set("wasteGeneratedKg", v)} max={100000} unit=" kg" color="#dc2626" />
            <LcssaSlider label="Waste Recycled" value={values.wasteRecycledPct ?? 0} onChange={v => set("wasteRecycledPct", v)} max={100} unit="%" color="#dc2626" />
            <LcssaSlider label="Air Pollution Index" value={values.airPollutionIndex ?? 0} onChange={v => set("airPollutionIndex", v)} max={10} unit="/10" color="#dc2626" />
            <LcssaSlider label="Water Pollution Index" value={values.waterPollutionIndex ?? 0} onChange={v => set("waterPollutionIndex", v)} max={10} unit="/10" color="#dc2626" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: "#16a34a" }}><TreePine size={12} /> Ecosystem Impact</div>
          <div className="space-y-3">
            <LcssaSlider label="Biodiversity Score" value={values.biodiversityScore ?? 0} onChange={v => set("biodiversityScore", v)} max={10} unit="/10" color="#16a34a" />
            <LcssaSlider label="Land Use" value={values.landUseHectares ?? 0} onChange={v => set("landUseHectares", v)} max={1000} unit=" ha" color="#16a34a" />
            <LcssaSlider label="Ecosystem Services Score" value={values.ecosystemServicesScore ?? 0} onChange={v => set("ecosystemServicesScore", v)} max={10} unit="/10" color="#16a34a" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LCSSA Social ──────────────────────────────────────────────────────────────
function LcssaSocial({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.lcssa.getSocial.useQuery({ ventureId });
  const upsert = trpc.lcssa.upsertSocial.useMutation({
    onSuccess: () => { utils.lcssa.getSocial.invalidate({ ventureId }); utils.lcssa.getLcssaSummary.invalidate({ ventureId }); toast.success("Social LCA saved"); },
    onError: e => toast.error(e.message),
  });
  const [form, setForm] = useState({ livingWageCompliance: false, avgWorkingHoursPerWeek: 40, employeeTurnoverPct: 0, collectiveBargaining: false, humanRightsDueDiligence: false, supplyChainAuditScore: 0, childLaborRisk: "Low" as "Low" | "Medium" | "High", forcedLaborRisk: "Low" as "Low" | "Medium" | "High", localHiringPct: 0, communityInvestmentGbp: 0, communityEngagementScore: 0, ltifr: 0, nearMissReports: 0, safetyTrainingHours: 0, healthSafetyScore: 0, notes: "" });
  const sanitise = (obj: Record<string, any>) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v]));
  const values = existing ? { ...form, ...sanitise(existing as any) } : form;
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold" style={{ color: LC.soc.bg }}>Social LCA — People</div>
          <div className="text-xs text-gray-400">Labor Conditions · Human Rights · Community Impact · Health & Safety</div>
        </div>
        <div className="flex items-center gap-2">
          {existing && <LcssaScoreGauge score={existing.socialScore ?? 0} color={LC.soc.bg} size={48} />}
          <Button size="sm" onClick={() => upsert.mutate({ ventureId, ...values })} disabled={upsert.isPending} style={{ background: LC.soc.bg, color: "white" }}>
            {upsert.isPending ? <RefreshCw size={11} className="animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: LC.soc.bg }}><Scale size={12} /> Labor Conditions</div>
          <div className="space-y-2">
            <LcssaToggle label="Living Wage Compliance" value={values.livingWageCompliance ?? false} onChange={v => set("livingWageCompliance", v)} />
            <LcssaToggle label="Collective Bargaining" value={values.collectiveBargaining ?? false} onChange={v => set("collectiveBargaining", v)} />
            <LcssaSlider label="Avg Working Hours/Week" value={values.avgWorkingHoursPerWeek ?? 40} onChange={v => set("avgWorkingHoursPerWeek", v)} min={20} max={80} unit=" h" color={LC.soc.bg} />
            <LcssaSlider label="Employee Turnover" value={values.employeeTurnoverPct ?? 0} onChange={v => set("employeeTurnoverPct", v)} max={100} unit="%" color={LC.soc.bg} />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: "#7c3aed" }}><Handshake size={12} /> Human Rights</div>
          <div className="space-y-2">
            <LcssaToggle label="HR Due Diligence" value={values.humanRightsDueDiligence ?? false} onChange={v => set("humanRightsDueDiligence", v)} />
            <LcssaSlider label="Supply Chain Audit Score" value={values.supplyChainAuditScore ?? 0} onChange={v => set("supplyChainAuditScore", v)} max={10} unit="/10" color="#7c3aed" />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-600">Child Labour Risk</div>
              <div className="flex gap-2">{(["Low", "Medium", "High"] as const).map(r => <button key={r} onClick={() => set("childLaborRisk", r)} className="flex-1 text-xs py-1 rounded-lg font-semibold border transition-all" style={{ background: values.childLaborRisk === r ? "#7c3aed" : "white", color: values.childLaborRisk === r ? "white" : "#6b7280", borderColor: values.childLaborRisk === r ? "#7c3aed" : "#e5e7eb" }}>{r}</button>)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-600">Forced Labour Risk</div>
              <div className="flex gap-2">{(["Low", "Medium", "High"] as const).map(r => <button key={r} onClick={() => set("forcedLaborRisk", r)} className="flex-1 text-xs py-1 rounded-lg font-semibold border transition-all" style={{ background: values.forcedLaborRisk === r ? "#7c3aed" : "white", color: values.forcedLaborRisk === r ? "white" : "#6b7280", borderColor: values.forcedLaborRisk === r ? "#7c3aed" : "#e5e7eb" }}>{r}</button>)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: "#0891b2" }}><Building2 size={12} /> Community Impact</div>
          <div className="space-y-2">
            <LcssaSlider label="Local Hiring %" value={values.localHiringPct ?? 0} onChange={v => set("localHiringPct", v)} max={100} unit="%" color="#0891b2" />
            <LcssaNumField label="Community Investment" value={values.communityInvestmentGbp ?? 0} onChange={v => set("communityInvestmentGbp", v)} unit="£" />
            <LcssaSlider label="Community Engagement Score" value={values.communityEngagementScore ?? 0} onChange={v => set("communityEngagementScore", v)} max={10} unit="/10" color="#0891b2" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: "#d97706" }}><HardHat size={12} /> Health & Safety</div>
          <div className="space-y-2">
            <LcssaNumField label="LTIFR" value={values.ltifr ?? 0} onChange={v => set("ltifr", v)} />
            <LcssaNumField label="Near Miss Reports" value={values.nearMissReports ?? 0} onChange={v => set("nearMissReports", v)} />
            <LcssaNumField label="Safety Training Hours" value={values.safetyTrainingHours ?? 0} onChange={v => set("safetyTrainingHours", v)} unit="hrs" />
            <LcssaSlider label="H&S Score" value={values.healthSafetyScore ?? 0} onChange={v => set("healthSafetyScore", v)} max={10} unit="/10" color="#d97706" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LCSSA Life Cycle Costing ──────────────────────────────────────────────────
function LcssaLcc({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.lcssa.getLcc.useQuery({ ventureId });
  const upsert = trpc.lcssa.upsertLcc.useMutation({
    onSuccess: () => { utils.lcssa.getLcc.invalidate({ ventureId }); utils.lcssa.getLcssaSummary.invalidate({ ventureId }); toast.success("Life Cycle Costing saved"); },
    onError: e => toast.error(e.message),
  });
  const [form, setForm] = useState({ rawMaterialCostGbp: 0, manufacturingCostGbp: 0, labourCostGbp: 0, overheadCostGbp: 0, inboundLogisticsCostGbp: 0, outboundLogisticsCostGbp: 0, warehouseCostGbp: 0, plannedMaintenanceCostGbp: 0, unplannedMaintenanceCostGbp: 0, assetLifespanYears: 5, disposalCostGbp: 0, recyclingRevGbp: 0, remediationCostGbp: 0, currency: "GBP", notes: "" });
  const sanitise = (obj: Record<string, any>) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v]));
  const values = existing ? { ...form, ...sanitise(existing as any) } : form;
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const prodTotal = (values.rawMaterialCostGbp ?? 0) + (values.manufacturingCostGbp ?? 0) + (values.labourCostGbp ?? 0) + (values.overheadCostGbp ?? 0);
  const logTotal = (values.inboundLogisticsCostGbp ?? 0) + (values.outboundLogisticsCostGbp ?? 0) + (values.warehouseCostGbp ?? 0);
  const maintTotal = (values.plannedMaintenanceCostGbp ?? 0) + (values.unplannedMaintenanceCostGbp ?? 0);
  const eolTotal = (values.disposalCostGbp ?? 0) - (values.recyclingRevGbp ?? 0) + (values.remediationCostGbp ?? 0);
  const grand = prodTotal + logTotal + maintTotal + eolTotal;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold" style={{ color: LC.lcc.bg }}>Life Cycle Costing — Profit</div>
          <div className="text-xs text-gray-400">Production · Logistics · Maintenance · End-of-Life</div>
        </div>
        <div className="flex items-center gap-2">
          {existing && <LcssaScoreGauge score={existing.lccScore ?? 0} color={LC.lcc.bg} size={48} />}
          <Button size="sm" onClick={() => upsert.mutate({ ventureId, ...values })} disabled={upsert.isPending} style={{ background: LC.lcc.bg, color: "white" }}>
            {upsert.isPending ? <RefreshCw size={11} className="animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
      {/* Cost bar */}
      <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700">Total Life Cycle Cost</span>
          <span className="text-lg font-bold" style={{ color: LC.lcc.bg }}>£{grand.toLocaleString()}</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {[{ v: prodTotal, c: "#d97706" }, { v: logTotal, c: "#0891b2" }, { v: maintTotal, c: "#7c3aed" }, { v: Math.max(0, eolTotal), c: "#dc2626" }].map((p, i) => (
            <div key={i} className="h-full transition-all" style={{ width: `${grand > 0 ? (p.v / grand) * 100 : 25}%`, background: p.c }} />
          ))}
        </div>
        <div className="flex gap-3 mt-2 flex-wrap">
          {[{ l: "Production", v: prodTotal, c: "#d97706" }, { l: "Logistics", v: logTotal, c: "#0891b2" }, { l: "Maintenance", v: maintTotal, c: "#7c3aed" }, { l: "End-of-Life", v: eolTotal, c: "#dc2626" }].map(p => (
            <div key={p.l} className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ background: p.c }} />
              <span className="text-gray-500">{p.l}</span>
              <span className="font-semibold" style={{ color: p.c }}>£{p.v.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: "Production Costs", color: "#d97706", icon: <Factory size={12} />, fields: [{ k: "rawMaterialCostGbp", l: "Raw Materials" }, { k: "manufacturingCostGbp", l: "Manufacturing" }, { k: "labourCostGbp", l: "Labour" }, { k: "overheadCostGbp", l: "Overhead" }] },
          { title: "Logistics Costs", color: "#0891b2", icon: <Truck size={12} />, fields: [{ k: "inboundLogisticsCostGbp", l: "Inbound" }, { k: "outboundLogisticsCostGbp", l: "Outbound" }, { k: "warehouseCostGbp", l: "Warehousing" }] },
          { title: "Maintenance", color: "#7c3aed", icon: <Wrench size={12} />, fields: [{ k: "plannedMaintenanceCostGbp", l: "Planned" }, { k: "unplannedMaintenanceCostGbp", l: "Unplanned" }, { k: "assetLifespanYears", l: "Asset Lifespan (yrs)" }] },
          { title: "End-of-Life Costs", color: "#dc2626", icon: <PackageX size={12} />, fields: [{ k: "disposalCostGbp", l: "Disposal" }, { k: "recyclingRevGbp", l: "Recycling Revenue" }, { k: "remediationCostGbp", l: "Remediation" }] },
        ].map(pillar => (
          <div key={pillar.title} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: pillar.color }}>{pillar.icon} {pillar.title}</div>
            <div className="space-y-2">{pillar.fields.map(f => <LcssaNumField key={f.k} label={f.l} value={(values as any)[f.k] ?? 0} onChange={v => set(f.k, v)} unit={f.k === "assetLifespanYears" ? "yrs" : "£"} />)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LCSSA Oversight ───────────────────────────────────────────────────────────
function LcssaOversight({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.lcssa.getOversight.useQuery({ ventureId });
  const upsert = trpc.lcssa.upsertOversight.useMutation({
    onSuccess: () => { utils.lcssa.getOversight.invalidate({ ventureId }); utils.lcssa.getLcssaSummary.invalidate({ ventureId }); toast.success("Oversight & Governance saved"); },
    onError: e => toast.error(e.message),
  });
  const [form, setForm] = useState({ iso14001Certified: false, iso26000Adopted: false, griReportingLevel: "None" as "None" | "Core" | "Comprehensive", sdgAlignmentCount: 0, policyDocumentUrl: "", complianceScore: 0, reportingFrequency: "Annual" as "Annual" | "Quarterly" | "Monthly", dataQualityScore: 0, thirdPartyVerified: false, verifierName: "", reportUrl: "", boardOversight: false, sustainabilityCommittee: false, stakeholderEngagementScore: 0, notes: "" });
  const sanitise = (obj: Record<string, any>) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v]));
  const values = existing ? { ...form, ...sanitise(existing as any) } : form;
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold" style={{ color: LC.gov.bg }}>LCSA Oversight & Governance</div>
          <div className="text-xs text-gray-400">Policy & Standards · Data & Reporting · Board Governance</div>
        </div>
        <div className="flex items-center gap-2">
          {existing && <LcssaScoreGauge score={existing.oversightScore ?? 0} color={LC.gov.bg} size={48} />}
          <Button size="sm" onClick={() => upsert.mutate({ ventureId, ...values })} disabled={upsert.isPending} style={{ background: LC.gov.bg, color: "white" }}>
            {upsert.isPending ? <RefreshCw size={11} className="animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: LC.gov.bg }}><ClipboardCheck size={12} /> Policy & Standards</div>
          <div className="space-y-2">
            <LcssaToggle label="ISO 14001 Certified" value={values.iso14001Certified ?? false} onChange={v => set("iso14001Certified", v)} />
            <LcssaToggle label="ISO 26000 Adopted" value={values.iso26000Adopted ?? false} onChange={v => set("iso26000Adopted", v)} />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-600">GRI Reporting Level</div>
              <div className="flex gap-2">{(["None", "Core", "Comprehensive"] as const).map(r => <button key={r} onClick={() => set("griReportingLevel", r)} className="flex-1 text-xs py-1 rounded-lg font-semibold border transition-all" style={{ background: values.griReportingLevel === r ? LC.gov.bg : "white", color: values.griReportingLevel === r ? "white" : "#6b7280", borderColor: values.griReportingLevel === r ? LC.gov.bg : "#e5e7eb" }}>{r}</button>)}</div>
            </div>
            <LcssaSlider label="SDGs Addressed" value={values.sdgAlignmentCount ?? 0} onChange={v => set("sdgAlignmentCount", v)} max={17} unit=" SDGs" color={LC.gov.bg} />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: "#0891b2" }}><BarChart3 size={12} /> Data & Reporting</div>
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-600">Reporting Frequency</div>
              <div className="flex gap-2">{(["Annual", "Quarterly", "Monthly"] as const).map(r => <button key={r} onClick={() => set("reportingFrequency", r)} className="flex-1 text-xs py-1 rounded-lg font-semibold border transition-all" style={{ background: values.reportingFrequency === r ? "#0891b2" : "white", color: values.reportingFrequency === r ? "white" : "#6b7280", borderColor: values.reportingFrequency === r ? "#0891b2" : "#e5e7eb" }}>{r}</button>)}</div>
            </div>
            <LcssaSlider label="Data Quality Score" value={values.dataQualityScore ?? 0} onChange={v => set("dataQualityScore", v)} max={10} unit="/10" color="#0891b2" />
            <LcssaToggle label="Third-Party Verified" value={values.thirdPartyVerified ?? false} onChange={v => set("thirdPartyVerified", v)} />
            <LcssaToggle label="Board Oversight" value={values.boardOversight ?? false} onChange={v => set("boardOversight", v)} />
            <LcssaToggle label="Sustainability Committee" value={values.sustainabilityCommittee ?? false} onChange={v => set("sustainabilityCommittee", v)} />
            <LcssaSlider label="Stakeholder Engagement" value={values.stakeholderEngagementScore ?? 0} onChange={v => set("stakeholderEngagementScore", v)} max={10} unit="/10" color={LC.gov.bg} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LCSSA Decision Log ────────────────────────────────────────────────────────
function LcssaDecisions({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: decisions = [], isLoading } = trpc.lcssa.listDecisions.useQuery({ ventureId });
  const addDecision = trpc.lcssa.addDecision.useMutation({
    onSuccess: () => { utils.lcssa.listDecisions.invalidate({ ventureId }); utils.lcssa.getLcssaSummary.invalidate({ ventureId }); setShowAdd(false); setNewForm(df); toast.success("Decision logged"); },
    onError: e => toast.error(e.message),
  });
  const updateStatus = trpc.lcssa.updateDecisionStatus.useMutation({ onSuccess: () => utils.lcssa.listDecisions.invalidate({ ventureId }) });
  const deleteDecision = trpc.lcssa.deleteDecision.useMutation({ onSuccess: () => utils.lcssa.listDecisions.invalidate({ ventureId }) });
  const df = { decisionTitle: "", decisionType: "Integrated" as "Environmental" | "Social" | "Economic" | "Integrated", lcaDimension: "", rationale: "", environmentalImpact: "Neutral" as "Positive" | "Neutral" | "Negative", socialImpact: "Neutral" as "Positive" | "Neutral" | "Negative", economicImpact: "Neutral" as "Positive" | "Neutral" | "Negative", status: "Proposed" as "Proposed" | "Approved" | "Implemented" | "Reviewed", owner: "" };
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState(df);
  const setF = (k: string, v: any) => setNewForm(f => ({ ...f, [k]: v }));
  const statusFlow: Array<"Proposed" | "Approved" | "Implemented" | "Reviewed"> = ["Proposed", "Approved", "Implemented", "Reviewed"];
  const impactColor = (i: string) => i === "Positive" ? "#16a34a" : i === "Negative" ? "#dc2626" : "#6b7280";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold" style={{ color: LC.dec.bg }}>Sustainable Decision Making</div>
          <div className="text-xs text-gray-400">Log decisions informed by the LCSSA integrated framework</div>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} style={{ background: LC.dec.bg, color: "white" }} className="gap-1.5"><Plus size={11} /> Log Decision</Button>
      </div>
      {showAdd && (
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: LC.dec.border }}>
          <div className="text-xs font-bold mb-3" style={{ color: LC.dec.bg }}>New Sustainable Decision</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="lg:col-span-2 space-y-1"><label className="text-xs font-semibold text-gray-600">Decision Title *</label><input type="text" value={newForm.decisionTitle} onChange={e => setF("decisionTitle", e.target.value)} className="w-full text-xs border rounded-lg px-3 py-2 focus:outline-none" style={{ borderColor: "#e5e7eb" }} placeholder="e.g. Switch to 100% renewable energy supplier" /></div>
            <div className="space-y-1"><label className="text-xs font-semibold text-gray-600">Type</label><div className="flex gap-1.5 flex-wrap">{(["Environmental", "Social", "Economic", "Integrated"] as const).map(t => <button key={t} onClick={() => setF("decisionType", t)} className="text-xs px-2 py-1 rounded-lg font-semibold border transition-all" style={{ background: newForm.decisionType === t ? LC.dec.bg : "white", color: newForm.decisionType === t ? "white" : "#6b7280", borderColor: newForm.decisionType === t ? LC.dec.bg : "#e5e7eb" }}>{t}</button>)}</div></div>
            <div className="space-y-1"><label className="text-xs font-semibold text-gray-600">LCA Dimension</label><input type="text" value={newForm.lcaDimension} onChange={e => setF("lcaDimension", e.target.value)} className="w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none" style={{ borderColor: "#e5e7eb" }} placeholder="Environmental LCA / Social LCA / LCC" /></div>
            <div className="space-y-1"><label className="text-xs font-semibold text-gray-600">Environmental Impact</label><div className="flex gap-1.5">{(["Positive", "Neutral", "Negative"] as const).map(i => <button key={i} onClick={() => setF("environmentalImpact", i)} className="flex-1 text-xs py-1 rounded-lg font-semibold border transition-all" style={{ background: newForm.environmentalImpact === i ? LC.env.bg : "white", color: newForm.environmentalImpact === i ? "white" : "#6b7280", borderColor: newForm.environmentalImpact === i ? LC.env.bg : "#e5e7eb" }}>{i}</button>)}</div></div>
            <div className="space-y-1"><label className="text-xs font-semibold text-gray-600">Social Impact</label><div className="flex gap-1.5">{(["Positive", "Neutral", "Negative"] as const).map(i => <button key={i} onClick={() => setF("socialImpact", i)} className="flex-1 text-xs py-1 rounded-lg font-semibold border transition-all" style={{ background: newForm.socialImpact === i ? LC.soc.bg : "white", color: newForm.socialImpact === i ? "white" : "#6b7280", borderColor: newForm.socialImpact === i ? LC.soc.bg : "#e5e7eb" }}>{i}</button>)}</div></div>
            <div className="space-y-1"><label className="text-xs font-semibold text-gray-600">Economic Impact</label><div className="flex gap-1.5">{(["Positive", "Neutral", "Negative"] as const).map(i => <button key={i} onClick={() => setF("economicImpact", i)} className="flex-1 text-xs py-1 rounded-lg font-semibold border transition-all" style={{ background: newForm.economicImpact === i ? LC.lcc.bg : "white", color: newForm.economicImpact === i ? "white" : "#6b7280", borderColor: newForm.economicImpact === i ? LC.lcc.bg : "#e5e7eb" }}>{i}</button>)}</div></div>
            <div className="space-y-1"><label className="text-xs font-semibold text-gray-600">Owner</label><input type="text" value={newForm.owner} onChange={e => setF("owner", e.target.value)} className="w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none" style={{ borderColor: "#e5e7eb" }} placeholder="Decision owner" /></div>
            <div className="lg:col-span-2 space-y-1"><label className="text-xs font-semibold text-gray-600">Rationale</label><textarea value={newForm.rationale} onChange={e => setF("rationale", e.target.value)} rows={2} className="w-full text-xs border rounded-lg px-3 py-2 focus:outline-none resize-none" style={{ borderColor: "#e5e7eb" }} placeholder="Why is this decision being made?" /></div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => addDecision.mutate({ ventureId, ...newForm })} disabled={!newForm.decisionTitle || addDecision.isPending} style={{ background: LC.dec.bg, color: "white" }}>{addDecision.isPending ? <RefreshCw size={11} className="animate-spin" /> : "Log"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}
      {isLoading ? <div className="flex items-center justify-center py-8"><RefreshCw size={16} className="animate-spin text-gray-400" /></div> : decisions.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <Target size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-500">No decisions logged yet</p>
          <p className="text-xs text-gray-400 mt-1">Log your first LCSSA-informed decision</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((d: any) => (
            <div key={d.id} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-gray-800">{d.decisionTitle}</span>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: LC.dec.border, color: LC.dec.bg }}>{d.decisionType}</Badge>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: d.status === "Implemented" ? "#dcfce7" : d.status === "Approved" ? "#dbeafe" : d.status === "Reviewed" ? "#ede9fe" : "#f3f4f6", color: d.status === "Implemented" ? "#16a34a" : d.status === "Approved" ? "#1d4ed8" : d.status === "Reviewed" ? "#7c3aed" : "#6b7280" }}>{d.status}</span>
                  </div>
                  {d.rationale && <div className="text-xs text-gray-500 mb-2">{d.rationale}</div>}
                  <div className="flex items-center gap-3 flex-wrap text-xs">
                    <span style={{ color: impactColor(d.environmentalImpact ?? "Neutral") }}>Env: {d.environmentalImpact}</span>
                    <span style={{ color: impactColor(d.socialImpact ?? "Neutral") }}>Social: {d.socialImpact}</span>
                    <span style={{ color: impactColor(d.economicImpact ?? "Neutral") }}>Economic: {d.economicImpact}</span>
                    {d.owner && <span className="text-gray-400">Owner: {d.owner}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {d.status !== "Reviewed" && <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => updateStatus.mutate({ id: d.id, status: statusFlow[statusFlow.indexOf(d.status) + 1] })}><Activity size={10} /> Advance</Button>}
                  <button onClick={() => { if (confirm("Delete this decision?")) deleteDecision.mutate({ id: d.id }); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── LCSSA Section (tabbed) ────────────────────────────────────────────────────
function LcssaSection({ ventureId }: { ventureId: string }) {
  const [tab, setTab] = useState("overview");
  const lcssaTabs = [
    { id: "overview",      label: "LCSSA Overview",      color: "#1a2332", icon: <Globe size={12} /> },
    { id: "environmental", label: "Environmental LCA",   color: LC.env.bg, icon: <Leaf size={12} /> },
    { id: "social",        label: "Social LCA",          color: LC.soc.bg, icon: <Users size={12} /> },
    { id: "lcc",           label: "Life Cycle Costing",  color: LC.lcc.bg, icon: <DollarSign size={12} /> },
    { id: "oversight",     label: "Oversight",           color: LC.gov.bg, icon: <Shield size={12} /> },
    { id: "decisions",     label: "Decision Log",        color: LC.dec.bg, icon: <CheckSquare size={12} /> },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {lcssaTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border"
            style={{ background: tab === t.id ? t.color : "white", color: tab === t.id ? "white" : "#6b7280", borderColor: tab === t.id ? t.color : "#e5e7eb" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {tab === "overview"      && <LcssaOverview ventureId={ventureId} />}
      {tab === "environmental" && <LcssaEnvironmental ventureId={ventureId} />}
      {tab === "social"        && <LcssaSocial ventureId={ventureId} />}
      {tab === "lcc"           && <LcssaLcc ventureId={ventureId} />}
      {tab === "oversight"     && <LcssaOversight ventureId={ventureId} />}
      {tab === "decisions"     && <LcssaDecisions ventureId={ventureId} />}
    </div>
  );
}
