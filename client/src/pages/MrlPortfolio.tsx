// ============================================================
// MRL PORTFOLIO PAGE
// Manufacturing Readiness Level — Portfolio Intelligence
// Framework: BEBUS-MRL-SE-001 (5-subsystem scoring model)
// ============================================================

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, AlertTriangle, TrendingUp, Globe, ChevronRight, Cog, Shield, Leaf, BarChart3 } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const RAG_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  GREEN:  { bg: "#16a34a20", text: "#16a34a", label: "Green" },
  AMBER:  { bg: "#d9770620", text: "#d97706", label: "Amber" },
  RED:    { bg: "#dc262620", text: "#dc2626", label: "Red" },
};

const REGION_LABELS: Record<string, string> = {
  CN: "China-Led",
  UK: "UK-Led",
  HYBRID: "CN/UK Hybrid",
};

const MRL_LEVEL_COLORS: Record<number, string> = {
  0: "#6b7280", 1: "#dc2626", 2: "#ea580c", 3: "#d97706",
  4: "#ca8a04", 5: "#65a30d", 6: "#16a34a", 7: "#0d9488",
  8: "#0284c7", 9: "#7c3aed",
};

function MrlLevelBadge({ level, label }: { level: number; label?: string | null }) {
  const color = MRL_LEVEL_COLORS[level] ?? "#6b7280";
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}20`, color }}
    >
      MRL-{level}{label ? ` — ${label.replace(/^MRL-\d+:\s*/, "")}` : ""}
    </span>
  );
}

function RagBadge({ rag }: { rag: string }) {
  const c = RAG_COLORS[rag] ?? RAG_COLORS.AMBER;
  return (
    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MrlPortfolio() {
  const [, navigate] = useLocation();
  const { data: summary, isLoading } = trpc.mrl.getPortfolioSummary.useQuery();
  const { data: levelDefs } = trpc.mrl.getLevelDefs.useQuery();

  const avgMrl = summary?.avgMrl ?? 0;
  const avgColor = MRL_LEVEL_COLORS[Math.round(avgMrl)] ?? "#6b7280";

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen" style={{ background: "#f8fafc" }}>
        <div className="flex flex-col items-center gap-3">
          <Factory size={32} style={{ color: "#3A97D3" }} className="animate-pulse" />
          <span className="text-sm text-gray-400 font-mono">Loading MRL portfolio…</span>
        </div>
      </div>
    );
  }

  const ventures = summary?.ventures ?? [];
  const byRegion = summary?.byRegion ?? { CN: 0, UK: 0, HYBRID: 0 };
  const byRag = summary?.byRag ?? { GREEN: 0, AMBER: 0, RED: 0 };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f8fafc" }}>
      {/* ── Header ── */}
      <div className="px-8 py-7 border-b" style={{ background: "#fff", borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Factory size={18} style={{ color: "#3A97D3" }} />
              <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3A97D320", color: "#3A97D3" }}>
                BEBUS-MRL-SE-001
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">Manufacturing Readiness Level</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              MRL Portfolio Intelligence
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              5-subsystem manufacturing readiness scoring across the CN/UK integration model — tracking PDE, SCIE, CSM, QCE, and SIL dimensions per venture.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => navigate("/mrl-venture")}
            style={{ borderColor: "#3A97D3", color: "#3A97D3" }}
          >
            <Cog size={13} /> Venture Detail
          </Button>
        </div>
      </div>

      <div className="p-8">
        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Avg MRL */}
          <div className="bg-white rounded-xl border p-5 flex flex-col gap-1 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Avg MRL Level</span>
            <span className="text-3xl font-bold" style={{ color: avgColor, fontFamily: "'Prompt', sans-serif" }}>
              {avgMrl.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">of 9 levels · {ventures.length} ventures</span>
          </div>

          {/* Avg Composite */}
          <div className="bg-white rounded-xl border p-5 flex flex-col gap-1 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Avg Composite Score</span>
            <span className="text-3xl font-bold" style={{ color: "#3A97D3", fontFamily: "'Prompt', sans-serif" }}>
              {summary?.avgComposite ?? 0}
            </span>
            <span className="text-xs text-gray-400">out of 100</span>
          </div>

          {/* RAG breakdown */}
          <div className="bg-white rounded-xl border p-5 flex flex-col gap-1 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Risk RAG</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold" style={{ color: "#16a34a" }}>{byRag.GREEN}G</span>
              <span className="text-lg font-bold" style={{ color: "#d97706" }}>{byRag.AMBER}A</span>
              <span className="text-lg font-bold" style={{ color: "#dc2626" }}>{byRag.RED}R</span>
            </div>
            <span className="text-xs text-gray-400">Green / Amber / Red</span>
          </div>

          {/* Region split */}
          <div className="bg-white rounded-xl border p-5 flex flex-col gap-1 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Integration Model</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-gray-700">{byRegion.CN} CN</span>
              <span className="text-gray-300">·</span>
              <span className="text-sm font-bold text-gray-700">{byRegion.UK} UK</span>
              <span className="text-gray-300">·</span>
              <span className="text-sm font-bold text-gray-700">{byRegion.HYBRID} Hybrid</span>
            </div>
            <span className="text-xs text-gray-400">manufacturing regions</span>
          </div>
        </div>

        {/* ── Framework Reference ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* MRL Level Scale */}
          <div className="xl:col-span-2 bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                MRL Level Scale
              </h2>
              <span className="text-xs text-gray-400 font-mono">BEBUS-MRL-SE-001 §2</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(levelDefs ?? []).filter(d => d.level > 0).map((def) => {
                const color = MRL_LEVEL_COLORS[def.level] ?? "#6b7280";
                const avgRound = Math.round(avgMrl);
                const isAvg = def.level === avgRound;
                return (
                  <div
                    key={def.level}
                    className="rounded-lg p-3 border transition-all"
                    style={{
                      borderColor: isAvg ? color : "#e5e7eb",
                      background: isAvg ? `${color}08` : "#fafafa",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold" style={{ color }}>MRL-{def.level}</span>
                      {isAvg && <span className="text-xs px-1 rounded" style={{ background: `${color}20`, color }}>Portfolio Avg</span>}
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{def.label?.replace(/^MRL-\d+:\s*/, "")}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{def.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5-Subsystem Key */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>
              5-Subsystem Model
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { code: "PDE", name: "Process Design & Engineering", icon: Cog, color: "#3A97D3", desc: "Manufacturing process design, tooling, and engineering validation" },
                { code: "SCIE", name: "Supply Chain & Int. Execution", icon: Globe, color: "#7c3aed", desc: "Supplier qualification, dual-source strategy, and logistics" },
                { code: "CSM", name: "Cost Structure & Manufacturability", icon: BarChart3, color: "#d97706", desc: "Unit economics, CAPEX/OPEX modelling, and margin analysis" },
                { code: "QCE", name: "Quality, Compliance & Export", icon: Shield, color: "#16a34a", desc: "ISO/CE/RoHS certification, regulatory compliance, and QMS" },
                { code: "SIL", name: "Sustainability Integration Level", icon: Leaf, color: "#51AF37", desc: "Carbon footprint, CBAM exposure, circularity, and LCSA score" },
              ].map(({ code, name, icon: Icon, color, desc }) => (
                <div key={code} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold" style={{ color }}>{code}</span>
                      <span className="text-xs text-gray-600 font-medium">{name}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Venture Table ── */}
        <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Venture MRL Status
            </h2>
            <span className="text-xs text-gray-400 font-mono">{ventures.length} ventures tracked</span>
          </div>

          {ventures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Factory size={32} className="text-gray-300" />
              <p className="text-sm text-gray-400">No MRL assessments found. Run the seed script or submit an assessment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#f3f4f6" }}>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Venture</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">MRL Level</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Composite</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Risk RAG</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Region</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Assessed</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {ventures.map((v) => (
                    <tr
                      key={v.ventureId}
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      style={{ borderColor: "#f3f4f6" }}
                      onClick={() => navigate(`/mrl-venture?venture=${v.ventureId}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800">{v.ventureId.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-4">
                        <MrlLevelBadge level={v.mrlLevel} label={v.mrlLabel} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-700 w-8">{v.compositeScore ?? 0}</span>
                          <div className="w-20">
                            <ScoreBar value={v.compositeScore ?? 0} color={MRL_LEVEL_COLORS[v.mrlLevel] ?? "#6b7280"} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <RagBadge rag={v.riskRag ?? "AMBER"} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-500">{REGION_LABELS[v.mrlRegion ?? "HYBRID"] ?? v.mrlRegion}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-400 font-mono">
                          {v.assessedAt ? new Date(v.assessedAt).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <ChevronRight size={14} className="text-gray-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Risk Alerts ── */}
        {ventures.filter(v => v.riskRag === "RED").length > 0 && (
          <div className="mt-6 rounded-xl border p-5" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} style={{ color: "#dc2626" }} />
              <span className="text-sm font-bold" style={{ color: "#dc2626" }}>
                {ventures.filter(v => v.riskRag === "RED").length} venture(s) at RED manufacturing risk
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {ventures.filter(v => v.riskRag === "RED").map(v => (
                <div key={v.ventureId} className="flex items-center justify-between text-xs text-red-700">
                  <span className="font-semibold">{v.ventureId.toUpperCase()}</span>
                  <span>MRL-{v.mrlLevel} · Composite {v.compositeScore ?? 0}/100</span>
                  <button
                    className="underline"
                    onClick={() => navigate(`/mrl-venture?venture=${v.ventureId}`)}
                  >
                    Review →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
