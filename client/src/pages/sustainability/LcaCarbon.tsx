import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { trpc } from "@/lib/trpc";
import { Globe, RefreshCw, Factory, Zap, Truck, Wind } from "lucide-react";

// ── helpers ───────────────────────────────────────────────────────────────────
function n(v: string | number | null | undefined) {
  return parseFloat(String(v ?? 0)) || 0;
}
function fmt(v: number) {
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

// ── Scope card ────────────────────────────────────────────────────────────────
function ScopeCard({
  label, sub, value, total, color, bg, border, icon,
}: {
  label: string; sub: string; value: number; total: number;
  color: string; bg: string; border: string; icon: React.ReactNode;
}) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm flex flex-col gap-3" style={{ borderColor: border }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg, color }}>
              {icon}
            </span>
            <span className="text-sm font-bold text-gray-800">{label}</span>
          </div>
          <div className="text-xs text-gray-400 pl-7">{sub}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold" style={{ color }}>{fmt(value)}</div>
          <div className="text-xs text-gray-400">t CO₂e</div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <div className="text-right text-xs font-semibold" style={{ color }}>
          {pct.toFixed(1)}% of total
        </div>
      </div>
    </div>
  );
}

// ── Phase bar row ─────────────────────────────────────────────────────────────
const PHASE_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b"];

function PhaseRow({
  label, value, total, color, icon,
}: {
  label: string; value: number; total: number; color: string; icon: React.ReactNode;
}) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 w-44 flex-shrink-0">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, color }}>
          {icon}
        </span>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="w-28 flex-shrink-0 text-right">
        <span className="text-sm font-bold" style={{ color }}>{fmt(value)}</span>
        <span className="text-xs text-gray-400 ml-1">t CO₂e</span>
      </div>
      <div className="w-14 text-right text-xs font-semibold text-gray-400">
        {pct.toFixed(1)}%
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function LcaCarbon() {
  const { selectedVentureId, selectedVenture } = useSelectedVenture();

  const { data, isLoading } = trpc.sustainability.getLcaCarbon.useQuery(
    { ventureId: selectedVentureId ?? "" },
    { enabled: !!selectedVentureId }
  );

  if (!selectedVentureId) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Globe size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold">Select a venture to view LCA / Carbon</p>
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

  const total    = n(data?.totalFootprint);
  const scope1   = n(data?.scope1Direct);
  const scope2   = n(data?.scope2Indirect);
  const scope3   = n(data?.scope3SupplyChain);
  const matl     = n(data?.phaseMaterials);
  const mfg      = n(data?.phaseManufacturing);
  const dist     = n(data?.phaseDistribution);
  const use      = n(data?.phaseUse);

  // Intensity colour for hero
  const intensity = total >= 10000 ? "high" : total >= 2000 ? "medium" : "low";
  const heroColor = intensity === "high" ? "#ef4444" : intensity === "medium" ? "#f59e0b" : "#16a34a";
  const heroBg    = intensity === "high" ? "#fee2e2" : intensity === "medium" ? "#fef3c7" : "#dcfce7";

  const phases = [
    { label: "Materials",      value: matl, icon: <Factory size={13} />,  color: PHASE_COLORS[0] },
    { label: "Manufacturing",  value: mfg,  icon: <Factory size={13} />,  color: PHASE_COLORS[1] },
    { label: "Distribution",   value: dist, icon: <Truck size={13} />,    color: PHASE_COLORS[2] },
    { label: "Use",            value: use,  icon: <Zap size={13} />,      color: PHASE_COLORS[3] },
  ];
  const phaseTotal = matl + mfg + dist + use;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe size={18} style={{ color: "#0ea5e9" }} />
          <h1 className="text-xl font-bold text-gray-900">LCA / Carbon</h1>
        </div>
        <p className="text-sm text-gray-500">
          {selectedVenture?.name ?? selectedVentureId} — Lifecycle Carbon Assessment
        </p>
      </div>

      {/* Hero — Total Footprint */}
      <div
        className="rounded-2xl border p-6 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${heroColor}18 0%, ${heroColor}08 100%)`, borderColor: `${heroColor}40` }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              Total Carbon Footprint
            </div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-extrabold" style={{ color: heroColor }}>{fmt(total)}</span>
              <span className="text-base font-semibold text-gray-500 mb-1">tonnes CO₂e</span>
            </div>
            <div
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: heroBg, color: heroColor }}
            >
              <Wind size={11} />
              {intensity === "high" ? "High Emissions — Reduction Plan Needed"
                : intensity === "medium" ? "Moderate Emissions — Optimisation Underway"
                : "Low Emissions — Strong Performance"}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Scope 1", val: scope1, color: "#ef4444" },
              { label: "Scope 2", val: scope2, color: "#f59e0b" },
              { label: "Scope 3", val: scope3, color: "#6366f1" },
            ].map(s => (
              <div key={s.label} className="bg-white/60 rounded-xl px-4 py-2 backdrop-blur-sm">
                <div className="text-xs text-gray-400 font-semibold">{s.label}</div>
                <div className="text-xl font-extrabold" style={{ color: s.color }}>{fmt(s.val)}</div>
                <div className="text-[10px] text-gray-400">t CO₂e</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GHG Protocol Scopes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-gray-700">GHG Protocol Scopes</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScopeCard
            label="Scope 1" sub="Direct Emissions (owned/controlled sources)"
            value={scope1} total={total}
            color="#ef4444" bg="#fee2e2" border="#fca5a5"
            icon={<Factory size={13} />}
          />
          <ScopeCard
            label="Scope 2" sub="Purchased Energy (electricity, heat, steam)"
            value={scope2} total={total}
            color="#f59e0b" bg="#fef3c7" border="#fcd34d"
            icon={<Zap size={13} />}
          />
          <ScopeCard
            label="Scope 3" sub="Upstream & Downstream Supply Chain"
            value={scope3} total={total}
            color="#6366f1" bg="#ede9fe" border="#c4b5fd"
            icon={<Truck size={13} />}
          />
        </div>
      </div>

      {/* Lifecycle Phase Breakdown */}
      <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-bold text-gray-700">Lifecycle Phase Breakdown</span>
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs text-gray-400">{fmt(phaseTotal)} t CO₂e total</span>
        </div>

        {/* Stacked colour bar */}
        <div className="flex h-5 rounded-full overflow-hidden mb-4 gap-0.5">
          {phases.map(p => {
            const w = phaseTotal > 0 ? (p.value / phaseTotal) * 100 : 25;
            return (
              <div
                key={p.label}
                title={`${p.label}: ${fmt(p.value)} t CO₂e`}
                className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                style={{ width: `${w}%`, background: p.color, minWidth: w > 0 ? "4px" : 0 }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-5">
          {phases.map(p => (
            <div key={p.label} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.color }} />
              <span className="text-gray-500">{p.label}</span>
            </div>
          ))}
        </div>

        {/* Detailed rows */}
        <div className="space-y-3">
          {phases.map(p => (
            <PhaseRow
              key={p.label}
              label={p.label}
              value={p.value}
              total={phaseTotal}
              color={p.color}
              icon={p.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
