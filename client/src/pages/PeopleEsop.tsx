// ============================================================
// ECOBLEND — People & ESOP Module (Sprint 36 — Dynamic Equity Engine)
// Formula: Score = (0.4×VRL) + (0.3×Contribution) + (0.2×Capital) + (0.1×Performance)
// 5 tabs: Overview · Equity Register · Contributions · Cap Table · Legal Conversion
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Users, Award, TrendingUp, DollarSign, Plus, RefreshCw,
  ChevronDown, ChevronUp, BarChart2, BookOpen, Scale,
  CheckCircle2, Clock, AlertCircle, Zap, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// ── Colour helpers ────────────────────────────────────────────────────────────
const VENTURE_COLORS: Record<string, string> = {
  ecoblend: "#22c55e", ecorace: "#22c55e", ecocomp: "#22c55e",
  bebus: "#1d4ed8", tone: "#7c3aed", real: "#f59e0b", pipe: "#06b6d4",
};
const getVentureColor = (id: string) => VENTURE_COLORS[id.toLowerCase()] ?? "#6b7280";

const VESTING_COLORS: Record<string, string> = {
  "Not Started": "#9ca3af", "Cliff": "#f59e0b", "Vesting": "#22c55e", "Fully Vested": "#1d4ed8",
};
const STIPEND_COLORS: Record<string, string> = {
  "Active": "#22c55e", "Completed": "#1d4ed8", "Pending": "#f59e0b", "Paused": "#ef4444",
};
const MILESTONE_COLORS: Record<string, string> = {
  "Pending": "#9ca3af", "Active": "#3b82f6", "Triggered": "#f59e0b", "Completed": "#22c55e",
};
const CONTRIBUTION_COLORS: Record<string, string> = {
  "Task Completion": "#3b82f6", "Milestone Achieved": "#22c55e", "Capital Injection": "#f59e0b",
  "Commercial Traction": "#8b5cf6", "VRL Progression": "#22c55e", "IP Filing": "#ec4899",
  "Team Building": "#06b6d4", "Other": "#9ca3af",
};

