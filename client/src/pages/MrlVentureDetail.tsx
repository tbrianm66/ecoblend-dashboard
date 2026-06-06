// ============================================================
// MRL VENTURE DETAIL PAGE
// Manufacturing Readiness Level — Venture Intelligence
// Framework: BEBUS-MRL-SE-001 (5-subsystem scoring model)
// ============================================================

import { useState } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Factory, Cog, Globe, Shield, Leaf, BarChart3,
  AlertTriangle, CheckCircle2, Clock, TrendingUp,
  ChevronDown, ChevronUp, Plus, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────

const RAG_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  GREEN:  { bg: "#16a34a20", text: "#16a34a", label: "Green" },
  AMBER:  { bg: "#d9770620", text: "#d97706", label: "Amber" },
  RED:    { bg: "#dc262620", text: "#dc2626", label: "Red" },
  G:      { bg: "#16a34a20", text: "#16a34a", label: "Green" },
  A:      { bg: "#d9770620", text: "#d97706", label: "Amber" },
  R:      { bg: "#dc262620", text: "#dc2626", label: "Red" },
};

const MRL_LEVEL_COLORS: Record<number, string> = {
  0: "#6b7280", 1: "#dc2626", 2: "#ea580c", 3: "#d97706",
  4: "#ca8a04", 5: "#65a30d", 6: "#16a34a", 7: "#0d9488",
  8: "#0284c7", 9: "#7c3aed",
};

const SUBSYSTEM_META = [
  { code: "pde",  label: "PDE",  name: "Process Design & Engineering",         icon: Cog,      color: "#3B85BA" },
  { code: "scie", label: "SCIE", name: "Supply Chain & Integration Execution",  icon: Globe,    color: "#7c3aed" },
  { code: "csm",  label: "CSM",  name: "Cost Structure & Manufacturability",    icon: BarChart3, color: "#d97706" },
  { code: "qce",  label: "QCE",  name: "Quality, Compliance & Export",          icon: Shield,   color: "#16a34a" },
  { code: "sil",  label: "SIL",  name: "Sustainability Integration Level",      icon: Leaf,     color: "#56A837" },
];

const COMPLIANCE_STATUS_COLORS: Record<string, string> = {
  "Not Started": "#6b7280",
  "Gap Analysis": "#d97706",
  "In Progress": "#3B85BA",
  "Submitted": "#7c3aed",
  "Certified": "#16a34a",
  "Expired": "#dc2626",
};

function ScoreGauge({ value, color, label }: { value: number; color: string; label: string }) {
  const pct = Math.min(100, value);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <span className="text-xs font-bold text-gray-500">{label}</span>
    </div>
  );
}

