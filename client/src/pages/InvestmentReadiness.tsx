// ============================================================
// ECOBLEND INVESTMENT READINESS PAGE
// Design: Precision Industrial — investor-facing view
// Now linked to Financial Analytics: funding ask, gap, burn, runway
// ============================================================

import { useVentures } from "@/contexts/VentureContext";
import {
  DollarSign, CheckCircle2, XCircle, TrendingUp, AlertTriangle,
  Clock, Target, Zap, ChevronRight
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, BarChart, Bar, Legend
} from "recharts";
import { useLocation } from "wouter";

// ── Financial data (shared source of truth with FinancialAnalytics) ───────────
interface BrandFinancials {
  id: string;
  monthlyBurn: number;
  cashRunway: number;
  revenueActual: number;
  revenueTarget: number;
  investmentRaised: number;
  investmentTarget: number;
}

const BRAND_FINANCIALS: Record<string, BrandFinancials> = {
  "ecoblend":    { id: "ecoblend",    monthlyBurn: 18000, cashRunway: 14, revenueActual: 73000,  revenueTarget: 120000, investmentRaised: 280000, investmentTarget: 500000 },
  "bebus":       { id: "bebus",       monthlyBurn: 12000, cashRunway: 8,  revenueActual: 0,      revenueTarget: 80000,  investmentRaised: 120000, investmentTarget: 400000 },
  "tone":        { id: "tone",        monthlyBurn: 8000,  cashRunway: 5,  revenueActual: 2500,   revenueTarget: 60000,  investmentRaised: 50000,  investmentTarget: 300000 },
  "real":        { id: "real",        monthlyBurn: 9500,  cashRunway: 10, revenueActual: 14200,  revenueTarget: 75000,  investmentRaised: 95000,  investmentTarget: 350000 },
  "pipe":        { id: "pipe",        monthlyBurn: 5000,  cashRunway: 6,  revenueActual: 0,      revenueTarget: 50000,  investmentRaised: 0,      investmentTarget: 250000 },
  "ecoblend-rd": { id: "ecoblend-rd", monthlyBurn: 22000, cashRunway: 12, revenueActual: 0,      revenueTarget: 0,      investmentRaised: 350000, investmentTarget: 600000 },
};

