import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { trpc } from "@/lib/trpc";
import { Heart, RefreshCw, Leaf, Users, TrendingUp, Target } from "lucide-react";

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Environmental: { color: "#16a34a", bg: "#dcfce7", border: "#86efac", icon: <Leaf size={13} /> },
  Social:        { color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", icon: <Users size={13} /> },
  Economic:      { color: "#d97706", bg: "#fef3c7", border: "#fcd34d", icon: <TrendingUp size={13} /> },
};

function IrlRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(score, 0), 10);
  const dash = (clamped / 10) * circ;
  const color = clamped >= 7 ? "#16a34a" : clamped >= 4 ? "#f59e0b" : "#ef4444";
  const label = clamped >= 8 ? "Leading" : clamped >= 6 ? "Advanced" : clamped >= 4 ? "Developing" : clamped >= 2 ? "Emerging" : "Baseline";
  const cx = size / 2;
  const cy = size / 2;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={10} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={size * 0.22} fontWeight="800" fill={color}>
          {clamped.toFixed(1)}
        </text>
        <text x={cx} y={cy + 11} textAnchor="middle" fontSize={size * 0.09} fill="#9ca3af">/ 10</text>
      </svg>
      <span
        className="text-xs font-bold px-3 py-0.5 rounded-full"
        style={{ background: clamped >= 7 ? "#dcfce7" : clamped >= 4 ? "#fef3c7" : "#fee2e2", color }}
      >
        {label}
      </span>
    </div>
  );
}

function MetricCard({ metric }: { metric: { metricName: string; category: string; targetValue: string; actualValue: string; unit: string; irlLevel: number } }) {
  const cfg = CATEGORY_CONFIG[metric.category] ?? CATEGORY_CONFIG.Environmental;
  const actual = parseFloat(metric.actualValue);
  const target = parseFloat(metric.targetValue);
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.icon} {metric.category}
            </span>
          </div>
          <div className="text-sm font-bold text-gray-800 leading-tight">{metric.metricName}</div>
        </div>
        <div className="flex-shrink-0 text-center">
          <div
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-extrabold text-sm"
            style={{ borderColor: cfg.color, color: cfg.color, background: cfg.bg }}
          >
            {metric.irlLevel}
          </div>
          <div className="text-[9px] text-gray-400 mt-0.5">IRL</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            Actual: <span className="font-semibold text-gray-700">{actual.toLocaleString()} {metric.unit}</span>
          </span>
          <span>
            Target: <span className="font-semibold text-gray-700">{target.toLocaleString()} {metric.unit}</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: pct >= 80 ? cfg.color : pct >= 40 ? "#f59e0b" : "#ef4444" }}
          />
        </div>
        <div className="text-right text-xs font-semibold" style={{ color: pct >= 80 ? cfg.color : pct >= 40 ? "#f59e0b" : "#ef4444" }}>
          {pct.toFixed(0)}% of target
        </div>
      </div>
    </div>
  );
}

export default function ImpactMetrics() {
  const { selectedVentureId, selectedVenture } = useSelectedVenture();

  const { data: metrics = [], isLoading } = trpc.sustainability.getImpactMetrics.useQuery(
    { ventureId: selectedVentureId ?? "" },
    { enabled: !!selectedVentureId }
  );

  if (!selectedVentureId) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Heart size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold">Select a venture to view Impact Metrics</p>
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

  const avgIrl = metrics.length
    ? metrics.reduce((sum, m) => sum + m.irlLevel, 0) / metrics.length
    : 0;

  const byCategory = metrics.reduce<Record<string, typeof metrics>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  const envMetrics = byCategory.Environmental ?? [];
  const socMetrics = byCategory.Social ?? [];
  const ecoMetrics = byCategory.Economic ?? [];

  const catAvg = (arr: typeof metrics) =>
    arr.length ? arr.reduce((s, m) => s + m.irlLevel, 0) / arr.length : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Heart size={18} style={{ color: "#2563eb" }} />
          <h1 className="text-xl font-bold text-gray-900">Impact Metrics (IRL)</h1>
        </div>
        <p className="text-sm text-gray-500">
          {selectedVenture?.name ?? selectedVentureId} — Impact Readiness Level
        </p>
      </div>

      {/* IRL Score + Category Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Big IRL ring */}
        <div
          className="sm:col-span-1 rounded-2xl border p-5 bg-white shadow-sm flex flex-col items-center justify-center gap-2"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg IRL Score</div>
          <IrlRing score={avgIrl} size={120} />
          <div className="text-xs text-gray-400">{metrics.length} metrics tracked</div>
        </div>

        {/* Category breakdowns */}
        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Environmental", icon: <Leaf size={16} />, metrics: envMetrics, cfg: CATEGORY_CONFIG.Environmental },
            { label: "Social",        icon: <Users size={16} />, metrics: socMetrics, cfg: CATEGORY_CONFIG.Social },
            { label: "Economic",      icon: <TrendingUp size={16} />, metrics: ecoMetrics, cfg: CATEGORY_CONFIG.Economic },
          ].map(({ label, icon, metrics: mList, cfg }) => {
            const avg = catAvg(mList);
            const completed = mList.filter(m => parseFloat(m.actualValue) >= parseFloat(m.targetValue)).length;
            return (
              <div
                key={label}
                className="rounded-2xl border p-4 bg-white shadow-sm"
                style={{ borderColor: cfg.border }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.bg, color: cfg.color }}>
                    {icon}
                  </div>
                  <span className="text-sm font-bold" style={{ color: cfg.color }}>{label}</span>
                </div>
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-2xl font-extrabold" style={{ color: cfg.color }}>{avg.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">avg IRL</div>
                  </div>
                  <div className="text-right ml-auto">
                    <div className="text-lg font-bold text-gray-700">{completed}/{mList.length}</div>
                    <div className="text-xs text-gray-400">on target</div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(avg / 10) * 100}%`, background: cfg.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <Target size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-500">No impact metrics yet for this venture</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { label: "Environmental Metrics", list: envMetrics, cfg: CATEGORY_CONFIG.Environmental },
            { label: "Social Metrics",        list: socMetrics, cfg: CATEGORY_CONFIG.Social },
            { label: "Economic Metrics",      list: ecoMetrics, cfg: CATEGORY_CONFIG.Economic },
          ]
            .filter(g => g.list.length > 0)
            .map(({ label, list, cfg }) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold" style={{ color: cfg.color }}>{label}</span>
                  <div className="h-px flex-1" style={{ background: cfg.border }} />
                  <span className="text-xs text-gray-400">{list.length} metrics</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map(m => <MetricCard key={m.id} metric={m} />)}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
