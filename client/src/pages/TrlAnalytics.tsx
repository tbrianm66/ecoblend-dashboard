// ============================================================
// ECOBLEND TRL ANALYTICS PAGE
// Design: Precision Industrial — comparative TRL charts
// ============================================================

import { ventures, TRL_LEVELS } from "@/lib/data";
import { FlaskConical } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend
} from "recharts";

const trlData = ventures.map(v => ({
  name: v.name,
  level: v.trl,
  progress: Math.round(((v.trl - 1) / 9 + v.trlPercent / 900) * 100),
  color: v.color,
}));

const trlProgressionData = TRL_LEVELS.map(level => {
  const obj: Record<string, string | number> = { level: `TRL ${level.id}`, label: level.label };
  ventures.forEach(v => {
    obj[v.name] = v.trl >= level.id ? 100 : v.trl === level.id - 1 ? v.trlPercent : 0;
  });
  return obj;
});

// Valley of death highlight data
const valleyData = TRL_LEVELS.map(l => ({
  level: `TRL ${l.id}`,
  funding: l.id <= 3 ? 80 : l.id <= 7 ? 20 : 90,
  risk: l.id <= 3 ? 30 : l.id <= 7 ? 90 : 20,
}));

export default function TrlAnalytics() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-3 mb-1">
          <FlaskConical size={20} style={{ color: "#1d4ed8" }} />
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Technology Readiness Level Analytics
          </h1>
        </div>
        <p className="text-sm text-gray-500">Technical maturity tracking across all EcoBlend R&D ventures — NASA/EU Horizon 9-level framework</p>
      </div>

      <div className="p-8 space-y-8">
        {/* TRL level cards */}
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
          {TRL_LEVELS.map(level => {
            const active = ventures.filter(v => v.trl === level.id).length;
            const isValley = level.id >= 4 && level.id <= 7;
            return (
              <div
                key={level.id}
                className="rounded-lg border p-2 text-center"
                style={{
                  borderColor: isValley ? "#fbbf24" : "#e5e7eb",
                  background: isValley ? "#fffbeb" : "white",
                }}
              >
                <div className="text-lg font-bold font-mono" style={{ color: "#1d4ed8" }}>{level.id}</div>
                <div className="text-xs text-gray-500 leading-tight mt-0.5">{level.label.split(" ")[0]}</div>
                {active > 0 && (
                  <div className="mt-1 w-5 h-5 rounded-full mx-auto flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1d4ed8" }}>
                    {active}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-amber-600 font-medium">⚠ TRL 4–7 represents the "Valley of Death" — where EcoBlend R&D provides critical bridge support</p>

        {/* TRL Progress Chart */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4">Overall TRL Progress by Venture</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trlData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", fill: "#6b7280" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fill: "#9ca3af" }} tickFormatter={v => `${v}%`} />
              <Tooltip
                formatter={(val: number) => [`${val}%`, "TRL Progress"]}
                contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                {trlData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Valley of Death Chart */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-1">The "Valley of Death" — Funding vs. Risk Profile</h3>
          <p className="text-xs text-gray-400 mb-4">EcoBlend R&D bridges the critical TRL 4–7 gap where traditional funding dries up and execution risk peaks</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={valleyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="level" tick={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fill: "#9ca3af" }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12 }} />
              <Line type="monotone" dataKey="funding" name="Funding Availability" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="risk" name="Execution Risk" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* TRL Level Definitions */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4">TRL Level Definitions (NASA/EU Horizon Standard)</h3>
          <div className="space-y-2">
            {TRL_LEVELS.map(level => {
              const isValley = level.id >= 4 && level.id <= 7;
              return (
                <div
                  key={level.id}
                  className="flex items-start gap-4 p-3 rounded-lg"
                  style={{ background: isValley ? "#eff6ff" : "#f9fafb" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "#1d4ed8", color: "white" }}
                  >
                    {level.id}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      {level.label}
                      {isValley && <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: "#fbbf2420", color: "#d97706" }}>Valley Zone</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{level.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
