// ============================================================
// ECOBLEND VRL ANALYTICS PAGE
// Design: Precision Industrial — comparative VRL charts
// ============================================================

import { ventures, VRL_STAGES } from "@/lib/data";
import { TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend
} from "recharts";

const vrlData = ventures.map(v => ({
  name: v.name,
  stage: v.vrl,
  progress: Math.round(((v.vrl - 1) / 4 + v.vrlPercent / 400) * 100),
  color: v.color,
}));

const stageDistribution = VRL_STAGES.map(stage => ({
  stage: stage.label,
  count: ventures.filter(v => v.vrl === stage.id).length,
}));

const radarData = VRL_STAGES.map(stage => {
  const obj: Record<string, string | number> = { stage: stage.label };
  ventures.forEach(v => {
    obj[v.name] = v.vrl >= stage.id ? (v.vrl === stage.id ? v.vrlPercent : 100) : 0;
  });
  return obj;
});

export default function VrlAnalytics() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} style={{ color: "#51AF37" }} />
          <span className="vos-badge vos-badge-success" style={{ fontSize: "0.65rem" }}>VRL Analytics</span>
        </div>
        <h1 className="vos-page-title mb-1">Venture Readiness Level</h1>
        <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>Commercial progress tracking across all VBS portfolio ventures — 4 stages, 100 tasks</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Stage summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {VRL_STAGES.map(stage => {
            const count = ventures.filter(v => v.vrl === stage.id).length;
            return (
              <div key={stage.id} className="vos-metric" style={{ borderTop: "3px solid #51AF37" }}>
                <span className="vos-metric-label">VRL {stage.id}</span>
                <span className="vos-metric-value" style={{ color: "#51AF37" }}>{count}</span>
                <span className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>{stage.label}</span>
                <span className="vos-metric-sub">{stage.tasks}</span>
              </div>
            );
          })}
        </div>

        {/* VRL Progress Bar Chart */}
        <div className="vos-panel p-6">
          <h3 className="font-bold text-gray-900 mb-4">Overall VRL Progress by Venture</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vrlData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", fill: "#6b7280" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fill: "#9ca3af" }} tickFormatter={v => `${v}%`} />
              <Tooltip
                formatter={(val: number) => [`${val}%`, "VRL Progress"]}
                contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                {vrlData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* VRL Radar Chart */}
        <div className="vos-panel p-6">
          <h3 className="vos-section-title mb-4">VRL Completion Radar</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f3f4f6" />
              <PolarAngleAxis dataKey="stage" tick={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fill: "#6b7280" }} />
              {ventures.map(v => (
                <Radar key={v.id} name={v.name} dataKey={v.name} stroke={v.color} fill={v.color} fillOpacity={0.1} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12 }} />
              <Tooltip contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* VRL Stage Detail Table */}
        <div className="vos-panel p-6">
          <h3 className="vos-section-title mb-4">Stage Distribution</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#f3f4f6" }}>
                  <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Stage</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Label</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Tasks</th>
                  <th className="text-left py-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Description</th>
                </tr>
              </thead>
              <tbody>
                {VRL_STAGES.map(stage => (
                  <tr key={stage.id} className="border-b last:border-0" style={{ borderColor: "#f3f4f6" }}>
                    <td className="py-3 pr-4">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#22c55e20", color: "#22c55e" }}>
                        {stage.id}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-700">{stage.label}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-400">{stage.tasks}</td>
                    <td className="py-3 text-gray-500 text-xs">{stage.description}</td>
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