function RagDot({ rag }: { rag: string }) {
  const c = RAG_COLORS[rag] ?? RAG_COLORS.AMBER;
  return <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: c.text }} />;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "overview" | "suppliers" | "compliance" | "lcsa" | "risks";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "overview",    label: "Overview",   icon: Factory },
  { id: "suppliers",   label: "Suppliers",  icon: Globe },
  { id: "compliance",  label: "Compliance", icon: Shield },
  { id: "lcsa",        label: "LCSA",       icon: Leaf },
  { id: "risks",       label: "Risk Register", icon: AlertTriangle },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function MrlVentureDetail() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultVenture = params.get("venture") ?? "BEBUS";

  const [selectedVenture, setSelectedVenture] = useState(defaultVenture);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showAssessForm, setShowAssessForm] = useState(false);
  const [scores, setScores] = useState({ pde: 50, scie: 50, csm: 50, qce: 50, sil: 50 });
  const [trlLevel, setTrlLevel] = useState(3);
  const [region, setRegion] = useState<"CN" | "UK" | "HYBRID">("HYBRID");

  // Queries
  const { data: assessment, refetch: refetchAssessment } = trpc.mrl.getAssessment.useQuery({ ventureId: selectedVenture });
  const { data: history } = trpc.mrl.getAssessmentHistory.useQuery({ ventureId: selectedVenture });
  const { data: suppliers } = trpc.mrl.getSuppliers.useQuery({ ventureId: selectedVenture });
  const { data: compliance } = trpc.mrl.getCompliance.useQuery({ ventureId: selectedVenture });
  const { data: lcsa } = trpc.mrl.getLcsa.useQuery({ ventureId: selectedVenture });
  const { data: risks } = trpc.mrl.getRisks.useQuery({ ventureId: selectedVenture });
  const { data: trlAlignment } = trpc.mrl.getTrlAlignment.useQuery({ trlLevel });

  // Mutations
  const createAssessment = trpc.mrl.createAssessment.useMutation({
    onSuccess: (data) => {
      toast.success(`MRL assessment created — MRL-${data.mrlLevel} (${data.mrlLabel}), composite ${data.compositeScore}`);
      setShowAssessForm(false);
      refetchAssessment();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRiskStatus = trpc.mrl.updateRiskStatus.useMutation({
    onSuccess: () => toast.success("Risk status updated"),
  });

  const updateComplianceStatus = trpc.mrl.updateComplianceStatus.useMutation({
    onSuccess: () => toast.success("Compliance status updated"),
  });

  const mrlLevel = assessment?.mrlLevel ?? 0;
  const mrlColor = MRL_LEVEL_COLORS[mrlLevel] ?? "#6b7280";

  const VENTURES = ["BEBUS", "EcoComp", "EcoRace", "PIPE", "REAL", "TONE"];

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f8fafc" }}>
      {/* ── Header ── */}
      <div className="px-8 py-6 border-b" style={{ background: "#fff", borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Factory size={16} style={{ color: "#3B85BA" }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#3B85BA" }}>MRL Venture Detail</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                {selectedVenture}
                {assessment && (
                  <span className="ml-3 text-sm font-normal" style={{ color: mrlColor }}>
                    MRL-{mrlLevel} — {assessment.mrlLabel?.replace(/^MRL-\d+:\s*/, "")}
                  </span>
                )}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Venture selector */}
            <select
              value={selectedVenture}
              onChange={(e) => setSelectedVenture(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2"
              style={{ borderColor: "#e5e7eb" }}
            >
              {VENTURES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => setShowAssessForm(s => !s)}
              style={{ borderColor: "#3B85BA", color: "#3B85BA" }}
            >
              <Plus size={13} /> New Assessment
            </Button>
          </div>
        </div>

        {/* ── Assessment Form ── */}
        {showAssessForm && (
          <div className="mt-5 p-5 rounded-xl border" style={{ background: "#f0f9ff", borderColor: "#bae6fd" }}>
            <h3 className="text-sm font-bold text-gray-800 mb-4">Submit MRL Assessment — {selectedVenture}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {SUBSYSTEM_META.map(({ code, label, color }) => (
                <div key={code}>
                  <label className="text-xs font-semibold mb-1 block" style={{ color }}>{label} Score (0–100)</label>
                  <input
                    type="number" min={0} max={100}
                    value={scores[code as keyof typeof scores]}
                    onChange={(e) => setScores(s => ({ ...s, [code]: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "#e5e7eb" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">TRL Level (1–9)</label>
                <input
                  type="number" min={1} max={9}
                  value={trlLevel}
                  onChange={(e) => setTrlLevel(parseInt(e.target.value) || 1)}
                  className="w-24 border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  style={{ borderColor: "#e5e7eb" }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Integration Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as "CN" | "UK" | "HYBRID")}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <option value="CN">CN — China-Led</option>
                  <option value="UK">UK — UK-Led</option>
                  <option value="HYBRID">HYBRID — CN/UK</option>
                </select>
              </div>
              {trlAlignment && (
                <div className="text-xs text-gray-500 mt-4">
                  TRL-{trlLevel} → Recommended MRL-{trlAlignment.minMrl}–{trlAlignment.maxMrl}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => createAssessment.mutate({ ventureId: selectedVenture, scores, trlLevel, region })}
                disabled={createAssessment.isPending}
                style={{ background: "#3B85BA", color: "#fff" }}
              >
                {createAssessment.isPending ? "Submitting…" : "Submit Assessment"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAssessForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="border-b px-8" style={{ background: "#fff", borderColor: "#e5e7eb" }}>
        <div className="flex gap-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderColor: activeTab === id ? "#3B85BA" : "transparent",
                color: activeTab === id ? "#3B85BA" : "#6b7280",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {!assessment ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border" style={{ borderColor: "#e5e7eb" }}>
                <Factory size={32} className="text-gray-300" />
                <p className="text-sm text-gray-400">No MRL assessment found for {selectedVenture}. Submit one above.</p>
              </div>
            ) : (
              <>
                {/* Score gauges */}
                <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                        5-Subsystem Scores
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">BEBUS-MRL-SE-001 §3 — weighted composite</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold" style={{ color: mrlColor, fontFamily: "'Prompt', sans-serif" }}>
                        {assessment.compositeScore}
                      </div>
                      <div className="text-xs text-gray-400">Composite Score</div>
                    </div>
                  </div>
                  <div className="flex justify-around">
                    {SUBSYSTEM_META.map(({ code, label, color }) => {
                      const scoreKey = `${code}Score` as keyof typeof assessment;
                      const val = (assessment[scoreKey] as number) ?? 0;
                      return <ScoreGauge key={code} value={val} color={color} label={label} />;
                    })}
                  </div>
                </div>

                {/* MRL Level + TRL Alignment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">MRL Level</h3>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-5xl font-black" style={{ color: mrlColor, fontFamily: "'Prompt', sans-serif" }}>
                        {mrlLevel}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-gray-700">{assessment.mrlLabel?.replace(/^MRL-\d+:\s*/, "")}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Region: {assessment.mrlRegion ?? "HYBRID"} · Risk: <RagDot rag={assessment.riskRag ?? "AMBER"} />
                          {" "}<span style={{ color: RAG_COLORS[assessment.riskRag ?? "AMBER"]?.text }}>{RAG_COLORS[assessment.riskRag ?? "AMBER"]?.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      VRL Contribution: <span className="font-bold text-gray-700">{((assessment.vrlContribution ?? 0) * 100).toFixed(0)}%</span>
                      {" "}· Assessed by: <span className="font-medium">{assessment.assessedBy ?? "System"}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">TRL→MRL Alignment</h3>
                    {assessment.trlAlignment ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500">TRL-{assessment.trlLevel ?? "N/A"}</span>
                          <span className="text-gray-300">→</span>
                          <span className="text-xs font-bold" style={{ color: mrlColor }}>
                            MRL-{assessment.trlAlignment.minMrl}–{assessment.trlAlignment.maxMrl} expected
                          </span>
                          {assessment.isTrlAligned ? (
                            <CheckCircle2 size={14} style={{ color: "#16a34a" }} />
                          ) : (
                            <AlertTriangle size={14} style={{ color: "#d97706" }} />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{assessment.trlAlignment.rationale}</p>
                        <div className="mt-2 text-xs">
                          <span className={assessment.isTrlAligned ? "text-green-600" : "text-amber-600"}>
                            {assessment.isTrlAligned ? "✓ TRL/MRL aligned" : "⚠ MRL lags TRL — manufacturing readiness gap"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">No TRL level recorded for this assessment.</p>
                    )}
                  </div>
                </div>

                {/* Assessment History */}
                {history && history.length > 1 && (
                  <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Assessment History</h3>
                    <div className="flex flex-col gap-2">
                      {history.slice(0, 5).map((h, i) => (
                        <div key={h.id} className="flex items-center gap-3 text-xs">
                          <span className="text-gray-400 font-mono w-24">{new Date(h.assessedAt).toLocaleDateString()}</span>
                          <span className="font-bold" style={{ color: MRL_LEVEL_COLORS[h.mrlLevel] ?? "#6b7280" }}>MRL-{h.mrlLevel}</span>
                          <span className="text-gray-500">{h.mrlLabel?.replace(/^MRL-\d+:\s*/, "")}</span>
                          <span className="text-gray-400">Composite: {h.compositeScore}</span>
                          {i === 0 && <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "#3B85BA20", color: "#3B85BA" }}>Latest</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── SUPPLIERS TAB ── */}
        {activeTab === "suppliers" && (
          <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
              <h2 className="text-base font-bold text-gray-900">Supplier Register</h2>
              <span className="text-xs text-gray-400 font-mono">{suppliers?.length ?? 0} suppliers</span>
            </div>
            {!suppliers?.length ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Globe size={28} className="text-gray-300" />
                <p className="text-sm text-gray-400">No suppliers registered for {selectedVenture}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "#f3f4f6" }}>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Supplier</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Tier</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Country / Region</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Risk RAG</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Single Source</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Lead Time</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((s) => (
                      <tr key={s.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                        <td className="px-6 py-4 font-semibold text-gray-800">{s.name}</td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{s.mrlSupplierTier}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-500">{s.country} / {s.mrlSupplierRegion}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: RAG_COLORS[s.mrlScieRag ?? "AMBER"]?.bg, color: RAG_COLORS[s.mrlScieRag ?? "AMBER"]?.text }}>
                            {RAG_COLORS[s.mrlScieRag ?? "AMBER"]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {s.isSingleSource ? (
                            <span className="text-xs text-red-600 font-semibold">⚠ Single Source</span>
                          ) : (
                            <span className="text-xs text-green-600">Dual Available</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-500">{s.leadTimeWeeks ?? "—"} wks</td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-gray-500">{s.mrlAuditStatus ?? "Not Audited"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── COMPLIANCE TAB ── */}
        {activeTab === "compliance" && (
          <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
              <h2 className="text-base font-bold text-gray-900">Compliance & Certification Tracker</h2>
              <span className="text-xs text-gray-400 font-mono">{compliance?.length ?? 0} records</span>
            </div>
            {!compliance?.length ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Shield size={28} className="text-gray-300" />
                <p className="text-sm text-gray-400">No compliance records for {selectedVenture}.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y" style={{ borderColor: "#f3f4f6" }}>
                {compliance.map((c) => {
                  const statusColor = COMPLIANCE_STATUS_COLORS[c.mrlComplianceStatus ?? "Not Started"] ?? "#6b7280";
                  return (
                    <div key={c.id} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">{c.standard}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-500">{c.market}</span>
                          {c.isOnCriticalPath && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "#fef2f2", color: "#dc2626" }}>Critical Path</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{c.mrlComplianceCat}</span>
                          {c.estimatedCostGbp && <span>Est. £{c.estimatedCostGbp.toLocaleString()}</span>}
                          {c.estimatedWeeks && <span>{c.estimatedWeeks} weeks</span>}
                          {c.certificationBody && <span>{c.certificationBody}</span>}
                        </div>
                        {c.gapSummary && <p className="text-xs text-gray-500 mt-1">{c.gapSummary}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${statusColor}20`, color: statusColor }}>
                          {c.mrlComplianceStatus}
                        </span>
                        <select
                          className="text-xs border rounded px-2 py-1 text-gray-600 focus:outline-none"
                          style={{ borderColor: "#e5e7eb" }}
                          value={c.mrlComplianceStatus ?? "Not Started"}
                          onChange={(e) => updateComplianceStatus.mutate({ id: c.id, status: e.target.value as any })}
                        >
                          {["Not Started","Gap Analysis","In Progress","Submitted","Certified","Expired"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── LCSA TAB ── */}
        {activeTab === "lcsa" && (
          <div className="flex flex-col gap-6">
            {!lcsa?.length ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border" style={{ borderColor: "#e5e7eb" }}>
                <Leaf size={32} className="text-gray-300" />
                <p className="text-sm text-gray-400">No LCSA records for {selectedVenture}.</p>
              </div>
            ) : (
              lcsa.slice(0, 3).map((l) => (
                <div key={l.id} className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700">LCSA Record — {new Date(l.recordedAt).toLocaleDateString()}</h3>
                    <span className="text-xs text-gray-400 font-mono">SIL Score: {l.silScore ?? "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{l.carbonScope1?.toFixed(1) ?? "—"}</div>
                      <div className="text-xs text-gray-400">Scope 1 tCO₂e</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{l.carbonScope2?.toFixed(1) ?? "—"}</div>
                      <div className="text-xs text-gray-400">Scope 2 tCO₂e</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{l.carbonScope3?.toFixed(1) ?? "—"}</div>
                      <div className="text-xs text-gray-400">Scope 3 tCO₂e</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: "#56A837" }}>{l.lcsaScore ?? "—"}</div>
                      <div className="text-xs text-gray-400">LCSA Score /100</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">Circularity Index</div>
                      <div className="text-sm font-bold text-gray-700">{((l.circularityIndex ?? 0) * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">CBAM Exposure</div>
                      <div className="text-sm font-bold" style={{ color: l.mrlCbamExposure === "High" ? "#dc2626" : l.mrlCbamExposure === "Medium" ? "#d97706" : "#16a34a" }}>
                        {l.mrlCbamExposure ?? "None"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">Carbon / Unit</div>
                      <div className="text-sm font-bold text-gray-700">{l.carbonIntensityPerUnit?.toFixed(2) ?? "—"} kgCO₂e</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── RISK REGISTER TAB ── */}
        {activeTab === "risks" && (
          <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
              <h2 className="text-base font-bold text-gray-900">MRL Risk Register</h2>
              <span className="text-xs text-gray-400 font-mono">{risks?.length ?? 0} risks</span>
            </div>
            {!risks?.length ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <AlertTriangle size={28} className="text-gray-300" />
                <p className="text-sm text-gray-400">No risks registered for {selectedVenture}.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y" style={{ borderColor: "#f3f4f6" }}>
                {risks.map((r) => {
                  const ragC = RAG_COLORS[r.mrlRag ?? "A"] ?? RAG_COLORS.A;
                  return (
                    <div key={r.id} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <RagDot rag={r.mrlRag ?? "A"} />
                          <span className="font-semibold text-gray-800 text-sm">{r.description}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="font-medium" style={{ color: ragC.text }}>{r.mrlRiskCat}</span>
                          <span>P: {r.probability}%</span>
                          <span>I: {r.impact}%</span>
                          <span className="font-bold text-gray-600">Risk Score: {r.riskScore}</span>
                          {r.mrlRiskPriority && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-bold"
                              style={{ background: r.mrlRiskPriority === "HIGH" ? "#fef2f2" : r.mrlRiskPriority === "MED" ? "#fffbeb" : "#f0fdf4",
                                       color: r.mrlRiskPriority === "HIGH" ? "#dc2626" : r.mrlRiskPriority === "MED" ? "#d97706" : "#16a34a" }}>
                              {r.mrlRiskPriority}
                            </span>
                          )}
                        </div>
                        {r.mitigationAction && (
                          <p className="text-xs text-gray-500 mt-1">Mitigation: {r.mitigationAction}</p>
                        )}
                      </div>
                      <select
                        className="text-xs border rounded px-2 py-1 text-gray-600 focus:outline-none"
                        style={{ borderColor: "#e5e7eb" }}
                        value={r.mrlRiskStatus ?? "Open"}
                        onChange={(e) => updateRiskStatus.mutate({ id: r.id, status: e.target.value as any })}
                      >
                        {["Open","In Progress","Mitigated","Accepted","Closed"].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
