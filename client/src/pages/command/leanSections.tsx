// ============================================================================
// COMMAND CENTRE — Lean OS aggregate sections (portfolio-wide, read-first)
// Reused as tabs inside Portfolio Overview, Command Centre and Pipeline.
// ============================================================================
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import {
  StatTile, ScoreBar, StageBadge, VentureStatusBadge, DecisionBadge, RiskBadge,
  ExperimentStatusBadge, NextBestActionPanel, EmptyState, SectionHead,
  SeverityBadge, AlertStatusBadge, toneForHealth, type Tone,
} from "@/components/command/primitives";
import { humanise, STAGE_LABELS } from "@shared/commandCentre";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { AlertTriangle, FlaskConical, TrendingUp, Activity, Layers, ArrowUpDown, GitFork, ClipboardCheck, FilePlus2, Settings2, Beaker, FileCheck2, Target, ShieldAlert } from "lucide-react";
import {
  ExperimentManageModal, EvidenceFromExperimentModal, DecisionActionModal, PivotModal,
  ExperimentSpawnModal, StageGateReviewModal,
} from "./leanActions";

const DECISION_COLUMNS: { key: string; label: string; tone: Tone }[] = [
  { key: "evidence_needed", label: "Evidence Needed", tone: "amber" },
  { key: "continue_testing", label: "Continue Testing", tone: "blue" },
  { key: "ready_to_advance", label: "Ready to Advance", tone: "green" },
  { key: "pivot_recommended", label: "Pivot Recommended", tone: "red" },
  { key: "pause_recommended", label: "Pause Recommended", tone: "amber" },
  { key: "kill_recommended", label: "Kill / Major Pivot", tone: "red" },
];

const EXPERIMENT_COLUMNS = ["proposed", "approved", "running", "blocked", "overdue", "completed"];

function Loading() { return <div className="text-sm text-gray-400 py-10 text-center">Loading…</div>; }

// ─── 1. Lean Portfolio ─────────────────────────────────────────────────────────
type SortKey = "name" | "stage" | "status" | "evidenceConfidence" | "marketValidation" | "commercialValidation" | "technicalValidation" | "operationalReadiness" | "riskScore" | "portfolioHealth" | "riskAdjustedReadiness";

