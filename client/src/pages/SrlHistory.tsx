// ============================================================
// SRL ASSESSMENT HISTORY & AUDIT LOG — BEBUS-SRL-PIPE-001
// Assessment timeline · Dimension breakdown · Immutable audit trail
// Design: Precision Industrial — EcoBlend design system
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Leaf, History, Lock, Unlock, ShieldCheck,
  AlertTriangle, ChevronDown, ChevronRight, Search, FileText,
  CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus,
} from "lucide-react";

const SRL_LEVELS = [
  { level: 0, label: "Unassessed",  color: "#9ca3af", bg: "#f3f4f6" },
  { level: 1, label: "Emerging",    color: "#f59e0b", bg: "#fef3c7" },
  { level: 2, label: "Committed",   color: "#f97316", bg: "#ffedd5" },
  { level: 3, label: "Established", color: "#3b82f6", bg: "#dbeafe" },
  { level: 4, label: "Leading",     color: "#51AF37", bg: "#e8f7e3" },
  { level: 5, label: "Exemplary",   color: "#2d9856", bg: "#d1fae5" },
];

const DIM_COLORS: Record<string, string> = {
  ENV: "#51AF37", LCA: "#3A97D3", SMF: "#F49C13", SOC: "#8b5cf6", ESG: "#ec4899",
};

function getSrlLevel(level: number) { return SRL_LEVELS[level] ?? SRL_LEVELS[0]; }

function DeltaBadge({ delta }: { delta: number | null | undefined }) {
  if (delta === null || delta === undefined) return <span className="text-xs text-gray-300">—</span>;
  const d = Number(delta);
  if (d > 0) return <span className="flex items-center gap-0.5 text-xs font-semibold text-[#51AF37]"><TrendingUp size={11} />+{d.toFixed(1)}</span>;
  if (d < 0) return <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500"><TrendingDown size={11} />{d.toFixed(1)}</span>;
  return <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-400"><Minus size={11} />0.0</span>;
}

