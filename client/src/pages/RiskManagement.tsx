// ============================================================
// ECOBLEND RISK MANAGEMENT PAGE
// Design: Precision Industrial — full portfolio risk view
// ============================================================

import { ventures } from "@/lib/data";
import { ShieldAlert, AlertTriangle, CheckCircle2, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

const RISK_DOMAINS = ["Business", "Technical", "Financial", "Marketing", "Investment", "People", "IP"];
const riskColors = { Low: "#22c55e", Medium: "#f59e0b", High: "#dc2626" };

// Build risk heatmap data
const heatmapData = RISK_DOMAINS.map(domain => {
  const obj: Record<string, string | number> = { domain };
  ventures.forEach(v => {
    const risk = v.risks.find(r => r.domain === domain);
    obj[v.name] = risk ? (risk.level === "High" ? 3 : risk.level === "Medium" ? 2 : 1) : 0;
    obj[`${v.name}_level`] = risk?.level || "None";
  });
  return obj;
});

const riskSummary = ventures.map(v => ({
  name: v.name,
  high: v.risks.filter(r => r.level === "High").length,
  medium: v.risks.filter(r => r.level === "Medium").length,
  low: v.risks.filter(r => r.level === "Low").length,
  color: v.color,
}));

function RiskBadge({ level }: { level: string }) {
  if (!level || level === "None") return <span className="text-xs text-gray-300">—</span>;
  const color = riskColors[level as keyof typeof riskColors] || "#6b7280";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color}15`, color }}>
      {level === "High" && <AlertTriangle size={10} />}
      {level === "Low" && <CheckCircle2 size={10} />}
      {level === "Medium" && <Minus size={10} />}
      {level}
    </span>
  );
}

export default function RiskManagement() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-3 mb-1">
          <ShieldAlert size={20} style={{ color: "#dc2626" }} />
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Risk Management
          </h1>
        </div>
        <p className="text-sm text-gray-500">Portfolio-wide risk tracking across Business, Technical, Financial, Marketing, Investment, People, and IP domains</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Risk summary KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm text-center" style={{ borderColor: "#e5e7eb", borderTop: "3px solid #dc2626" }}>
            <div className="text-3xl font-bold font-mono mb-1" style={{ color: "#dc2626" }}>
              {ventures.reduce((acc, v) => acc + v.risks.filter(r => r.level === "High").length, 0)}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">High Risk Items</div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm text-center" style={{ borderColor: "#e5e7eb", borderTop: "3px solid #f59e0b" }}>
            <div className="text-3xl font-bold font-mono mb-1" style={{ color: "#f59e0b" }}>
              {ventures.reduce((acc, v) => acc + v.risks.filter(r => r.level === "Medium").length, 0)}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">Medium Risk Items</div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm text-center" style={{ borderColor: "#e5e7eb", borderTop: "3px solid #22c55e" }}>
            <div className="text-3xl font-bold font-mono mb-1" style={{ color: "#22c55e" }}>
              {ventures.reduce((acc, v) => acc + v.risks.filter(r => r.level === "Low").length, 0)}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">Low Risk Items</div>
          </div>
        </div>

        {/* Risk distribution chart */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4">Risk Distribution by Venture</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={riskSummary} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12 }} />
              <Bar dataKey="high" name="High" stackId="a" fill="#dc2626" radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium" name="Medium" stackId="a" fill="#f59e0b" />
              <Bar dataKey="low" name="Low" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Heatmap Table */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4">Portfolio Risk Heatmap</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#f3f4f6" }}>
                  <th className="text-left py-2 pr-6 text-xs font-semibold uppercase tracking-widest text-gray-400">Risk Domain</th>
                  {ventures.map(v => (
                    <th key={v.id} className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest" style={{ color: v.color }}>
                      {v.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RISK_DOMAINS.map(domain => (
                  <tr key={domain} className="border-b last:border-0" style={{ borderColor: "#f3f4f6" }}>
                    <td className="py-3 pr-6 font-medium text-gray-700">{domain}</td>
                    {ventures.map(v => {
                      const risk = v.risks.find(r => r.domain === domain);
                      return (
                        <td key={v.id} className="py-3 pr-4">
                          <RiskBadge level={risk?.level || "None"} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Full risk register */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4">Full Risk Register</h3>
          <div className="space-y-6">
            {ventures.map(v => (
              <div key={v.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-bold text-sm" style={{ color: v.color }}>{v.name}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">{v.channel} · {v.sector}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "#f3f4f6" }}>
                        <th className="text-left py-1.5 pr-4 text-xs font-semibold text-gray-400">Domain</th>
                        <th className="text-left py-1.5 pr-4 text-xs font-semibold text-gray-400">Level</th>
                        <th className="text-left py-1.5 text-xs font-semibold text-gray-400">Mitigation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {v.risks.map((risk, i) => (
                        <tr key={i} className="border-b last:border-0" style={{ borderColor: "#f9fafb" }}>
                          <td className="py-2 pr-4 text-gray-700 text-xs font-medium">{risk.domain}</td>
                          <td className="py-2 pr-4"><RiskBadge level={risk.level} /></td>
                          <td className="py-2 text-gray-500 text-xs">{risk.mitigation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
