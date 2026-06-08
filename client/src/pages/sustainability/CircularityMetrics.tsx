import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { trpc } from "@/lib/trpc";
import { GitBranch, RefreshCw, Droplets, Package, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

function n(v: string | number | null | undefined) {
  return parseFloat(String(v ?? 0)) || 0;
}

// ── MCI ring ──────────────────────────────────────────────────────────────────
function MciRing({ score }: { score: number }) {
  const size = 140;
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(score, 100) / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Developing" : "Early Stage";
  const cx = size / 2, cy = size / 2;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={12} />
        {/* fill */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={12}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.7s ease" }} />
        <text x={cx} y={cy - 8}  textAnchor="middle" fontSize={28} fontWeight="800" fill={color}>{Math.round(score)}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={11} fill="#9ca3af">MCI Score</text>
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize={9}  fill="#d1d5db">/ 100</text>
      </svg>
      <span className="text-xs font-bold px-3 py-1 rounded-full"
        style={{ background: score >= 70 ? "#d1fae5" : score >= 40 ? "#fef3c7" : "#fee2e2", color }}>
        {label}
      </span>
    </div>
  );
}

// ── Flow bar row ──────────────────────────────────────────────────────────────
function FlowBar({ label, value, color, bg, sublabel }: {
  label: string; value: number; color: string; bg: string; sublabel?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          {sublabel && <span className="text-xs text-gray-400 ml-1.5">{sublabel}</span>}
        </div>
        <span className="text-sm font-extrabold" style={{ color }}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ label, value, color, bg, icon }: {
  label: string; value: string | number; color: string; bg: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3 bg-white" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: bg, color }}>{icon}</span>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-extrabold" style={{ color }}>{value}</span>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function CircularityMetrics() {
  const { selectedVentureId, selectedVenture } = useSelectedVenture();

  const { data, isLoading } = trpc.sustainability.getCircularityData.useQuery(
    { ventureId: selectedVentureId ?? "" },
    { enabled: !!selectedVentureId }
  );

  if (!selectedVentureId) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <GitBranch size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold">Select a venture to view Circularity</p>
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

  const mci       = n(data?.globalMciScore);
  const circular  = n(data?.circularInflowPct);
  const virgin    = n(data?.virginInflowPct);
  const diversion = n(data?.landfillDiversionPct);
  const recovery  = n(data?.recoveryPotentialPct);
  const water     = n(data?.waterRecycledPct);

  const mciColor  = mci >= 70 ? "#10b981" : mci >= 40 ? "#f59e0b" : "#ef4444";
  const mciHeroBg = mci >= 70 ? "#d1fae5" : mci >= 40 ? "#fef3c7" : "#fee2e2";

  // Derive supply chain loop status from circularity/diversion
  const loopScore = (circular + diversion) / 2;
  const loopStatus = loopScore >= 70 ? "Closed Loop" : loopScore >= 40 ? "Partial Loop" : "Open Loop";
  const loopColor  = loopScore >= 70 ? "#10b981" : loopScore >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GitBranch size={18} style={{ color: "#10b981" }} />
          <h1 className="text-xl font-bold text-gray-900">Circularity</h1>
        </div>
        <p className="text-sm text-gray-500">
          {selectedVenture?.name ?? selectedVentureId} — Material Circularity Indicator
        </p>
      </div>

      {/* Hero — MCI */}
      <div className="rounded-2xl border p-6 flex flex-col sm:flex-row items-center gap-8"
        style={{ background: `linear-gradient(135deg, ${mciColor}12 0%, ${mciColor}05 100%)`, borderColor: `${mciColor}35` }}>
        <MciRing score={mci} />
        <div className="flex-1 space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
              Global Material Circularity Indicator
            </div>
            <div className="text-4xl font-extrabold" style={{ color: mciColor }}>{mci.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">
              Ellen MacArthur Foundation MCI methodology — 0% fully linear → 100% fully circular
            </div>
          </div>
          {/* mini progress strip */}
          <div className="flex gap-2">
            {[
              { label: "Circular Inflow",   val: circular,  color: "#10b981" },
              { label: "Landfill Diverted", val: diversion, color: "#6366f1" },
              { label: "Recovery",          val: recovery,  color: "#0ea5e9" },
            ].map(s => (
              <div key={s.label} className="flex-1 text-center rounded-xl p-2"
                style={{ background: `${s.color}12` }}>
                <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.val.toFixed(0)}%</div>
                <div className="text-[10px] text-gray-400 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Material Flows — side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Inflows */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#d1fae5", color: "#10b981" }}>
              <ArrowDownToLine size={14} />
            </span>
            <span className="text-sm font-bold text-gray-800">Material Inflows</span>
          </div>
          <div className="space-y-4">
            <FlowBar
              label="Recycled / Bio-based Input"
              sublabel="circular"
              value={circular}
              color="#10b981"
              bg="#d1fae5"
            />
            <FlowBar
              label="Virgin Material Input"
              sublabel="linear"
              value={virgin}
              color="#ef4444"
              bg="#fee2e2"
            />
            {/* inflow donut summary text */}
            <div className="pt-1 flex gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#10b981" }} />
                <span className="text-gray-500">Circular: <strong>{circular.toFixed(1)}%</strong></span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#ef4444" }} />
                <span className="text-gray-500">Virgin: <strong>{virgin.toFixed(1)}%</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Outflows */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#ede9fe", color: "#6366f1" }}>
              <ArrowUpFromLine size={14} />
            </span>
            <span className="text-sm font-bold text-gray-800">Material Outflows</span>
          </div>
          <div className="space-y-4">
            <FlowBar
              label="Landfill Diverted"
              sublabel="waste avoided"
              value={diversion}
              color="#6366f1"
              bg="#ede9fe"
            />
            <FlowBar
              label="Recovery Potential"
              sublabel="recyclable / reusable"
              value={recovery}
              color="#0ea5e9"
              bg="#e0f2fe"
            />
            <div className="pt-1 flex gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#6366f1" }} />
                <span className="text-gray-500">Diverted: <strong>{diversion.toFixed(1)}%</strong></span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#0ea5e9" }} />
                <span className="text-gray-500">Recoverable: <strong>{recovery.toFixed(1)}%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Loops */}
      <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-bold text-gray-700">Operational Loop Status</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatusPill
            label="Water Circularity"
            value={`${water.toFixed(1)}% recycled`}
            color={water >= 60 ? "#10b981" : water >= 30 ? "#f59e0b" : "#ef4444"}
            bg={water >= 60 ? "#d1fae5" : water >= 30 ? "#fef3c7" : "#fee2e2"}
            icon={<Droplets size={14} />}
          />
          <StatusPill
            label="Supply Chain Loop"
            value={loopStatus}
            color={loopColor}
            bg={loopScore >= 70 ? "#d1fae5" : loopScore >= 40 ? "#fef3c7" : "#fee2e2"}
            icon={<Package size={14} />}
          />
          <StatusPill
            label="MCI Threshold (≥ 50%)"
            value={mci >= 50 ? "✓ Met" : "✗ Below"}
            color={mci >= 50 ? "#10b981" : "#ef4444"}
            bg={mci >= 50 ? "#d1fae5" : "#fee2e2"}
            icon={<GitBranch size={14} />}
          />
          <StatusPill
            label="Linear Risk"
            value={virgin >= 60 ? "High" : virgin >= 30 ? "Moderate" : "Low"}
            color={virgin >= 60 ? "#ef4444" : virgin >= 30 ? "#f59e0b" : "#10b981"}
            bg={virgin >= 60 ? "#fee2e2" : virgin >= 30 ? "#fef3c7" : "#d1fae5"}
            icon={<ArrowUpFromLine size={14} />}
          />
        </div>
      </div>
    </div>
  );
}
