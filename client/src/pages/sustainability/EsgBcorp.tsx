import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { trpc } from "@/lib/trpc";
import { Award, RefreshCw, Leaf, Users, Shield, Star, Heart, CheckCircle2, Circle } from "lucide-react";

function n(v: string | number | null | undefined) {
  return parseFloat(String(v ?? 0)) || 0;
}

const B_CERT_THRESHOLD = 80;
const B_MAX = 200;

// ── B score arc ───────────────────────────────────────────────────────────────
function BScoreArc({ score }: { score: number }) {
  const size = 160;
  const r = 62;
  const circ = 2 * Math.PI * r;
  // arc covers 270° (from 135° to 405°), so scale score/200 over 270°
  const arcFraction = Math.min(score / B_MAX, 1);
  const dash = arcFraction * (circ * 0.75);
  const gap = circ - dash;
  const certified = score >= B_CERT_THRESHOLD;
  const color = score >= B_CERT_THRESHOLD ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const cx = size / 2, cy = size / 2;
  // threshold marker at score=80 → 80/200 * 270° = 108° from start (135°) → 243°
  const thresholdAngleDeg = 135 + (B_CERT_THRESHOLD / B_MAX) * 270;
  const thresholdRad = (thresholdAngleDeg * Math.PI) / 180;
  const mx = cx + r * Math.cos(thresholdRad);
  const my = cy + r * Math.sin(thresholdRad);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* track arc — 270° from 135° */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={14}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={circ * 0.25}
          transform={`rotate(135 ${cx} ${cy})`} />
        {/* filled arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={circ * 0.25}
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.7s ease" }} />
        {/* threshold marker */}
        <circle cx={mx} cy={my} r={5} fill="white" stroke="#6366f1" strokeWidth={2} />
        {/* score text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={30} fontWeight="800" fill={color}>
          {score.toFixed(1)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#9ca3af">/ {B_MAX} pts</text>
      </svg>
      <span className="text-xs font-bold px-3 py-1 rounded-full"
        style={{
          background: certified ? "#d1fae5" : score >= 60 ? "#fef3c7" : "#fee2e2",
          color,
        }}>
        {certified ? "✓ B Corp Ready" : score >= 60 ? "Close — Keep Going" : "Early Stage"}
      </span>
    </div>
  );
}

// ── Pillar bar ────────────────────────────────────────────────────────────────
const PILLAR_MAX: Record<string, number> = {
  Governance: 30, Workers: 40, Community: 40, Environment: 50, Customers: 40,
};

function PillarBar({ label, value, color, bg, icon, maxScore }: {
  label: string; value: number; color: string; bg: string; icon: React.ReactNode; maxScore: number;
}) {
  const pct = Math.min((value / maxScore) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: bg, color }}>{icon}</span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-extrabold" style={{ color }}>{value.toFixed(1)}</span>
          <span className="text-xs text-gray-400 ml-0.5">/ {maxScore}</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── ESG pillar card ───────────────────────────────────────────────────────────
function EsgPillarCard({ label, pct, color, bg, border, icon }: {
  label: string; pct: number; color: string; bg: string; border: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border p-4 bg-white shadow-sm flex flex-col gap-3" style={{ borderColor: border }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg, color }}>{icon}</span>
          <span className="text-sm font-bold" style={{ color }}>{label}</span>
        </div>
        <span className="text-xl font-extrabold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: `${color}18` }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-xs text-gray-400">
        {pct >= 70 ? "Strong — above sector average" : pct >= 40 ? "Developing — improvement actions in progress" : "Early Stage — baseline data collection needed"}
      </div>
    </div>
  );
}

// ── Policy checklist ──────────────────────────────────────────────────────────
const POLICIES = [
  "Code of Ethics",
  "Whistleblower Policy",
  "Supplier Code of Conduct",
  "Environmental Policy Statement",
  "Anti-Bribery & Corruption Policy",
  "Living Wage Commitment",
  "Diversity & Inclusion Policy",
  "Data Privacy (GDPR) Policy",
];

function PolicyChecklist({ score }: { score: number }) {
  // Derive how many policies are "in place" from the B score fraction
  const count = Math.round((score / B_MAX) * POLICIES.length);
  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-bold text-gray-700">Foundational Policies Checklist</span>
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-xs text-gray-400">{count}/{POLICIES.length} in place</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {POLICIES.map((p, i) => {
          const done = i < count;
          return (
            <div key={p} className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: done ? "#f0fdf4" : "#fafafa", border: `1px solid ${done ? "#bbf7d0" : "#f3f4f6"}` }}>
              {done
                ? <CheckCircle2 size={15} style={{ color: "#10b981", flexShrink: 0 }} />
                : <Circle size={15} style={{ color: "#d1d5db", flexShrink: 0 }} />}
              <span className="text-xs font-semibold" style={{ color: done ? "#065f46" : "#9ca3af" }}>{p}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function EsgBcorp() {
  const { selectedVentureId, selectedVenture } = useSelectedVenture();

  const { data, isLoading } = trpc.sustainability.getEsgBcorpData.useQuery(
    { ventureId: selectedVentureId ?? "" },
    { enabled: !!selectedVentureId }
  );

  if (!selectedVentureId) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Award size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold">Select a venture to view B Corp & ESG</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const total   = n(data?.totalBScore);
  const gov     = n(data?.bGovernance);
  const workers = n(data?.bWorkers);
  const comm    = n(data?.bCommunity);
  const env     = n(data?.bEnvironment);
  const cust    = n(data?.bCustomers);
  const esgE    = data?.esgEnvironmentalPct ?? 0;
  const esgS    = data?.esgSocialPct ?? 0;
  const esgG    = data?.esgGovernancePct ?? 0;

  const certified = total >= B_CERT_THRESHOLD;
  const heroColor = certified ? "#10b981" : total >= 60 ? "#f59e0b" : "#ef4444";
  const gap = B_CERT_THRESHOLD - total;

  const pillars = [
    { label: "Governance",   value: gov,     color: "#6366f1", bg: "#ede9fe", icon: <Shield size={12} />,  maxScore: PILLAR_MAX.Governance },
    { label: "Workers",      value: workers, color: "#0ea5e9", bg: "#e0f2fe", icon: <Users size={12} />,   maxScore: PILLAR_MAX.Workers },
    { label: "Community",    value: comm,    color: "#f59e0b", bg: "#fef3c7", icon: <Heart size={12} />,   maxScore: PILLAR_MAX.Community },
    { label: "Environment",  value: env,     color: "#10b981", bg: "#d1fae5", icon: <Leaf size={12} />,    maxScore: PILLAR_MAX.Environment },
    { label: "Customers",    value: cust,    color: "#ec4899", bg: "#fce7f3", icon: <Star size={12} />,    maxScore: PILLAR_MAX.Customers },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Award size={18} style={{ color: "#6366f1" }} />
          <h1 className="text-xl font-bold text-gray-900">B Corp & ESG</h1>
        </div>
        <p className="text-sm text-gray-500">
          {selectedVenture?.name ?? selectedVentureId} — B Corp Readiness & ESG Performance
        </p>
      </div>

      {/* Hero — B Corp Readiness */}
      <div className="rounded-2xl border p-6 flex flex-col sm:flex-row items-center gap-8"
        style={{ background: `linear-gradient(135deg, ${heroColor}12 0%, ${heroColor}05 100%)`, borderColor: `${heroColor}35` }}>
        <BScoreArc score={total} />
        <div className="flex-1 space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">B Corp Readiness Score</div>
            <div className="text-4xl font-extrabold" style={{ color: heroColor }}>{total.toFixed(1)} <span className="text-base font-semibold text-gray-400">/ {B_MAX} pts</span></div>
            {certified ? (
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={12} /> Above 80pt threshold — eligible to apply for B Corp certification
              </div>
            ) : (
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: `${heroColor}18`, color: heroColor }}>
                {gap.toFixed(1)} pts needed to reach the 80pt B Corp certification baseline
              </div>
            )}
          </div>
          {/* Threshold bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>0</span>
              <span className="font-semibold text-indigo-500">80pt threshold</span>
              <span>200</span>
            </div>
            <div className="relative h-3 rounded-full bg-gray-100 overflow-visible">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(total / B_MAX) * 100}%`, background: heroColor }} />
              {/* threshold marker */}
              <div className="absolute top-0 h-full" style={{ left: `${(B_CERT_THRESHOLD / B_MAX) * 100}%` }}>
                <div className="w-0.5 h-full bg-indigo-400" />
                <div className="absolute -top-4 left-0.5 text-[9px] font-bold text-indigo-500 whitespace-nowrap">80pt</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* B Corp Pillars + ESG side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 5 B Corp pillars */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-bold text-gray-700">B Corp Assessment Pillars</span>
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400">{total.toFixed(1)} pts total</span>
          </div>
          <div className="space-y-4">
            {pillars.map(p => <PillarBar key={p.label} {...p} />)}
          </div>
        </div>

        {/* 3 ESG pillars */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700">ESG Pillar Progress</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <EsgPillarCard label="Environmental" pct={esgE} color="#10b981" bg="#d1fae5" border="#86efac" icon={<Leaf size={14} />} />
          <EsgPillarCard label="Social"        pct={esgS} color="#2563eb" bg="#dbeafe" border="#93c5fd" icon={<Users size={14} />} />
          <EsgPillarCard label="Governance"    pct={esgG} color="#6366f1" bg="#ede9fe" border="#c4b5fd" icon={<Shield size={14} />} />
        </div>
      </div>

      {/* Foundational Policies Checklist */}
      <PolicyChecklist score={total} />
    </div>
  );
}