const INVESTMENT_CRITERIA = [
  { label: "VRL Stage ≥ 3 (Go-to-Market)", description: "Venture has completed Kickoff and entered Go-to-Market phase", check: (v: { vrl: number }) => v.vrl >= 3 },
  { label: "TRL Level ≥ 6 (Prototype Demo)", description: "Technology has a fully functional prototype demonstrated in relevant environment", check: (v: { trl: number }) => v.trl >= 6 },
  { label: "B Corp Accreditation Initiated", description: "B Impact Assessment score ≥ 80 or accreditation in progress", check: () => false },
  { label: "BMC & MMC Validated", description: "Both commercial and mission canvases validated with real customers", check: (v: { vrl: number }) => v.vrl >= 3 },
  { label: "ESOP Structure in Place", description: "Founder and team equity allocation documented and agreed", check: () => false },
  { label: "Nominated Charity Formalised", description: "Charity partnership agreement signed and impact metrics defined", check: () => false },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

function RunwayBadge({ months }: { months: number }) {
  const color = months >= 12 ? "#22c55e" : months >= 6 ? "#f59e0b" : "#ef4444";
  const label = months >= 12 ? "Healthy" : months >= 6 ? "Monitor" : "Critical";
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      {label} · {months}m
    </span>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function InvestmentReadiness() {
  const { ventures: allVentures } = useVentures();
  const [, navigate] = useLocation();
  const ventures = allVentures.filter(v => !v.isInternalLab);

  const scatterData = ventures.map(v => ({
    name: v.name,
    vrl: v.vrl + v.vrlPercent / 100,
    trl: v.trl + v.trlPercent / 100,
    color: v.color,
    channel: v.channel,
    ready: v.investmentReady,
  }));

  const totalAsk = ventures.reduce((a, v) => a + (BRAND_FINANCIALS[v.id]?.investmentTarget ?? 0), 0);
  const totalRaised = ventures.reduce((a, v) => a + (BRAND_FINANCIALS[v.id]?.investmentRaised ?? 0), 0);
  const totalGap = totalAsk - totalRaised;
  const totalBurn = ventures.reduce((a, v) => a + (BRAND_FINANCIALS[v.id]?.monthlyBurn ?? 0), 0);

  const fundingBarData = ventures.map(v => {
    const f = BRAND_FINANCIALS[v.id] ?? { investmentRaised: 0, investmentTarget: 0 };
    return {
      name: v.name,
      Raised: f.investmentRaised,
      Gap: Math.max(0, f.investmentTarget - f.investmentRaised),
      color: v.color,
    };
  });

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb", background: "linear-gradient(135deg, #fffbeb 0%, #f0fdf4 100%)" }}>
        <div className="flex items-center gap-3 mb-1">
          <DollarSign size={20} style={{ color: "#f59e0b" }} />
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Investment Readiness
          </h1>
        </div>
        <p className="text-sm text-gray-500">Dual-readiness scoring linked to live financial data — VRL × TRL matrix + funding pipeline</p>
      </div>

      <div className="p-8 space-y-8">

        {/* ── Portfolio Funding Summary KPIs ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Portfolio Funding Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Funding Ask", value: fmt(totalAsk), sub: "across all brands", color: "#f59e0b", icon: Target },
              { label: "Total Raised", value: fmt(totalRaised), sub: `${Math.round((totalRaised / totalAsk) * 100)}% of target`, color: "#22c55e", icon: TrendingUp },
              { label: "Funding Gap", value: fmt(totalGap), sub: "still required", color: "#ef4444", icon: AlertTriangle },
              { label: "Combined Burn", value: fmt(totalBurn) + "/mo", sub: "across portfolio", color: "#3A97D3", icon: Zap },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-center gap-2 mb-2">
                  <k.icon size={15} style={{ color: k.color }} />
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{k.label}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: k.color, fontFamily: "'Prompt', sans-serif" }}>{k.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Per-Brand Funding Cards ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Brand Funding Pipeline</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {ventures.map(v => {
              const f = BRAND_FINANCIALS[v.id] ?? { monthlyBurn: 0, cashRunway: 0, revenueActual: 0, revenueTarget: 0, investmentRaised: 0, investmentTarget: 0 };
              const gap = Math.max(0, f.investmentTarget - f.investmentRaised);
              const raisedPct = f.investmentTarget > 0 ? Math.round((f.investmentRaised / f.investmentTarget) * 100) : 0;
              const criteriaMet = INVESTMENT_CRITERIA.filter(c => c.check(v)).length;
              return (
                <div
                  key={v.id}
                  className="bg-white rounded-xl border p-5 shadow-sm cursor-pointer hover:shadow-md transition-all"
                  style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${v.color}` }}
                  onClick={() => navigate(`/venture/${v.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-sm" style={{ color: v.color, fontFamily: "'Prompt', sans-serif" }}>{v.name}</div>
                      <div className="text-xs text-gray-400">{v.tagline}</div>
                    </div>
                    <RunwayBadge months={f.cashRunway} />
                  </div>

                  {/* Funding progress */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500 font-semibold">Funding Raised</span>
                      <span className="text-xs font-mono font-bold" style={{ color: v.color }}>{raisedPct}%</span>
                    </div>
                    <ProgressBar value={f.investmentRaised} max={f.investmentTarget} color={v.color} />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">{fmt(f.investmentRaised)} raised</span>
                      <span className="text-xs text-gray-400">Target: {fmt(f.investmentTarget)}</span>
                    </div>
                  </div>

                  {/* Key metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Gap", value: fmt(gap), color: gap > 0 ? "#ef4444" : "#22c55e" },
                      { label: "Burn/mo", value: fmt(f.monthlyBurn), color: "#6b7280" },
                      { label: "Revenue", value: fmt(f.revenueActual), color: "#3A97D3" },
                    ].map(m => (
                      <div key={m.label} className="rounded-lg p-2 text-center" style={{ background: "#f9fafb" }}>
                        <div className="text-xs font-bold" style={{ color: m.color }}>{m.value}</div>
                        <div className="text-xs text-gray-400">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Readiness criteria progress */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{criteriaMet}/{INVESTMENT_CRITERIA.length} criteria met</span>
                    <div className="flex items-center gap-1">
                      {INVESTMENT_CRITERIA.map((c, i) => (
                        <div key={i} className="w-2 h-2 rounded-full" style={{ background: c.check(v) ? v.color : "#e5e7eb" }} title={c.label} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Funding Bar Chart ── */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>Funding Raised vs. Gap — by Brand</h3>
          <p className="text-xs text-gray-400 mb-4">Stacked view of capital raised and remaining funding gap per portfolio brand</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={fundingBarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Tooltip formatter={(value: number, name: string) => [fmt(value), name]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Raised" stackId="a" radius={[0, 0, 0, 0]}>
                {fundingBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="Gap" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── VRL × TRL Scatter Plot ── */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>Dual-Readiness Matrix — VRL × TRL</h3>
          <p className="text-xs text-gray-400 mb-4">Brands in the top-right quadrant (VRL ≥ 3, TRL ≥ 6) are approaching investment readiness</p>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                type="number" dataKey="vrl" name="VRL" domain={[0, 4.5]}
                label={{ value: "Venture Readiness Level (VRL)", position: "insideBottom", offset: -10, fontSize: 11, fill: "#9ca3af" }}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <YAxis
                type="number" dataKey="trl" name="TRL" domain={[0, 9.5]}
                label={{ value: "Technology Readiness Level (TRL)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#9ca3af" }}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <ReferenceLine x={3} stroke="#22c55e" strokeDasharray="6 3" label={{ value: "VRL 3 threshold", fontSize: 9, fill: "#22c55e" }} />
              <ReferenceLine y={6} stroke="#1d4ed8" strokeDasharray="6 3" label={{ value: "TRL 6 threshold", fontSize: 9, fill: "#1d4ed8" }} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  const f = BRAND_FINANCIALS[ventures.find(v => v.name === d.name)?.id ?? ""] ?? null;
                  return (
                    <div className="bg-white border rounded-lg p-3 shadow-md text-xs" style={{ borderColor: "#e5e7eb" }}>
                      <div className="font-bold mb-1" style={{ color: d.color }}>{d.name}</div>
                      <div>VRL: {d.vrl.toFixed(1)} / 4</div>
                      <div>TRL: {d.trl.toFixed(1)} / 9</div>
                      <div>Channel: {d.channel}</div>
                      {f && <>
                        <div className="mt-1 pt-1 border-t" style={{ borderColor: "#f3f4f6" }}>
                          <div>Ask: {fmt(f.investmentTarget)}</div>
                          <div>Raised: {fmt(f.investmentRaised)}</div>
                          <div>Runway: {f.cashRunway}m</div>
                        </div>
                      </>}
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} shape={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={18} fill={payload.color} fillOpacity={0.15} stroke={payload.color} strokeWidth={2} />
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fontWeight="700" fill={payload.color}>{payload.name}</text>
                  </g>
                );
              }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* ── Investment Criteria ── */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>Investment Readiness Criteria</h3>
          <div className="space-y-3">
            {INVESTMENT_CRITERIA.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#f9fafb" }}>
                <XCircle size={18} style={{ color: "#d1d5db", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div className="text-sm font-semibold text-gray-700">{c.label}</div>
                  <div className="text-xs text-gray-400">{c.description}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">All criteria must be met for a brand to be marked Investment Ready. Current portfolio: {ventures.filter(v => v.investmentReady).length}/{ventures.length} brands ready.</p>
        </div>

        {/* ── Per-venture readiness table ── */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>Brand Readiness & Funding Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#f3f4f6" }}>
                  {["Brand", "Channel", "VRL", "TRL", "Funding Ask", "Raised", "Gap", "Runway", "Status"].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ventures.map(v => {
                  const f = BRAND_FINANCIALS[v.id] ?? { investmentTarget: 0, investmentRaised: 0, cashRunway: 0 };
                  const gap = Math.max(0, f.investmentTarget - f.investmentRaised);
                  return (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" style={{ borderColor: "#f3f4f6" }}
                      onClick={() => navigate(`/venture/${v.id}`)}>
                      <td className="py-3 pr-4 font-bold" style={{ color: v.color }}>{v.name}</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{v.channel}</td>
                      <td className="py-3 pr-4 font-mono text-xs" style={{ color: "#22c55e" }}>{v.vrl}/4</td>
                      <td className="py-3 pr-4 font-mono text-xs" style={{ color: "#1d4ed8" }}>{v.trl}/9</td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-700">{fmt(f.investmentTarget)}</td>
                      <td className="py-3 pr-4 font-mono text-xs" style={{ color: "#22c55e" }}>{fmt(f.investmentRaised)}</td>
                      <td className="py-3 pr-4 font-mono text-xs" style={{ color: gap > 0 ? "#ef4444" : "#22c55e" }}>{fmt(gap)}</td>
                      <td className="py-3 pr-4"><RunwayBadge months={f.cashRunway} /></td>
                      <td className="py-3">
                        {v.investmentReady
                          ? <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#22c55e" }}><CheckCircle2 size={14} /> Ready</span>
                          : <span className="text-xs text-gray-400">In Progress</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
