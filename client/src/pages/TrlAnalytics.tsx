// ============================================================
// ECOBLEND TRL ANALYTICS PAGE
// Design: Precision Industrial — comparative TRL charts
// ============================================================

import { ventures, TRL_LEVELS } from "@/lib/data";
import { trpc } from "@/lib/trpc";
import { FlaskConical, AlertTriangle, ShieldAlert, ShieldCheck, GraduationCap, CheckCircle2 } from "lucide-react";
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

// Per-venture Scientific Validation summary widget
function ScientificValidationSummary() {
  const validationQueries = ventures.map(v => ({
    id: v.id,
    name: v.name,
    color: v.color,
    query: trpc.academicValidation.getValidatedTasks.useQuery({ ventureId: v.id }),
  }));

  const totalValidated = validationQueries.reduce((sum, q) => sum + (q.query.data?.validatedTaskIds?.length ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
        <GraduationCap size={20} className="text-green-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-green-700">Semantic Scholar Validation Active</p>
          <p className="text-xs text-green-600 mt-0.5">
            {totalValidated} engineering task{totalValidated !== 1 ? 's' : ''} across the portfolio have peer-reviewed academic validation (≥1 paper with &gt;10 citations).
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {validationQueries.map(({ id, name, color, query }) => {
          const count = query.data?.validatedTaskIds?.length ?? 0;
          return (
            <div key={id} className="flex items-center gap-2 p-3 bg-white rounded-xl border shadow-sm" style={{ borderColor: count > 0 ? "#bbf7d0" : "#e5e7eb" }}>
              <CheckCircle2 size={14} style={{ color: count > 0 ? "#16a34a" : "#d1d5db" }} className="shrink-0" />
              <div>
                <div className="text-xs font-semibold" style={{ color }}>{name}</div>
                <div className="text-xs text-gray-400">{count} validated task{count !== 1 ? 's' : ''}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Per-venture TRL blocker widget
function TrlBlockerPanel() {
  const blockerQueries = ventures.map(v => ({
    id: v.id,
    name: v.name,
    color: v.color,
    query: trpc.fmea.trlBlockerCheck.useQuery({ ventureId: v.id }),
  }));

  const anyBlocker = blockerQueries.some(q => q.query.data?.hasBlocker);

  if (!anyBlocker) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <ShieldCheck size={20} className="text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-bold text-green-700">No TRL Blockers Detected</p>
          <p className="text-xs text-green-600 mt-0.5">All ventures are clear to advance TRL — no unmitigated critical engineering risks (RPN &gt; 100) found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {blockerQueries.map(({ id, name, color, query }) => {
        if (!query.data?.hasBlocker) return null;
        return (
          <div key={id} className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-red-700">TRL Advancement Blocked</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{name}</span>
              </div>
              <p className="text-xs text-red-600 mt-0.5">
                {query.data.blockerCount} unmitigated critical risk{query.data.blockerCount > 1 ? 's' : ''} (RPN &gt; 100) — resolve in Risk Management before advancing.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {query.data.risks.map(r => (
                  <span key={r.id} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-300">
                    {r.componentName} (RPN {r.initialRpn})
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TrlAnalytics() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical size={16} style={{ color: "#3B85BA" }} />
          <span className="vos-badge vos-badge-blue" style={{ fontSize: "0.65rem" }}>TRL Analytics</span>
        </div>
        <h1 className="vos-page-title mb-1">Technology Readiness Level</h1>
        <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>Technical maturity tracking across all EcoRace ventures — NASA/EU Horizon 9-level framework</p>
      </div>

      <div className="p-8 space-y-8">
        {/* FMEA TRL Blocker Panel */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={14} className="text-red-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">FMEA Engineering Risk Blockers</span>
          </div>
          <TrlBlockerPanel />
        </div>

        {/* Scientific Validation Summary */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={14} className="text-green-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Scientific Validation (TRL 1–2)</span>
          </div>
          <ScientificValidationSummary />
        </div>

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
        <p className="text-xs text-amber-600 font-medium">⚠ TRL 4–7 represents the "Valley of Death" — where EcoRace provides critical bridge support</p>

        {/* TRL Progress Chart */}
        <div className="vos-panel p-6">
          <h3 className="vos-section-title mb-4">Overall TRL Progress by Venture</h3>
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
        <div className="vos-panel p-6">
          <h3 className="vos-section-title mb-1">The "Valley of Death" — Funding vs. Risk Profile</h3>
          <p className="text-xs text-gray-400 mb-4">EcoRace bridges the critical TRL 4–7 gap where traditional funding dries up and execution risk peaks</p>
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
        <div className="vos-panel p-6">
          <h3 className="vos-section-title mb-4">TRL Level Definitions (NASA/EU Horizon Standard)</h3>
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
