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
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp size={20} style={{ color: "#22c55e" }} />
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Venture Readiness Level Analytics
          </h1>
        </div>
        <p className="text-sm text-gray-500">Commercial progress tracking across all VBS portfolio ventures — 4 stages, 100 tasks</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Stage summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {VRL_STAGES.map(stage => {
            const count = ventures.filter(v => v.vrl === stage.id).length;
            return (
              <div key={stage.id} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb", borderTop: "3px solid #22c55e" }}>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">VRL {stage.id}</div>
                <div className="text-2xl font-bold font-mono" style={{ color: "#22c55e" }}>{count}</div>
                <div className="text-sm font-medium text-gray-700">{stage.label}</div>
                <div className="text-xs text-gray-400 mt-1">{stage.tasks}</div>
              </div>
            );
          })}
        </div>

        {/* VRL Progress Bar Chart */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
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
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4">VRL Stage Completion Radar</h3>
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
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4">VRL Stage Definitions</h3>
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