export function LeanPortfolio() {
  const [, navigate] = useLocation();
  const { setSelectedVentureId } = useSelectedVenture();
  const q = trpc.commandCentreLean.portfolioSummary.useQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("portfolioHealth");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rawRows = q.data?.rows ?? [];
  const view = useMemo(() => {
    let r = rawRows.filter((row) =>
      (!search || row.name.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === "all" || row.status === statusFilter) &&
      (decisionFilter === "all" || row.recommendation === decisionFilter));
    r = [...r].sort((a, b) => {
      const av = a[sortKey] ?? "", bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [rawRows, search, statusFilter, decisionFilter, sortKey, sortDir]);

  if (q.isLoading) return <Loading />;
  const data = q.data;
  if (!data || data.rows.length === 0) return <EmptyState title="No ventures yet" description="Seed or create ventures to populate the Lean portfolio." />;
  const { stats } = data;

  const statusOptions = Array.from(new Set(rawRows.map((r) => r.status).filter(Boolean))) as string[];
  const decisionOptions = Array.from(new Set(rawRows.map((r) => r.recommendation).filter(Boolean))) as string[];
  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  }
  function SortableTh({ k, label, className }: { k: SortKey; label: string; className?: string }) {
    return (
      <th className={`px-4 py-2.5 font-semibold cursor-pointer select-none hover:text-gray-700 ${className ?? ""}`} onClick={() => toggleSort(k)} data-testid={`sort-${k}`}>
        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown size={11} className={sortKey === k ? "text-gray-700" : "text-gray-300"} /></span>
      </th>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHead title="Lean Portfolio Health" description="Evidence-weighted health and the recommended Lean decision for every venture." />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatTile label="Ventures" value={stats.total} icon={<Layers size={18} />} />
        <StatTile label="Avg Health" value={stats.avgHealth} tone={toneForHealth(stats.avgHealth)} icon={<Activity size={18} />} />
        <StatTile label="Need Decision" value={stats.pivotDecision} tone={stats.pivotDecision ? "red" : "green"} icon={<AlertTriangle size={18} />} />
        <StatTile label="Stage-Gate Ready" value={stats.readyForStageGate} tone={stats.readyForStageGate ? "green" : "grey"} icon={<TrendingUp size={18} />} />
        <StatTile label="Overdue Exp." value={stats.overdueExperiments} tone={stats.overdueExperiments ? "amber" : "green"} icon={<FlaskConical size={18} />} />
        <StatTile label="Critical Alerts" value={stats.criticalAlerts} tone={stats.criticalAlerts ? "red" : "green"} icon={<AlertTriangle size={18} />} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ventures…" className="h-9 w-48 text-sm" data-testid="input-portfolio-search" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-40 text-sm" data-testid="select-status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map((s) => <SelectItem key={s} value={s}>{humanise(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={decisionFilter} onValueChange={setDecisionFilter}>
          <SelectTrigger className="h-9 w-48 text-sm" data-testid="select-decision-filter"><SelectValue placeholder="Decision" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All decisions</SelectItem>
            {decisionOptions.map((s) => <SelectItem key={s} value={s}>{humanise(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-400 ml-auto">{view.length} of {rawRows.length}</span>
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                <SortableTh k="name" label="Venture" />
                <SortableTh k="stage" label="Stage" />
                <SortableTh k="status" label="Status" />
                <SortableTh k="evidenceConfidence" label="Evidence" className="text-center" />
                <SortableTh k="marketValidation" label="Market" className="text-center" />
                <SortableTh k="commercialValidation" label="Commercial" className="text-center" />
                <SortableTh k="technicalValidation" label="Technical" className="text-center" />
                <SortableTh k="operationalReadiness" label="Operational" className="text-center" />
                <SortableTh k="riskScore" label="Risk" className="text-center" />
                <SortableTh k="portfolioHealth" label="Health" className="text-center" />
                <SortableTh k="riskAdjustedReadiness" label="Readiness" className="text-center" />
                <th className="px-4 py-2.5 font-semibold">Decision</th>
                <th className="px-4 py-2.5 font-semibold">Next Action</th>
              </tr>
            </thead>
            <tbody>
              {view.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-8 text-center text-sm text-gray-400">No ventures match the current filters.</td></tr>
              )}
              {view.map((r) => (
                <tr key={r.ventureId} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedVentureId(r.ventureId); navigate(`/venture-status?ventureId=${r.ventureId}`); }} data-testid={`row-portfolio-${r.ventureId}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                      <span className="font-semibold text-gray-800">{r.name}</span>
                    </div>
                    {r.ventureType && <div className="text-[11px] text-gray-400 mt-0.5">{r.ventureType}</div>}
                  </td>
                  <td className="px-4 py-2.5"><StageBadge stage={r.stage} /></td>
                  <td className="px-4 py-2.5"><VentureStatusBadge status={r.status} /></td>
                  <td className="px-4 py-2.5 text-center font-bold text-gray-700">{r.evidenceConfidence}</td>
                  <td className="px-4 py-2.5 text-center font-semibold" style={{ color: toneFg(toneForHealth(r.marketValidation)) }}>{r.marketValidation}</td>
                  <td className="px-4 py-2.5 text-center font-semibold" style={{ color: toneFg(toneForHealth(r.commercialValidation)) }}>{r.commercialValidation}</td>
                  <td className="px-4 py-2.5 text-center font-semibold" style={{ color: toneFg(toneForHealth(r.technicalValidation)) }}>{r.technicalValidation}</td>
                  <td className="px-4 py-2.5 text-center font-semibold" style={{ color: toneFg(toneForHealth(r.operationalReadiness)) }}>{r.operationalReadiness}</td>
                  <td className="px-4 py-2.5 text-center"><RiskBadge score={r.riskScore} /></td>
                  <td className="px-4 py-2.5 text-center font-bold" style={{ color: toneFg(toneForHealth(r.portfolioHealth)) }}>{r.portfolioHealth}</td>
                  <td className="px-4 py-2.5 text-center font-bold text-gray-700">{r.riskAdjustedReadiness}</td>
                  <td className="px-4 py-2.5"><DecisionBadge decision={r.recommendation} label={r.decisionLabel} /></td>
                  <td className="px-4 py-2.5 text-[11px] text-gray-600 max-w-[220px]">{r.nextBestAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── 2. Lean Decision Board ────────────────────────────────────────────────────
export function LeanDecisionBoard() {
  const utils = trpc.useUtils();
  const q = trpc.commandCentreLean.decisionBoard.useQuery();
  const cards = q.data ?? [];
  const [decisionCard, setDecisionCard] = useState<any>(null);
  const [pivotCard, setPivotCard] = useState<any>(null);
  const [experimentCard, setExperimentCard] = useState<any>(null);
  const [reviewCard, setReviewCard] = useState<any>(null);
  const grouped = useMemo(() => {
    const m: Record<string, typeof cards> = {};
    for (const c of cards) (m[c.column] ??= []).push(c);
    return m;
  }, [cards]);
  const refresh = () => {
    utils.commandCentreLean.decisionBoard.invalidate();
    utils.commandCentreLean.portfolioSummary.invalidate();
    utils.commandCentreLean.experimentQueue.invalidate();
    utils.commandCentreLean.stageGateBoard.invalidate();
    utils.commandCentreLean.ventureStatus.invalidate();
    utils.commandCentreLean.alerts.list.invalidate();
    utils.commandCentreLean.pivots.list.invalidate();
  };
  if (q.isLoading) return <Loading />;
  if (!cards.length) return <EmptyState title="No ventures to triage" description="Seed ventures to populate the decision board." />;

  return (
    <div className="space-y-5">
      <SectionHead title="Lean Decision Board" description="Every venture sorted into the recommended Lean decision lane — approve, reject or pivot from each card." />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DECISION_COLUMNS.map((col) => {
          const items = grouped[col.key] ?? [];
          const t = toneStyle(col.tone);
          return (
            <div key={col.key} className="rounded-xl border bg-gray-50/60 p-3" style={{ borderColor: t.border }}>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.fg }}>{col.label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: t.fg, background: t.bg }}>{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.length === 0 && <p className="text-xs text-gray-400 px-1 py-3">None</p>}
                {items.map((c) => (
                  <Card key={c.ventureId} className="border shadow-sm" data-testid={`decision-card-${c.ventureId}`}>
                    <CardContent className="p-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        <span className="font-semibold text-sm text-gray-800">{c.name}</span>
                        <span className="ml-auto"><DecisionBadge decision={c.recommendation} label={c.decisionLabel} /></span>
                      </div>
                      {c.currentHypothesis && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{c.currentHypothesis}</p>}
                      <p className="text-xs text-gray-600 mb-2">{c.rationale}</p>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-500 mb-2">
                        <div>Evidence <span className="font-bold text-gray-700">{c.evidenceConfidence}</span></div>
                        <div>Risk <span className="font-bold text-gray-700">{c.riskScore}</span></div>
                        <div>WTP <span className="font-bold text-gray-700">{c.wtpScore}</span></div>
                      </div>
                      <div className="text-[11px] text-gray-500 border-t pt-2 mb-2.5">
                        <span className="font-semibold">Next:</span> {c.nextBestAction}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setDecisionCard(c)} data-testid={`button-decide-${c.ventureId}`}>
                          <ClipboardCheck size={12} className="mr-1" />Decide
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setPivotCard(c)} data-testid={`button-pivot-${c.ventureId}`}>
                          <GitFork size={12} className="mr-1" />Pivot
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setExperimentCard(c)} data-testid={`button-spawn-experiment-${c.ventureId}`}>
                          <Beaker size={12} className="mr-1" />Experiment
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setReviewCard(c)} data-testid={`button-stage-gate-${c.ventureId}`}>
                          <FileCheck2 size={12} className="mr-1" />Stage-gate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {decisionCard && <DecisionActionModal open={!!decisionCard} onOpenChange={(o) => !o && setDecisionCard(null)} card={decisionCard} onSaved={refresh} />}
      {pivotCard && <PivotModal open={!!pivotCard} onOpenChange={(o) => !o && setPivotCard(null)} card={pivotCard} onSaved={refresh} />}
      {experimentCard && <ExperimentSpawnModal open={!!experimentCard} onOpenChange={(o) => !o && setExperimentCard(null)} card={experimentCard} onSaved={refresh} />}
      {reviewCard && <StageGateReviewModal open={!!reviewCard} onOpenChange={(o) => !o && setReviewCard(null)} card={reviewCard} onSaved={refresh} />}
    </div>
  );
}

// ─── 3. Experiment Queue ───────────────────────────────────────────────────────
export function ExperimentQueue() {
  const utils = trpc.useUtils();
  const q = trpc.commandCentreLean.experimentQueue.useQuery();
  const [manage, setManage] = useState<any>(null);
  const [evidenceFor, setEvidenceFor] = useState<any>(null);
  const refresh = () => {
    utils.commandCentreLean.experimentQueue.invalidate();
    utils.commandCentreLean.evidenceDashboard.invalidate();
    utils.commandCentreLean.decisionBoard.invalidate();
    utils.commandCentreLean.portfolioSummary.invalidate();
    utils.commandCentreLean.alerts.list.invalidate();
  };
  if (q.isLoading) return <Loading />;
  const all = (q.data ?? []) as any[];
  if (!all.length) return <EmptyState title="No experiments" description="Experiments proposed across ventures will appear here as a kanban." />;
  const grouped: Record<string, any[]> = {};
  for (const e of all) (grouped[e.effectiveStatus] ??= []).push(e);

  return (
    <div className="space-y-5">
      <SectionHead title="Experiment Queue" description="Move experiments through the pipeline, capture results & learning, and turn completed experiments into evidence." />
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {EXPERIMENT_COLUMNS.map((col) => {
          const items = grouped[col] ?? [];
          return (
            <div key={col} className="rounded-xl border bg-gray-50/60 p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{humanise(col)}</span>
                <span className="text-xs font-bold text-gray-400">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.length === 0 && <p className="text-xs text-gray-300 px-1 py-2">—</p>}
                {items.map((e) => (
                  <Card key={e.id} className="border shadow-sm" data-testid={`experiment-card-${e.id}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: e.ventureColor }} />
                        <span className="text-[11px] font-semibold text-gray-500">{e.ventureName}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-800 leading-snug mb-1.5">{e.experimentName}</p>
                      <div className="flex items-center justify-between mb-2">
                        <ExperimentStatusBadge status={e.effectiveStatus} />
                        {e.dueDate && <span className="text-[10px] text-gray-400">{e.dueDate}</span>}
                      </div>
                      {e.experimentOwner && <div className="text-[10px] text-gray-400 mb-2">{e.experimentOwner}</div>}
                      <div className="flex items-center gap-1.5 border-t pt-2">
                        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] flex-1" onClick={() => setManage(e)} data-testid={`button-manage-experiment-${e.id}`}>
                          <Settings2 size={11} className="mr-1" />Manage
                        </Button>
                        {e.experimentStatus === "completed" && (
                          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] flex-1" onClick={() => setEvidenceFor(e)} data-testid={`button-evidence-from-${e.id}`}>
                            <FilePlus2 size={11} className="mr-1" />Evidence
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {manage && <ExperimentManageModal open={!!manage} onOpenChange={(o) => !o && setManage(null)} experiment={manage} onSaved={refresh} />}
      {evidenceFor && <EvidenceFromExperimentModal open={!!evidenceFor} onOpenChange={(o) => !o && setEvidenceFor(null)} experiment={evidenceFor} onSaved={refresh} />}
    </div>
  );
}

// ─── 4. Evidence Confidence Dashboard ──────────────────────────────────────────
export function EvidenceDashboard() {
  const q = trpc.commandCentreLean.evidenceDashboard.useQuery({});
  if (q.isLoading) return <Loading />;
  const rows = q.data ?? [];
  if (!rows.length) return <EmptyState title="No evidence captured" description="Evidence records across ventures power confidence scoring." />;

  return (
    <div className="space-y-5">
      <SectionHead title="Evidence Confidence" description="Venture-level evidence confidence with supporting vs contradicting balance and gaps." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map((r) => (
          <Card key={r.ventureId} className="border shadow-sm" data-testid={`evidence-card-${r.ventureId}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                  <span className="font-semibold text-gray-800">{r.name}</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: toneFg(toneForHealth(r.evidenceConfidence)) }}>{r.evidenceConfidence}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span className="text-green-700 font-semibold">{r.supportingCount} supporting</span>
                <span className="text-red-700 font-semibold">{r.contradictingCount} contradicting</span>
                <span className="ml-auto">{r.supportingRatio}% supporting</span>
              </div>
              {r.byModule.length > 0 && (
                <div className="space-y-2 mb-3">
                  {r.byModule.map((m) => <ScoreBar key={m.module} label={`${humanise(m.module)} (${m.count})`} score={m.score} tone={toneForHealth(m.score)} />)}
                </div>
              )}
              {r.missingEvidence.length > 0 && (
                <div className="border-t pt-2.5 mt-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Evidence gaps</div>
                  <ul className="space-y-1">
                    {r.missingEvidence.map((m, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600"><AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-500" />{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── 5. Founder Cockpit ────────────────────────────────────────────────────────
export function FounderCockpit() {
  const [, navigate] = useLocation();
  const { setSelectedVentureId } = useSelectedVenture();
  const status = trpc.commandCentreLean.ventureStatus.useQuery({});
  const portfolio = trpc.commandCentreLean.portfolioSummary.useQuery();
  const alertsQ = trpc.commandCentreLean.alerts.list.useQuery({});

  if (status.isLoading || portfolio.isLoading) return <Loading />;
  const rows = status.data ?? [];
  const stats = portfolio.data?.stats;
  if (!rows.length || !stats) return <EmptyState title="No ventures yet" description="Seed ventures to populate the founder cockpit." />;

  const alerts = (alertsQ.data ?? []) as any[];
  const activeAlerts = alerts.filter((a) => a.status !== "resolved" && a.status !== "dismissed");

  return (
    <div className="space-y-6">
      <SectionHead title="Founder Cockpit" description="A single founder-level pane: portfolio vitals, validation progress and the ventures that need your attention now." />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile label="Ventures" value={stats.total} icon={<Layers size={18} />} />
        <StatTile label="Avg Health" value={stats.avgHealth} tone={toneForHealth(stats.avgHealth)} icon={<Activity size={18} />} />
        <StatTile label="Need Decision" value={stats.pivotDecision} tone={stats.pivotDecision ? "red" : "green"} icon={<Target size={18} />} />
        <StatTile label="Stage-Gate Ready" value={stats.readyForStageGate} tone={stats.readyForStageGate ? "green" : "grey"} icon={<TrendingUp size={18} />} />
        <StatTile label="Overdue Exp." value={stats.overdueExperiments} tone={stats.overdueExperiments ? "amber" : "green"} icon={<FlaskConical size={18} />} />
        <StatTile label="Critical Alerts" value={stats.criticalAlerts} tone={stats.criticalAlerts ? "red" : "green"} icon={<ShieldAlert size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map((r) => (
          <Card key={r.ventureId} className="border shadow-sm cursor-pointer hover:border-gray-300" onClick={() => { setSelectedVentureId(r.ventureId); navigate(`/venture-status?ventureId=${r.ventureId}`); }} data-testid={`cockpit-card-${r.ventureId}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                  <span className="font-semibold text-gray-800">{r.name}</span>
                  <StageBadge stage={r.stage} />
                  <VentureStatusBadge status={r.status} />
                </div>
                <DecisionBadge decision={r.recommendation} label={r.decisionLabel} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <ScoreBar label="Market" score={r.marketValidation} tone={toneForHealth(r.marketValidation)} />
                <ScoreBar label="Commercial" score={r.commercialValidation} tone={toneForHealth(r.commercialValidation)} />
                <ScoreBar label="Technical" score={r.technicalValidation} tone={toneForHealth(r.technicalValidation)} />
                <ScoreBar label="Operational" score={r.operationalReadiness} tone={toneForHealth(r.operationalReadiness)} />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-500 border-t pt-2.5">
                <span>Evidence <b className="text-gray-700">{r.evidenceConfidence}</b></span>
                <span>Readiness <b className="text-gray-700">{r.riskAdjustedReadiness}</b></span>
                <RiskBadge score={r.riskScore} />
                {r.ready && <span className="ml-auto text-green-700 font-semibold inline-flex items-center gap-1"><TrendingUp size={11} />Stage-gate ready</span>}
              </div>
              {r.requiredActions.length > 0 && (
                <div className="border-t pt-2.5 mt-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Before next gate</div>
                  <ul className="space-y-1">
                    {r.requiredActions.slice(0, 3).map((a, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600"><AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-500" />{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {activeAlerts.length > 0 && (
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3 inline-flex items-center gap-2"><ShieldAlert size={15} className="text-red-500" />Active alerts</div>
            <ul className="space-y-2">
              {activeAlerts.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-xs text-gray-600" data-testid={`cockpit-alert-${a.id}`}>
                  <SeverityBadge severity={a.severity} />
                  <span className="font-medium text-gray-800">{a.alertTitle}</span>
                  <span className="text-gray-400 truncate">{a.alertDescription}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── 6. Decision Queue ─────────────────────────────────────────────────────────
export function DecisionQueue() {
  const utils = trpc.useUtils();
  const board = trpc.commandCentreLean.decisionBoard.useQuery();
  const alertsQ = trpc.commandCentreLean.alerts.list.useQuery({});
  const [decisionCard, setDecisionCard] = useState<any>(null);

  const setAlertStatus = trpc.commandCentreLean.alerts.setStatus.useMutation({
    onSuccess: () => { utils.commandCentreLean.alerts.list.invalidate(); utils.commandCentreLean.portfolioSummary.invalidate(); },
  });
  const refresh = () => {
    utils.commandCentreLean.decisionBoard.invalidate();
    utils.commandCentreLean.portfolioSummary.invalidate();
    utils.commandCentreLean.alerts.list.invalidate();
  };

  if (board.isLoading || alertsQ.isLoading) return <Loading />;
  const cards = (board.data ?? []) as any[];
  const alerts = (alertsQ.data ?? []) as any[];

  const SEV_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const actionAlerts = alerts
    .filter((a) => a.status !== "resolved" && a.status !== "dismissed")
    .sort((a, b) => (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9));

  const REC_RANK: Record<string, number> = { kill: 0, pivot: 1, advance: 2, pause: 3, continue: 4 };
  const decisionsNeeded = cards
    .filter((c) => ["pivot", "kill", "advance", "pause"].includes(c.recommendation))
    .sort((a, b) => (REC_RANK[a.recommendation] ?? 9) - (REC_RANK[b.recommendation] ?? 9));

  if (!actionAlerts.length && !decisionsNeeded.length)
    return <EmptyState title="Queue is clear" description="No alerts or pending decisions need founder attention right now." />;

  return (
    <div className="space-y-6">
      <SectionHead title="Decision Queue" description="The prioritised list of decisions and alerts awaiting a founder call — highest urgency first." />

      {decisionsNeeded.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Decisions needed ({decisionsNeeded.length})</div>
          {decisionsNeeded.map((c) => (
            <Card key={c.ventureId} className="border shadow-sm" data-testid={`queue-decision-${c.ventureId}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-800">{c.name}</span>
                    <StageBadge stage={c.stage} />
                    <DecisionBadge decision={c.recommendation} label={c.decisionLabel} />
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{c.rationale}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5"><span className="font-semibold">Next:</span> {c.nextBestAction}</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={() => setDecisionCard(c)} data-testid={`queue-decide-${c.ventureId}`}>
                  <ClipboardCheck size={13} className="mr-1" />Decide
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {actionAlerts.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Alerts to action ({actionAlerts.length})</div>
          {actionAlerts.map((a) => (
            <Card key={a.id} className="border shadow-sm" data-testid={`queue-alert-${a.id}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <SeverityBadge severity={a.severity} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-800">{a.alertTitle}</span>
                    <AlertStatusBadge status={a.status} />
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{a.alertDescription}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {a.status !== "acknowledged" && (
                    <Button size="sm" variant="ghost" className="h-8 text-xs" disabled={setAlertStatus.isPending}
                      onClick={() => setAlertStatus.mutate({ id: a.id, status: "acknowledged" })} data-testid={`queue-ack-${a.id}`}>
                      Acknowledge
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8 text-xs" disabled={setAlertStatus.isPending}
                    onClick={() => setAlertStatus.mutate({ id: a.id, status: "resolved" })} data-testid={`queue-resolve-${a.id}`}>
                    Resolve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {decisionCard && <DecisionActionModal open={!!decisionCard} onOpenChange={(o) => !o && setDecisionCard(null)} card={decisionCard} onSaved={refresh} />}
    </div>
  );
}

// ─── tone helpers ──────────────────────────────────────────────────────────────
const TONE_MAP: Record<Tone, { fg: string; bg: string; border: string }> = {
  green: { fg: "#15803d", bg: "rgba(86,168,55,0.10)", border: "rgba(86,168,55,0.35)" },
  amber: { fg: "#b45309", bg: "rgba(246,145,17,0.10)", border: "rgba(246,145,17,0.35)" },
  red: { fg: "#b91c1c", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.35)" },
  blue: { fg: "#1d4ed8", bg: "rgba(59,133,186,0.10)", border: "rgba(59,133,186,0.35)" },
  grey: { fg: "#4b5563", bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.30)" },
};
function toneStyle(t: Tone) { return TONE_MAP[t]; }
function toneFg(t: Tone) { return TONE_MAP[t].fg; }
