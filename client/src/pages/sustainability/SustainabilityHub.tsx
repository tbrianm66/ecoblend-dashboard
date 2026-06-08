import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { trpc } from "@/lib/trpc";
import { Leaf, Globe, GitBranch, Award, BarChart3, RefreshCw, ChevronRight } from "lucide-react";

const IMPACT_LABELS: Record<string, string> = {
  carbon_reduction:  "Carbon Reduction",
  circular_economy:  "Circular Economy",
  social_impact:     "Social Impact",
  biodiversity:      "Biodiversity",
  water_stewardship: "Water Stewardship",
  zero_waste:        "Zero Waste",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; pct: number }> = {
  not_started: { label: "Not Started", color: "#9ca3af", bg: "#f3f4f6", pct: 0 },
  in_progress:  { label: "In Progress",  color: "#f59e0b", bg: "#fef3c7", pct: 50 },
  complete:     { label: "Complete",     color: "#16a34a", bg: "#dcfce7", pct: 100 },
};

function ScoreRing({ score }: { score: number }) {
  const size = 96;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(score, 100) / 100) * circ;
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={48} cy={48} r={r} fill="none" stroke="#f3f4f6" strokeWidth={10} />
      <circle
        cx={48} cy={48} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x={48} y={44} textAnchor="middle" fontSize={20} fontWeight="800" fill={color}>{score}</text>
      <text x={48} y={57} textAnchor="middle" fontSize={9} fill="#9ca3af">/ 100</text>
    </svg>
  );
}

function ModuleRoadmapRow({
  icon, label, href, status,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  status: string;
}) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started;
  return (
    <a
      href={href}
      className="flex items-center gap-4 rounded-xl border p-4 bg-white shadow-sm hover:shadow-md transition-all group"
      style={{ borderColor: "#e5e7eb" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${cfg.pct}%`, background: cfg.color }}
          />
        </div>
      </div>
      <ChevronRight
        size={14}
        className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
      />
    </a>
  );
}

export default function SustainabilityHub() {
  const { selectedVentureId, selectedVenture } = useSelectedVenture();

  const { data, isLoading } = trpc.sustainability.getHubData.useQuery(
    { ventureId: selectedVentureId ?? "" },
    { enabled: !!selectedVentureId }
  );

  if (!selectedVentureId) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Leaf size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold">Select a venture to view the Sustainability Hub</p>
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

  const score = data?.overallScore ?? 0;
  const impactType = data?.primaryImpactType ?? "carbon_reduction";
  const scoreColor = score >= 70 ? "#16a34a" : score >= 40 ? "#f59e0b" : "#ef4444";

  const modules = [
    {
      icon: <Globe size={16} />,
      label: "LCA / Carbon",
      href: "/sustainability/lca",
      status: data?.lcaStatus ?? "not_started",
    },
    {
      icon: <BarChart3 size={16} />,
      label: "Carbon Reduction",
      href: "/sustainability/lca",
      status: data?.carbonStatus ?? "not_started",
    },
    {
      icon: <GitBranch size={16} />,
      label: "Circularity",
      href: "/sustainability/circularity",
      status: data?.circularityStatus ?? "not_started",
    },
    {
      icon: <Award size={16} />,
      label: "B Corp & ESG",
      href: "/sustainability/bcorp",
      status: data?.esgStatus ?? "not_started",
    },
  ];

  const completedCount = modules.filter((m) => m.status === "complete").length;
  const inProgressCount = modules.filter((m) => m.status === "in_progress").length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Leaf size={18} style={{ color: "#16a34a" }} />
          <h1 className="text-xl font-bold text-gray-900">Sustainability Hub</h1>
        </div>
        <p className="text-sm text-gray-500">
          {selectedVenture?.name ?? selectedVentureId} — Module 8 Overview
        </p>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Score */}
        <div
          className="rounded-2xl border p-5 bg-white shadow-sm flex items-center gap-5"
          style={{ borderColor: "#e5e7eb" }}
        >
          <ScoreRing score={score} />
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
              Overall Score
            </div>
            <div className="text-2xl font-extrabold" style={{ color: scoreColor }}>
              {score}
              <span className="text-sm font-normal text-gray-400 ml-1">/ 100</span>
            </div>
            <div
              className="text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block"
              style={{
                background: score >= 70 ? "#dcfce7" : score >= 40 ? "#fef3c7" : "#fee2e2",
                color: scoreColor,
              }}
            >
              {score >= 70 ? "Strong" : score >= 40 ? "Developing" : "Early Stage"}
            </div>
          </div>
        </div>

        {/* Primary Impact */}
        <div
          className="rounded-2xl border p-5 bg-white shadow-sm"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Primary Impact Type
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#dcfce7" }}
            >
              <Leaf size={15} style={{ color: "#16a34a" }} />
            </div>
            <span className="text-sm font-bold text-gray-800">
              {IMPACT_LABELS[impactType] ?? impactType}
            </span>
          </div>
        </div>

        {/* Module Progress */}
        <div
          className="rounded-2xl border p-5 bg-white shadow-sm"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Module Progress
          </div>
          <div className="flex items-end gap-3">
            <div className="text-center">
              <div className="text-2xl font-extrabold" style={{ color: "#16a34a" }}>
                {completedCount}
              </div>
              <div className="text-xs text-gray-400">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold" style={{ color: "#f59e0b" }}>
                {inProgressCount}
              </div>
              <div className="text-xs text-gray-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-gray-300">
                {modules.length - completedCount - inProgressCount}
              </div>
              <div className="text-xs text-gray-400">Not Started</div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden flex">
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${(completedCount / modules.length) * 100}%`, background: "#16a34a" }}
            />
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${(inProgressCount / modules.length) * 100}%`, background: "#f59e0b" }}
            />
          </div>
        </div>
      </div>

      {/* Module Roadmap */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="text-sm font-bold text-gray-700">Module Roadmap</div>
          <div className="h-px flex-1 bg-gray-100" />
          <div className="text-xs text-gray-400">{completedCount}/{modules.length} complete</div>
        </div>
        <div className="space-y-3">
          {modules.map((m) => (
            <ModuleRoadmapRow key={m.label} {...m} />
          ))}
        </div>
      </div>

      {/* Coming soon notice for sub-modules */}
      <div
        className="rounded-xl border p-4 text-center"
        style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}
      >
        <p className="text-xs text-gray-400">
          Click any module above to open the full assessment. Impact Metrics (IRL) coming in Stage 2.
        </p>
      </div>
    </div>
  );
}
