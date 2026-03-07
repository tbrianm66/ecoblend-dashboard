// ============================================================
// ECOBLEND INVESTMENT READINESS PAGE
// Design: Precision Industrial — investor-facing view
// ============================================================

import { ventures } from "@/lib/data";
import { DollarSign, CheckCircle2, XCircle } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

const scatterData = ventures.map(v => ({
  name: v.name,
  vrl: v.vrl + v.vrlPercent / 100,
  trl: v.trl + v.trlPercent / 100,
  color: v.color,
  channel: v.channel,
  ready: v.investmentReady,
}));

const INVESTMENT_CRITERIA = [
  { label: "VRL Stage ≥ 3 (Go-to-Market)", description: "Venture has completed Kickoff and entered Go-to-Market phase" },
  { label: "TRL Level ≥ 6 (Prototype Demo)", description: "Technology has a fully functional prototype demonstrated in relevant environment" },
  { label: "B Corp Accreditation Initiated", description: "B Impact Assessment score ≥ 80 or accreditation in progress" },
  { label: "BMC & MMC Validated", description: "Both commercial and mission canvases validated with real customers" },
  { label: "ESOP Structure in Place", description: "Founder and team equity allocation documented and agreed" },
  { label: "Nominated Charity Formalised", description: "Charity partnership agreement signed and impact metrics defined" },
];

export default function InvestmentReadiness() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-3 mb-1">
          <DollarSign size={20} style={{ color: "#f59e0b" }} />
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Investment Readiness
          </h1>
        </div>
        <p className="text-sm text-gray-500">Dual-readiness scoring for external investors — VRL × TRL matrix view</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Investment ready count */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm text-center" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-3xl font-bold font-mono mb-1" style={{ color: "#22c55e" }}>
              {ventures.filter(v => v.investmentReady).length}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">Investment Ready</div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm text-center" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-3xl font-bold font-mono mb-1" style={{ color: "#f59e0b" }}>
              {ventures.filter(v => v.vrl >= 2).length}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">VRL ≥ 2 (Kickoff+)</div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm text-center" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-3xl font-bold font-mono mb-1" style={{ color: "#1d4ed8" }}>
              {ventures.filter(v => v.trl >= 3).length}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">TRL ≥ 3 (PoC+)</div>
          </div>
        </div>

        {/* VRL × TRL Scatter Plot */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-1">Dual-Readiness Matrix — VRL × TRL</h3>
          <p className="text-xs text-gray-400 mb-4">Ventures in the top-right quadrant (VRL ≥ 3, TRL ≥ 6) are approaching investment readiness</p>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                type="number" dataKey="vrl" name="VRL" domain={[0, 4.5]}
                label={{ value: "Venture Readiness Level (VRL)", position: "insideBottom", offset: -10, fontSize: 11, fill: "#9ca3af" }}
                tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fill: "#9ca3af" }}
              />
              <YAxis
                type="number" dataKey="trl" name="TRL" domain={[0, 9.5]}
                label={{ value: "Technology Readiness Level (TRL)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#9ca3af" }}
                tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fill: "#9ca3af" }}
              />
              <ReferenceLine x={3} stroke="#22c55e" strokeDasharray="6 3" label={{ value: "VRL 3 threshold", fontSize: 9, fill: "#22c55e" }} />
              <ReferenceLine y={6} stroke="#1d4ed8" strokeDasharray="6 3" label={{ value: "TRL 6 threshold", fontSize: 9, fill: "#1d4ed8" }} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border rounded-lg p-3 shadow-md text-xs" style={{ borderColor: "#e5e7eb" }}>
                      <div className="font-bold mb-1" style={{ color: d.color }}>{d.name}</div>
                      <div>VRL: {d.vrl.toFixed(1)} / 4</div>
                      <div>TRL: {d.trl.toFixed(1)} / 9</div>
                      <div>Channel: {d.channel}</div>
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

        {/* Investment Criteria */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4">Investment Readiness Criteria</h3>
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
          <p className="text-xs text-gray-400 mt-4">All criteria must be met for a venture to be marked Investment Ready. Current portfolio: 0/4 ventures ready.</p>
        </div>

        {/* Per-venture readiness table */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4">Venture Readiness Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#f3f4f6" }}>
                  <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Venture</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Channel</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">VRL</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">TRL</th>
                  <th className="text-left py-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {ventures.map(v => (
                  <tr key={v.id} className="border-b last:border-0" style={{ borderColor: "#f3f4f6" }}>
                    <td className="py-3 pr-4 font-semibold" style={{ color: v.color }}>{v.name}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{v.channel}</td>
                    <td className="py-3 pr-4 font-mono text-xs" style={{ color: "#22c55e" }}>{v.vrl}/4</td>
                    <td className="py-3 pr-4 font-mono text-xs" style={{ color: "#1d4ed8" }}>{v.trl}/9</td>
                    <td className="py-3">
                      {v.investmentReady
                        ? <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#22c55e" }}><CheckCircle2 size={14} /> Ready</span>
                        : <span className="text-xs text-gray-400">In Progress</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