// ── Equity Score Gauge (SVG arc) ──────────────────────────────────────────────
function EquityGauge({ score, color }: { score: number; color: string }) {
  const pct = Math.min(1, score / 10);
  const r = 28; const cx = 36; const cy = 36;
  const circumference = Math.PI * r; // half-circle
  const offset = circumference * (1 - pct);
  return (
    <svg width="72" height="44" viewBox="0 0 72 44">
      <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`} fill="none" stroke="#e5e7eb" strokeWidth="6" strokeLinecap="round" />
      <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.7s ease" }} />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{score.toFixed(1)}</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7" fill="#9ca3af">/10</text>
    </svg>
  );
}

// ── Donut chart for equity distribution ──────────────────────────────────────
function EquityDonut({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
  let cumAngle = -Math.PI / 2;
  const r = 60; const cx = 80; const cy = 80;
  const paths = slices.map(sl => {
    const angle = (sl.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { d: `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large},1 ${x2},${y2} Z`, color: sl.color, label: sl.label, value: sl.value };
  });
  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} opacity={0.85} />)}
        <circle cx={cx} cy={cy} r={38} fill="white" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f2937">{total.toFixed(0)}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#9ca3af">allocated</text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {slices.map(sl => (
          <div key={sl.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sl.color }} />
            <span className="text-xs text-gray-600 truncate max-w-[120px]">{sl.label}</span>
            <span className="text-xs font-mono font-bold ml-auto" style={{ color: sl.color }}>{sl.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Vesting progress bar ──────────────────────────────────────────────────────
function VestingBar({ monthsIn, vestingMonths, cliffMonths, status }: { monthsIn: number; vestingMonths: number; cliffMonths: number; status: string }) {
  const cliffPct = vestingMonths > 0 ? (cliffMonths / vestingMonths) * 100 : 0;
  const progressPct = vestingMonths > 0 ? Math.min((monthsIn / vestingMonths) * 100, 100) : 0;
  return (
    <div className="relative w-full h-2.5 rounded-full bg-gray-100 overflow-visible">
      <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
        style={{ width: `${progressPct}%`, background: VESTING_COLORS[status] ?? "#22c55e" }} />
      {cliffMonths > 0 && (
        <div className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-gray-400 z-10"
          style={{ left: `${cliffPct}%` }} title={`Cliff: ${cliffMonths}m`} />
      )}
    </div>
  );
}

// ── Score component bar ───────────────────────────────────────────────────────
function ScoreBar({ label, value, weight, color }: { label: string; value: number; weight: number; color: string }) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs text-gray-500">{label} <span className="text-gray-400">({(weight * 100).toFixed(0)}%)</span></span>
        <span className="text-xs font-mono font-bold" style={{ color }}>{value.toFixed(1)}/10</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-gray-100">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / 10) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Allocation = {
  id: number; ventureId: string; memberName: string; memberRole: string | null;
  equityPct: number | null; vestingMonths: number | null; cliffMonths: number | null;
  monthsIn: number | null; vestingStatus: string | null;
  vrlScore: number | null; contributionScore: number | null; capitalInput: number | null; performanceScore: number | null;
  dynamicEquityScore: number | null; dynamicEquityPct: number | null;
  stipendStatus: string | null; stipendMonthly: number | null; stipendMonthsTotal: number | null; stipendMonthsUsed: number | null;
  legallyConverted: boolean | null; conversionDate: Date | null; shareClass: string | null;
};

// ── Main component ────────────────────────────────────────────────────────────
export default function PeopleEsop() {
  const [activeTab, setActiveTab] = useState<"overview" | "register" | "contributions" | "captable" | "legal">("overview");
  const [selectedVenture, setSelectedVenture] = useState<string>("All");
  const [showAddAllocation, setShowAddAllocation] = useState(false);
  const [showLogContribution, setShowLogContribution] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);
  const [expandedMember, setExpandedMember] = useState<number | null>(null);

  // ── tRPC queries ─────────────────────────────────────────────────────────────
  const { data: allAllocations = [], refetch: refetchAllocations } = trpc.equity.listAllocations.useQuery({ ventureId: undefined });
  const { data: portfolioSummary = [] } = trpc.equity.getPortfolioEquitySummary.useQuery();
  const { data: leaderboard = [] } = trpc.equity.getLeaderboard.useQuery({ ventureId: undefined });
  const { data: contributions = [], refetch: refetchContributions } = trpc.equity.listContributions.useQuery({ ventureId: undefined });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const upsertAllocation = trpc.equity.upsertAllocation.useMutation({
    onSuccess: () => { refetchAllocations(); toast.success("Allocation saved"); setShowAddAllocation(false); },
    onError: (e) => toast.error(e.message),
  });
  const computeScore = trpc.equity.computeEquityScore.useMutation({
    onSuccess: (d) => { refetchAllocations(); toast.success(`Score: ${d.dynamicEquityScore.toFixed(2)} → ${d.dynamicEquityPct.toFixed(2)}% of pool`); },
    onError: (e) => toast.error(e.message),
  });
  const logContribution = trpc.equity.logContribution.useMutation({
    onSuccess: () => { refetchContributions(); refetchAllocations(); toast.success("Contribution logged"); setShowLogContribution(false); },
    onError: (e) => toast.error(e.message),
  });

  // ── Derived data ──────────────────────────────────────────────────────────────
  const ventures = useMemo(() => Array.from(new Set(allAllocations.map(a => a.ventureId))), [allAllocations]);
  const filtered = useMemo(() =>
    selectedVenture === "All" ? allAllocations : allAllocations.filter(a => a.ventureId === selectedVenture),
    [allAllocations, selectedVenture]);

  const totalTeam = allAllocations.length;
  const totalEquity = allAllocations.reduce((s, a) => s + (a.equityPct ?? 0), 0);
  const activeStipends = allAllocations.filter(a => a.stipendStatus === "Active").length;
  const avgDynamicScore = allAllocations.length > 0
    ? allAllocations.reduce((s, a) => s + (a.dynamicEquityScore ?? 0), 0) / allAllocations.length
    : 0;

  const donutSlices = useMemo(() =>
    filtered.map(a => ({
      label: a.memberName,
      value: a.equityPct ?? 0,
      color: getVentureColor(a.ventureId),
    })).filter(s => s.value > 0),
    [filtered]);

  // ── Add Allocation form state ─────────────────────────────────────────────────
  const [allocForm, setAllocForm] = useState({
    ventureId: "", memberName: "", memberRole: "Founder" as string,
    equityPct: 0, vestingMonths: 48, cliffMonths: 12, monthsIn: 0,
    vestingStatus: "Not Started" as string,
    vrlScore: 0, contributionScore: 0, capitalInput: 0, performanceScore: 0,
    stipendStatus: "Pending" as string, stipendMonthly: 2200, stipendMonthsTotal: 6, stipendMonthsUsed: 0,
  });

  // ── Log Contribution form state ───────────────────────────────────────────────
  const [contribForm, setContribForm] = useState({
    allocationId: 0, memberName: "", ventureId: "",
    contributionType: "Task Completion" as string,
    description: "", valueScore: 5, capitalAmount: 0,
  });

  // ── Add Milestone form state ──────────────────────────────────────────────────
  const [milestoneForm, setMilestoneForm] = useState({
    ventureId: "", milestoneName: "", milestoneType: "VRL Gate" as string,
    triggerVrlLevel: 5, description: "", legalStructure: "",
  });

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "register", label: "Equity Register", icon: Award },
    { id: "contributions", label: "Contributions", icon: TrendingUp },
    { id: "captable", label: "Cap Table", icon: BookOpen },
    { id: "legal", label: "Legal Conversion", icon: Scale },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#1d4ed815", color: "#1d4ed8" }}>
            People
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">Dynamic Equity Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          People & ESOP
        </h1>
        <p className="text-sm text-gray-500 max-w-xl">
          Dynamic equity tracking using the EcoBlend formula: <strong>Score = (0.4×VRL) + (0.3×Contribution) + (0.2×Capital) + (0.1×Performance)</strong>. Equity converts to legal shares at defined milestones.
        </p>
      </div>

      <div className="p-8 space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Team Members", value: totalTeam.toString(), sub: `across ${ventures.length} ventures`, color: "#1d4ed8", icon: Users },
            { label: "Equity Allocated", value: `${totalEquity.toFixed(1)}%`, sub: "of ESOP pool", color: "#22c55e", icon: Award },
            { label: "Active Stipends", value: activeStipends.toString(), sub: "receiving support", color: "#f59e0b", icon: DollarSign },
            { label: "Avg Dynamic Score", value: avgDynamicScore.toFixed(2), sub: "out of 10.00", color: "#8b5cf6", icon: TrendingUp },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                  <kpi.icon size={14} style={{ color: kpi.color }} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{kpi.label}</span>
              </div>
              <div className="text-3xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px"
              style={{
                borderBottomColor: activeTab === tab.id ? "#1d4ed8" : "transparent",
                color: activeTab === tab.id ? "#1d4ed8" : "#6b7280",
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Overview ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Venture filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["All", ...ventures] as string[]).map(v => (
                <button key={v} onClick={() => setSelectedVenture(v)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{ background: selectedVenture === v ? "#1d4ed8" : "#f3f4f6", color: selectedVenture === v ? "white" : "#6b7280" }}>
                  {v}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Equity distribution donut */}
              <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Equity Distribution</h3>
                {donutSlices.length > 0 ? (
                  <EquityDonut slices={donutSlices} />
                ) : (
                  <div className="text-xs text-gray-400 py-8 text-center">No equity allocations yet. Add members in the Equity Register tab.</div>
                )}
              </div>

              {/* Dynamic score leaderboard */}
              <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Contribution Leaderboard</h3>
                {leaderboard.length === 0 ? (
                  <div className="text-xs text-gray-400 py-8 text-center">No data yet. Compute equity scores to populate the leaderboard.</div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 8).map((m, i) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold w-5 text-gray-400">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs font-semibold text-gray-800 truncate">{m.memberName}</span>
                            <span className="text-xs font-mono font-bold ml-2" style={{ color: getVentureColor(m.ventureId) }}>
                              {(m.dynamicEquityScore ?? 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-gray-100">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${((m.dynamicEquityScore ?? 0) / 10) * 100}%`, background: getVentureColor(m.ventureId) }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Portfolio summary by venture */}
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Portfolio Equity Summary</h3>
              {portfolioSummary.length === 0 ? (
                <div className="text-xs text-gray-400 py-4 text-center">No equity data yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolioSummary.map(v => (
                    <div key={v.ventureId} className="rounded-lg p-4" style={{ background: `${getVentureColor(v.ventureId)}08`, border: `1px solid ${getVentureColor(v.ventureId)}25` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold uppercase" style={{ color: getVentureColor(v.ventureId) }}>{v.ventureId}</span>
                        <span className="text-xs text-gray-400">{v.memberCount} members</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-400">Equity:</span> <span className="font-mono font-bold text-gray-700">{v.totalEquityAllocated.toFixed(1)}%</span></div>
                        <div><span className="text-gray-400">Avg Score:</span> <span className="font-mono font-bold" style={{ color: getVentureColor(v.ventureId) }}>{v.avgDynamicScore.toFixed(2)}</span></div>
                        <div><span className="text-gray-400">Stipends:</span> <span className="font-mono font-bold text-green-600">{v.activeStipends}</span></div>
                        <div><span className="text-gray-400">Converted:</span> <span className="font-mono font-bold text-blue-600">{v.legallyConverted}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formula explanation */}
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>EcoBlend Dynamic Equity Formula</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "VRL Score", weight: "40%", desc: "Venture Readiness Level contribution — rewards founders who advance the venture through validation stages.", color: "#22c55e" },
                  { label: "Contribution", weight: "30%", desc: "Task completions, milestones, IP filings, team building — the day-to-day execution effort.", color: "#3b82f6" },
                  { label: "Capital Input", weight: "20%", desc: "Financial contribution to the venture (£k). Normalised: £500k = score 10.", color: "#f59e0b" },
                  { label: "Performance", weight: "10%", desc: "Revenue, commercial traction, and KPI achievement — real-world market validation.", color: "#8b5cf6" },
                ].map(item => (
                  <div key={item.label} className="rounded-lg p-4" style={{ background: `${item.color}08`, border: `1px solid ${item.color}25` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: item.color }}>{item.label}</span>
                      <span className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.weight}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Equity Register ──────────────────────────────────────────────── */}
        {activeTab === "register" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Equity Register</h2>
              <div className="flex gap-2">
                <div className="flex gap-1 flex-wrap">
                  {(["All", ...ventures] as string[]).map(v => (
                    <button key={v} onClick={() => setSelectedVenture(v)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                      style={{ background: selectedVenture === v ? "#1d4ed8" : "#f3f4f6", color: selectedVenture === v ? "white" : "#6b7280" }}>
                      {v}
                    </button>
                  ))}
                </div>
                <Button size="sm" onClick={() => setShowAddAllocation(true)} className="gap-1.5 text-xs" style={{ background: "#1d4ed8" }}>
                  <Plus size={13} /> Add Member
                </Button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <Users size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">No equity allocations yet. Click "Add Member" to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(member => {
                  const color = getVentureColor(member.ventureId);
                  const isExpanded = expandedMember === member.id;
                  return (
                    <div key={member.id} className="bg-white rounded-xl border shadow-sm overflow-hidden"
                      style={{ borderLeft: `4px solid ${color}`, borderColor: "#e5e7eb", borderLeftColor: color }}>
                      {/* Main row */}
                      <div className="p-5">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                          {/* Identity */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-900">{member.memberName}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">{member.memberRole}</span>
                            </div>
                            <div className="text-xs font-semibold mb-2" style={{ color }}>
                              {member.ventureId.toUpperCase()}
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                style={{ background: `${STIPEND_COLORS[member.stipendStatus ?? "Pending"]}15`, color: STIPEND_COLORS[member.stipendStatus ?? "Pending"] }}>
                                Stipend: {member.stipendStatus}
                              </span>
                              {member.legallyConverted && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-blue-50 text-blue-600">Legally Converted</span>
                              )}
                            </div>
                          </div>

                          {/* Dynamic Equity Score */}
                          <div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Dynamic Score</div>
                            <div className="flex items-center gap-3">
                              <EquityGauge score={member.dynamicEquityScore ?? 0} color={color} />
                              <div>
                                <div className="text-lg font-bold font-mono" style={{ color }}>{(member.dynamicEquityPct ?? 0).toFixed(2)}%</div>
                                <div className="text-xs text-gray-400">of equity pool</div>
                                <Button size="sm" variant="outline" className="mt-1 text-xs h-6 px-2 gap-1"
                                  onClick={() => computeScore.mutate({ allocationId: member.id })}>
                                  <RefreshCw size={10} /> Compute
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Vesting */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Vesting</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: `${VESTING_COLORS[member.vestingStatus ?? "Not Started"]}15`, color: VESTING_COLORS[member.vestingStatus ?? "Not Started"] }}>
                                {member.vestingStatus}
                              </span>
                            </div>
                            <div className="flex items-end gap-1 mb-2">
                              <span className="text-xl font-bold font-mono" style={{ color }}>{(member.equityPct ?? 0).toFixed(1)}%</span>
                              <span className="text-xs text-gray-400 mb-0.5">legal equity</span>
                            </div>
                            <VestingBar
                              monthsIn={member.monthsIn ?? 0}
                              vestingMonths={member.vestingMonths ?? 48}
                              cliffMonths={member.cliffMonths ?? 12}
                              status={member.vestingStatus ?? "Not Started"}
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                              <span>Month {member.monthsIn ?? 0}</span>
                              <span>Cliff: {member.cliffMonths ?? 12}m</span>
                              <span>Full: {member.vestingMonths ?? 48}m</span>
                            </div>
                          </div>

                          {/* Stipend */}
                          <div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Stipend</div>
                            {(member.stipendMonthly ?? 0) > 0 ? (
                              <>
                                <div className="text-xl font-bold font-mono text-amber-500 mb-1">
                                  £{(member.stipendMonthly ?? 0).toLocaleString()}<span className="text-xs font-normal text-gray-400">/mo</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-gray-100 mb-1">
                                  <div className="h-full rounded-full"
                                    style={{ width: `${((member.stipendMonthsUsed ?? 0) / (member.stipendMonthsTotal ?? 6)) * 100}%`, background: STIPEND_COLORS[member.stipendStatus ?? "Pending"] }} />
                                </div>
                                <div className="text-xs text-gray-400">{member.stipendMonthsUsed ?? 0}/{member.stipendMonthsTotal ?? 6} months disbursed</div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400 mt-2">Equity only — no stipend</div>
                            )}
                          </div>
                        </div>

                        {/* Expand toggle */}
                        <button className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setExpandedMember(isExpanded ? null : member.id)}>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? "Hide score breakdown" : "Show score breakdown"}
                        </button>
                      </div>

                      {/* Expanded: score breakdown */}
                      {isExpanded && (
                        <div className="border-t px-5 py-4 bg-gray-50" style={{ borderColor: "#e5e7eb" }}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Score Components</div>
                              <ScoreBar label="VRL Score" value={member.vrlScore ?? 0} weight={0.4} color="#22c55e" />
                              <ScoreBar label="Contribution" value={member.contributionScore ?? 0} weight={0.3} color="#3b82f6" />
                              <ScoreBar label="Capital Input (£k)" value={Math.min(10, (member.capitalInput ?? 0) / 50)} weight={0.2} color="#f59e0b" />
                              <ScoreBar label="Performance" value={member.performanceScore ?? 0} weight={0.1} color="#8b5cf6" />
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Quick Edit Scores</div>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { key: "vrlScore", label: "VRL Score", value: member.vrlScore ?? 0 },
                                  { key: "contributionScore", label: "Contribution", value: member.contributionScore ?? 0 },
                                  { key: "capitalInput", label: "Capital (£k)", value: member.capitalInput ?? 0 },
                                  { key: "performanceScore", label: "Performance", value: member.performanceScore ?? 0 },
                                ].map(field => (
                                  <div key={field.key}>
                                    <Label className="text-xs text-gray-500">{field.label}</Label>
                                    <Input type="number" defaultValue={field.value} step="0.1" min="0" max={field.key === "capitalInput" ? 9999 : 10}
                                      className="h-7 text-xs mt-0.5"
                                      onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val)) {
                                          upsertAllocation.mutate({ id: member.id, ventureId: member.ventureId, memberName: member.memberName, [field.key]: val });
                                        }
                                      }} />
                                  </div>
                                ))}
                              </div>
                              <Button size="sm" className="mt-3 w-full text-xs gap-1" style={{ background: "#1d4ed8" }}
                                onClick={() => computeScore.mutate({ allocationId: member.id })}>
                                <Zap size={12} /> Recompute Dynamic Score
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Contributions ───────────────────────────────────────────────── */}
        {activeTab === "contributions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Contribution Log</h2>
              <Button size="sm" onClick={() => setShowLogContribution(true)} className="gap-1.5 text-xs" style={{ background: "#22c55e" }}>
                <Plus size={13} /> Log Contribution
              </Button>
            </div>

            {contributions.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <TrendingUp size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">No contributions logged yet. Use "Log Contribution" to track team activity.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-gray-50" style={{ borderColor: "#e5e7eb" }}>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-widest">Member</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-widest">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-widest">Description</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-500 uppercase tracking-widest">Score</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-500 uppercase tracking-widest">Capital</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-500 uppercase tracking-widest">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map(c => (
                      <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#f3f4f6" }}>
                        <td className="px-4 py-3 font-semibold text-gray-800">{c.memberName}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: `${CONTRIBUTION_COLORS[c.contributionType]}15`, color: CONTRIBUTION_COLORS[c.contributionType] }}>
                            {c.contributionType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{c.description ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: "#22c55e" }}>{(c.valueScore ?? 0).toFixed(1)}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">
                          {(c.capitalAmount ?? 0) > 0 ? `£${(c.capitalAmount ?? 0).toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400">
                          {c.loggedAt ? new Date(c.loggedAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Cap Table ────────────────────────────────────────────────────── */}
        {activeTab === "captable" && (
          <CapTableTab ventures={ventures} allAllocations={allAllocations} />
        )}

        {/* ── TAB: Legal Conversion ─────────────────────────────────────────────── */}
        {activeTab === "legal" && (
          <LegalConversionTab ventures={ventures} showAddMilestone={showAddMilestone} setShowAddMilestone={setShowAddMilestone} milestoneForm={milestoneForm} setMilestoneForm={setMilestoneForm} />
        )}

      </div>

      {/* ── Add Allocation Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showAddAllocation} onOpenChange={setShowAddAllocation}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Equity Allocation</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2">
              <Label className="text-xs">Venture ID</Label>
              <Input className="mt-1" placeholder="e.g. ecoblend" value={allocForm.ventureId}
                onChange={e => setAllocForm(f => ({ ...f, ventureId: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Member Name</Label>
              <Input className="mt-1" placeholder="Full name" value={allocForm.memberName}
                onChange={e => setAllocForm(f => ({ ...f, memberName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={allocForm.memberRole} onValueChange={v => setAllocForm(f => ({ ...f, memberRole: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Founder","Co-Founder","Lead Engineer","VBS Mentor","Advisor","Operator","Investor"].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Equity % (legal)</Label>
              <Input type="number" className="mt-1" min={0} max={100} step={0.1} value={allocForm.equityPct}
                onChange={e => setAllocForm(f => ({ ...f, equityPct: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label className="text-xs">Vesting Months</Label>
              <Input type="number" className="mt-1" min={0} value={allocForm.vestingMonths}
                onChange={e => setAllocForm(f => ({ ...f, vestingMonths: parseInt(e.target.value) || 48 }))} />
            </div>
            <div>
              <Label className="text-xs">Cliff Months</Label>
              <Input type="number" className="mt-1" min={0} value={allocForm.cliffMonths}
                onChange={e => setAllocForm(f => ({ ...f, cliffMonths: parseInt(e.target.value) || 12 }))} />
            </div>
            <div>
              <Label className="text-xs">Months In</Label>
              <Input type="number" className="mt-1" min={0} value={allocForm.monthsIn}
                onChange={e => setAllocForm(f => ({ ...f, monthsIn: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label className="text-xs">Vesting Status</Label>
              <Select value={allocForm.vestingStatus} onValueChange={v => setAllocForm(f => ({ ...f, vestingStatus: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Not Started","Cliff","Vesting","Fully Vested"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Stipend (£/mo)</Label>
              <Input type="number" className="mt-1" min={0} value={allocForm.stipendMonthly}
                onChange={e => setAllocForm(f => ({ ...f, stipendMonthly: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label className="text-xs">Stipend Status</Label>
              <Select value={allocForm.stipendStatus} onValueChange={v => setAllocForm(f => ({ ...f, stipendStatus: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Active","Completed","Pending","Paused"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowAddAllocation(false)}>Cancel</Button>
            <Button className="flex-1 text-xs" style={{ background: "#1d4ed8" }}
              onClick={() => upsertAllocation.mutate({ ...allocForm, memberRole: allocForm.memberRole as any, vestingStatus: allocForm.vestingStatus as any, stipendStatus: allocForm.stipendStatus as any })}>
              Save Allocation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Log Contribution Dialog ───────────────────────────────────────────── */}
      <Dialog open={showLogContribution} onOpenChange={setShowLogContribution}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Contribution</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Team Member (Allocation)</Label>
              <Select value={contribForm.allocationId.toString()} onValueChange={v => {
                const alloc = allAllocations.find(a => a.id === parseInt(v));
                setContribForm(f => ({ ...f, allocationId: parseInt(v), memberName: alloc?.memberName ?? "", ventureId: alloc?.ventureId ?? "" }));
              }}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {allAllocations.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.memberName} ({a.ventureId})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Contribution Type</Label>
              <Select value={contribForm.contributionType} onValueChange={v => setContribForm(f => ({ ...f, contributionType: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Task Completion","Milestone Achieved","Capital Injection","Commercial Traction","VRL Progression","IP Filing","Team Building","Other"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea className="mt-1 text-xs" rows={2} value={contribForm.description}
                onChange={e => setContribForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Value Score (0–10)</Label>
                <Input type="number" className="mt-1" min={0} max={10} step={0.5} value={contribForm.valueScore}
                  onChange={e => setContribForm(f => ({ ...f, valueScore: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="text-xs">Capital Amount (£)</Label>
                <Input type="number" className="mt-1" min={0} value={contribForm.capitalAmount}
                  onChange={e => setContribForm(f => ({ ...f, capitalAmount: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowLogContribution(false)}>Cancel</Button>
            <Button className="flex-1 text-xs" style={{ background: "#22c55e" }}
              disabled={!contribForm.allocationId}
              onClick={() => logContribution.mutate({ ...contribForm, contributionType: contribForm.contributionType as any })}>
              Log Contribution
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ── Cap Table Tab (sub-component) ─────────────────────────────────────────────
function CapTableTab({ ventures, allAllocations }: { ventures: string[]; allAllocations: any[] }) {
  const [selectedVenture, setSelectedVenture] = useState(ventures[0] ?? "");
  const { data: snapshots = [], refetch } = trpc.equity.listCapTableSnapshots.useQuery(
    { ventureId: selectedVenture },
    { enabled: !!selectedVenture }
  );
  const takeSnapshot = trpc.equity.takeCapTableSnapshot.useMutation({
    onSuccess: () => { refetch(); toast.success("Cap table snapshot saved"); },
    onError: (e) => toast.error(e.message),
  });

  const currentMembers = allAllocations.filter(a => a.ventureId === selectedVenture);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Cap Table Evolution</h2>
        <div className="flex gap-2 items-center">
          <Select value={selectedVenture} onValueChange={setSelectedVenture}>
            <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Select venture" /></SelectTrigger>
            <SelectContent>
              {ventures.map(v => <SelectItem key={v} value={v}>{v.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => takeSnapshot.mutate({ ventureId: selectedVenture, triggerEvent: "Manual snapshot" })}
            className="gap-1.5 text-xs" style={{ background: "#1d4ed8" }}>
            <Camera size={13} /> Snapshot
          </Button>
        </div>
      </div>

      {/* Current cap table */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-sm font-bold text-gray-900 mb-4">Current Cap Table — {selectedVenture.toUpperCase()}</h3>
        {currentMembers.length === 0 ? (
          <p className="text-xs text-gray-400">No allocations for this venture.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                <th className="text-left py-2 font-semibold text-gray-500">Member</th>
                <th className="text-left py-2 font-semibold text-gray-500">Role</th>
                <th className="text-right py-2 font-semibold text-gray-500">Legal Equity</th>
                <th className="text-right py-2 font-semibold text-gray-500">Dynamic Score</th>
                <th className="text-right py-2 font-semibold text-gray-500">Dynamic %</th>
                <th className="text-right py-2 font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentMembers.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                  <td className="py-2 font-semibold text-gray-800">{m.memberName}</td>
                  <td className="py-2 text-gray-500">{m.memberRole}</td>
                  <td className="py-2 text-right font-mono font-bold text-blue-600">{(m.equityPct ?? 0).toFixed(1)}%</td>
                  <td className="py-2 text-right font-mono font-bold text-green-600">{(m.dynamicEquityScore ?? 0).toFixed(2)}</td>
                  <td className="py-2 text-right font-mono font-bold text-purple-600">{(m.dynamicEquityPct ?? 0).toFixed(2)}%</td>
                  <td className="py-2 text-right">
                    {m.legallyConverted
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">Converted</span>
                      : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Dynamic</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Snapshot history */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-sm font-bold text-gray-900 mb-4">Snapshot History</h3>
        {snapshots.length === 0 ? (
          <p className="text-xs text-gray-400">No snapshots yet. Click "Snapshot" to record the current cap table state.</p>
        ) : (
          <div className="space-y-3">
            {snapshots.map(snap => {
              let members: any[] = [];
              try { members = JSON.parse(snap.capTableJson); } catch { members = []; }
              return (
                <div key={snap.id} className="rounded-lg border p-4" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-gray-800">{snap.triggerEvent ?? "Snapshot"}</span>
                      <span className="text-xs text-gray-400 ml-2">{new Date(snap.snapshotDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>Total equity: <strong>{(snap.totalEquityAllocated ?? 0).toFixed(1)}%</strong></span>
                      <span>Avg score: <strong>{members.length > 0 ? (members.reduce((s: number, m: any) => s + (m.dynamicScore ?? 0), 0) / members.length).toFixed(2) : "0.00"}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {members.map((m: any, i: number) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {m.member}: {(m.equityPct ?? 0).toFixed(1)}%
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Legal Conversion Tab (sub-component) ──────────────────────────────────────
function LegalConversionTab({ ventures, showAddMilestone, setShowAddMilestone, milestoneForm, setMilestoneForm }: {
  ventures: string[];
  showAddMilestone: boolean;
  setShowAddMilestone: (v: boolean) => void;
  milestoneForm: any;
  setMilestoneForm: (fn: (f: any) => any) => void;
}) {
  const [selectedVenture, setSelectedVenture] = useState(ventures[0] ?? "");
  const { data: milestones = [], refetch } = trpc.equity.listMilestones.useQuery(
    { ventureId: selectedVenture },
    { enabled: !!selectedVenture }
  );
  const upsertMilestone = trpc.equity.upsertMilestone.useMutation({
    onSuccess: () => { refetch(); toast.success("Milestone saved"); setShowAddMilestone(false); },
    onError: (e) => toast.error(e.message),
  });
  const triggerConversion = trpc.equity.triggerLegalConversion.useMutation({
    onSuccess: (d) => { refetch(); toast.success(`Legal conversion triggered — ${d.membersConverted} members converted`); },
    onError: (e) => toast.error(e.message),
  });

  const MILESTONE_ICONS: Record<string, React.ReactNode> = {
    "Pending": <Clock size={14} />, "Active": <AlertCircle size={14} />,
    "Triggered": <Zap size={14} />, "Completed": <CheckCircle2 size={14} />,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Legal Conversion Milestones</h2>
        <div className="flex gap-2 items-center">
          <Select value={selectedVenture} onValueChange={setSelectedVenture}>
            <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Select venture" /></SelectTrigger>
            <SelectContent>
              {ventures.map(v => <SelectItem key={v} value={v}>{v.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setShowAddMilestone(true)} className="gap-1.5 text-xs" style={{ background: "#1d4ed8" }}>
            <Plus size={13} /> Add Milestone
          </Button>
        </div>
      </div>

      {/* Legal conversion principles */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
        <div className="flex items-start gap-3">
          <Scale size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-blue-800 mb-1">Dynamic → Legal Equity Conversion</div>
            <p className="text-xs text-blue-700 leading-relaxed">
              Dynamic equity is tracked internally and converts to legal equity at defined milestones. Per the EcoBlend legal framework, conversion points are: <strong>End of Validation (VRL 5)</strong>, <strong>Pre-Seed Funding</strong>, and <strong>Series A</strong>. Legal structures use share classes, option pools, and vesting agreements to reflect dynamic equity outcomes.
            </p>
          </div>
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <Scale size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-400">No milestones defined yet. Add conversion milestones to track the legal equity journey.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map(m => {
            const color = MILESTONE_COLORS[m.status ?? "Pending"];
            return (
              <div key={m.id} className="bg-white rounded-xl border shadow-sm p-5" style={{ borderLeft: `4px solid ${color}`, borderColor: "#e5e7eb", borderLeftColor: color }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color }}>{MILESTONE_ICONS[m.status ?? "Pending"]}</span>
                      <span className="text-sm font-bold text-gray-900">{m.milestoneName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${color}15`, color }}>
                        {m.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">{m.milestoneType}</span>
                    </div>
                    {m.description && <p className="text-xs text-gray-500 mb-2">{m.description}</p>}
                    <div className="flex gap-4 text-xs text-gray-400">
                      {m.triggerVrlLevel && <span>VRL Trigger: <strong className="text-gray-700">Level {m.triggerVrlLevel}</strong></span>}
                      {m.triggerRevenueGbp && <span>Revenue Trigger: <strong className="text-gray-700">£{m.triggerRevenueGbp.toLocaleString()}</strong></span>}
                      {m.triggeredAt && <span>Triggered: <strong className="text-gray-700">{new Date(m.triggeredAt).toLocaleDateString()}</strong></span>}
                    </div>
                    {m.legalStructure && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                        <strong>Legal structure:</strong> {m.legalStructure}
                      </div>
                    )}
                  </div>
                  {(m.status === "Active" || m.status === "Pending") && (
                    <Button size="sm" variant="outline" className="text-xs gap-1 ml-4 flex-shrink-0"
                      style={{ borderColor: color, color }}
                      onClick={() => triggerConversion.mutate({ milestoneId: m.id, ventureId: selectedVenture, notes: `${m.milestoneName} triggered` })}>
                      <Zap size={12} /> Trigger Conversion
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Milestone Dialog */}
      <Dialog open={showAddMilestone} onOpenChange={setShowAddMilestone}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Conversion Milestone</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Milestone Name</Label>
              <Input className="mt-1" placeholder="e.g. End of Validation (VRL 5)" value={milestoneForm.milestoneName}
                onChange={e => setMilestoneForm((f: any) => ({ ...f, milestoneName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Milestone Type</Label>
              <Select value={milestoneForm.milestoneType} onValueChange={v => setMilestoneForm((f: any) => ({ ...f, milestoneType: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["VRL Gate","Pre-Seed Funding","Seed Funding","Series A","Revenue Target","Custom"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Trigger VRL Level</Label>
                <Input type="number" className="mt-1" min={1} max={9} value={milestoneForm.triggerVrlLevel}
                  onChange={e => setMilestoneForm((f: any) => ({ ...f, triggerVrlLevel: parseInt(e.target.value) || 5 }))} />
              </div>
              <div>
                <Label className="text-xs">Trigger Revenue (£)</Label>
                <Input type="number" className="mt-1" min={0} placeholder="0"
                  onChange={e => setMilestoneForm((f: any) => ({ ...f, triggerRevenueGbp: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea className="mt-1 text-xs" rows={2} value={milestoneForm.description}
                onChange={e => setMilestoneForm((f: any) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Legal Structure Notes</Label>
              <Textarea className="mt-1 text-xs" rows={2} placeholder="Share classes, option pools, vesting terms..." value={milestoneForm.legalStructure}
                onChange={e => setMilestoneForm((f: any) => ({ ...f, legalStructure: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowAddMilestone(false)}>Cancel</Button>
            <Button className="flex-1 text-xs" style={{ background: "#1d4ed8" }}
              onClick={() => upsertMilestone.mutate({ ...milestoneForm, ventureId: selectedVenture, milestoneType: milestoneForm.milestoneType as any })}>
              Save Milestone
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