function AssessmentRow({ assessment }: { assessment: any }) {
  const [expanded, setExpanded] = useState(false);
  const lvl = getSrlLevel(assessment.srlLevel ?? 0);
  const score = Number(assessment.compositeScore ?? 0);
  const { data: detail, isLoading: detailLoading } = trpc.srl.getAssessmentDetail.useQuery(
    { assessmentId: assessment.id },
    { enabled: expanded }
  );
  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="px-4 py-3"><button className="text-gray-300 hover:text-gray-500">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button></td>
        <td className="px-4 py-3"><div className="text-xs font-mono text-gray-500">{assessment.id?.slice(0, 8)}…</div><div className="text-[10px] text-gray-300">{assessment.ventureId}</div></td>
        <td className="px-4 py-3"><div className="text-xs text-gray-600">{assessment.assessmentDate ? new Date(assessment.assessmentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div></td>
        <td className="px-4 py-3 text-center"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>SRL-{assessment.srlLevel ?? 0}</span></td>
        <td className="px-4 py-3 text-center"><span className="text-sm font-bold text-gray-900">{score.toFixed(1)}</span></td>
        <td className="px-4 py-3 text-center"><DeltaBadge delta={assessment.scoreDelta} /></td>
        <td className="px-4 py-3 text-center"><span className="text-xs font-mono text-gray-500">{assessment.gateRef ?? "—"}</span></td>
        <td className="px-4 py-3 text-center">
          {assessment.isLocked
            ? <div className="flex items-center justify-center gap-1"><Lock size={11} className="text-[#51AF37]" /><span className="text-xs text-[#51AF37] font-semibold">Locked</span></div>
            : <div className="flex items-center justify-center gap-1"><Unlock size={11} className="text-amber-500" /><span className="text-xs text-amber-500 font-semibold">Draft</span></div>}
        </td>
        <td className="px-4 py-3 text-center">
          {assessment.sustainabilityWatch
            ? <AlertTriangle size={13} className="text-red-500 mx-auto" />
            : <ShieldCheck size={13} className="text-[#51AF37] mx-auto" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/80">
          <td colSpan={9} className="px-6 py-4">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={12} className="animate-spin" /> Loading…</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dimension Scores</div>
                  <div className="space-y-2">
                    {(detail?.dimensionScores ?? []).map((ds: any) => {
                      const code = ds.srl_dimension_definitions?.dimensionCode ?? ds.srl_dimension_scores?.dimensionCode ?? "—";
                      const rawScore = Number(ds.srl_dimension_scores?.rawScore ?? 0);
                      const covScore = Number(ds.srl_dimension_scores?.weightedScore ?? 0);
                      const cov = Number(ds.srl_dimension_scores?.kpiCoveragePct ?? 0);
                      const gatePass = Boolean(ds.srl_dimension_scores?.gatePass);
                      const color = DIM_COLORS[code] ?? "#9ca3af";
                      return (
                        <div key={code} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <div className="w-10 text-xs font-bold" style={{ color }}>{code}</div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Raw: {rawScore.toFixed(1)} → Covered: {covScore.toFixed(1)}</span>
                              <span className="text-gray-400">Cov: {cov.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, covScore)}%`, background: color }} />
                            </div>
                          </div>
                          {gatePass ? <CheckCircle2 size={13} className="text-[#51AF37] flex-shrink-0" /> : <XCircle size={13} className="text-red-400 flex-shrink-0" />}
                        </div>
                      );
                    })}
                    {(detail?.dimensionScores ?? []).length === 0 && <div className="text-xs text-gray-400 py-2">No dimension scores recorded</div>}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Risk Conditions</div>
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                    <ShieldCheck size={13} className="text-[#51AF37]" />
                    <span className="text-xs text-gray-500">
                      {assessment.sustainabilityWatch ? "Sustainability Watch active — see Venture Detail for conditions" : "No risk conditions flagged"}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-400 space-y-1">
                    {assessment.trajectoryBonus != null && <div>Trajectory bonus: <span className="font-semibold text-gray-600">+{Number(assessment.trajectoryBonus).toFixed(2)}</span></div>}
                    {assessment.coverageFactor != null && <div>Coverage factor: <span className="font-semibold text-gray-600">{Number(assessment.coverageFactor).toFixed(3)}</span></div>}
                    {assessment.payloadHash && <div className="truncate">Hash: <span className="font-mono text-gray-600">{assessment.payloadHash.slice(0, 24)}…</span></div>}
                  </div>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function AuditRow({ entry }: { entry: any }) {
  const actionColors: Record<string, string> = {
    ASSESSMENT_CREATED: "bg-blue-50 text-blue-700", ASSESSMENT_LOCKED: "bg-[#e8f7e3] text-[#2d9856]",
    KPI_SUBMITTED: "bg-gray-50 text-gray-600", REPORT_GENERATED: "bg-purple-50 text-purple-700",
    GATE_EVALUATED: "bg-amber-50 text-amber-700", WATCH_FLAGGED: "bg-red-50 text-red-700",
    WATCH_CLEARED: "bg-green-50 text-green-700", IRL_MODULATED: "bg-orange-50 text-orange-700",
  };
  const cls = actionColors[entry.action] ?? "bg-gray-50 text-gray-600";
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3"><div className="text-xs text-gray-600">{entry.eventTimestamp ? new Date(entry.eventTimestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</div></td>
      <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{entry.action}</span></td>
      <td className="px-4 py-3"><div className="text-xs text-gray-600">{entry.ventureId ?? "—"}</div></td>
      <td className="px-4 py-3"><div className="text-xs font-mono text-gray-400">{entry.actorId ?? "—"}</div></td>
      <td className="px-4 py-3"><div className="text-xs font-mono text-gray-400 truncate max-w-[120px]">{entry.referenceId ?? "—"}</div></td>
      <td className="px-4 py-3"><div className="text-xs text-gray-400 truncate max-w-[200px]">{entry.notes ?? "—"}</div></td>
    </tr>
  );
}

export default function SrlHistory() {
  const [ventureFilter, setVentureFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"assessments" | "audit">("assessments");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: assessments, isLoading: assessLoading } = trpc.srl.getAssessmentHistory.useQuery(
    { ventureId: ventureFilter || undefined, limit: PAGE_SIZE + 1, offset: page * PAGE_SIZE },
    { refetchInterval: 30_000 }
  );
  const { data: auditLog, isLoading: auditLoading } = trpc.srl.getAuditLog.useQuery(
    { ventureId: ventureFilter || undefined, limit: PAGE_SIZE + 1, offset: page * PAGE_SIZE },
    { enabled: activeTab === "audit", refetchInterval: 30_000 }
  );

  const hasNextPage = activeTab === "assessments" ? (assessments?.length ?? 0) > PAGE_SIZE : (auditLog?.length ?? 0) > PAGE_SIZE;
  const displayedAssessments = (assessments ?? []).slice(0, PAGE_SIZE);
  const displayedAudit = (auditLog ?? []).slice(0, PAGE_SIZE);

  const stats = useMemo(() => {
    const all = displayedAssessments;
    return {
      total: all.length,
      locked: all.filter(a => a.isLocked).length,
      watchActive: all.filter(a => a.sustainabilityWatch).length,
      avgScore: all.length > 0 ? all.reduce((s, a) => s + Number(a.compositeScore ?? 0), 0) / all.length : 0,
    };
  }, [displayedAssessments]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Leaf size={16} className="text-[#51AF37]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#51AF37]">SRL Module</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400 font-mono">Assessment History & Audit Log</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Assessment History</h1>
            <p className="text-sm text-gray-500 mt-0.5">Immutable record of all SRL assessments and system events</p>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <Input placeholder="Filter by venture ID…" value={ventureFilter} onChange={e => { setVentureFilter(e.target.value); setPage(0); }} className="pl-8 text-xs w-52" />
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Assessments", value: stats.total, color: "text-gray-900" },
            { label: "Locked", value: stats.locked, color: "text-[#51AF37]" },
            { label: "Watch Flags", value: stats.watchActive, color: "text-red-500" },
            { label: "Avg Score", value: stats.avgScore.toFixed(1), color: "text-[#3A97D3]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color}`} style={{ fontFamily: "'Prompt', sans-serif" }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-5">
          {(["assessments", "audit"] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setPage(0); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {tab === "assessments" ? <><History size={12} /> Assessment Log</> : <><FileText size={12} /> Audit Trail</>}
            </button>
          ))}
        </div>

        {activeTab === "assessments" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {assessLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[#51AF37]" /></div>
            ) : displayedAssessments.length === 0 ? (
              <div className="text-center py-16"><History size={32} className="text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">No assessments found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      <th className="w-8 px-4 py-3" />
                      {["ID", "Date", "SRL Level", "Score", "Δ", "Gate", "Status", "Watch"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{displayedAssessments.map(a => <AssessmentRow key={a.id} assessment={a} />)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "audit" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {auditLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[#51AF37]" /></div>
            ) : displayedAudit.length === 0 ? (
              <div className="text-center py-16"><FileText size={32} className="text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">No audit events recorded yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      {["Timestamp", "Action", "Venture", "Actor", "Reference", "Notes"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{displayedAudit.map((entry: any, i: number) => <AuditRow key={i} entry={entry} />)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-gray-400">
            Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + (activeTab === "assessments" ? displayedAssessments.length : displayedAudit.length)} records
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
            <span className="text-xs text-gray-400">Page {page + 1}</span>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setPage(p => p + 1)} disabled={!hasNextPage}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
