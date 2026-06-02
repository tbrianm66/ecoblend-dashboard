// ============================================================================
// COMMAND CENTRE — Lean OS aggregate sections (portfolio-wide, read-first)
// Reused as tabs inside Portfolio Overview, Command Centre and Pipeline.
// ============================================================================
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import {
  StatTile, ScoreBar, StageBadge, VentureStatusBadge, DecisionBadge, RiskBadge,
  ExperimentStatusBadge, NextBestActionPanel, EmptyState, SectionHead,
  toneForHealth, type Tone,
} from "@/components/command/primitives";
import { humanise, STAGE_LABELS } from "@shared/commandCentre";
import { AlertTriangle, FlaskConical, TrendingUp, Activity, Layers } from "lucide-react";

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
export function LeanPortfolio() {
  const [, navigate] = useLocation();
  const q = trpc.commandCentreLean.portfolioSummary.useQuery();
  if (q.isLoading) return <Loading />;
  const data = q.data;
  if (!data || data.rows.length === 0) return <EmptyState title="No ventures yet" description="Seed or create ventures to populate the Lean portfolio." />;
  const { rows, stats } = data;

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

      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                <th className="px-4 py-2.5 font-semibold">Venture</th>
                <th className="px-4 py-2.5 font-semibold">Stage</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold text-center">Evidence</th>
                <th className="px-4 py-2.5 font-semibold text-center">Risk</th>
                <th className="px-4 py-2.5 font-semibold text-center">Health</th>
                <th className="px-4 py-2.5 font-semibold text-center">Readiness</th>
                <th className="px-4 py-2.5 font-semibold">Decision</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ventureId} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/venture-status?ventureId=${r.ventureId}`)} data-testid={`row-portfolio-${r.ventureId}`}>
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
                  <td className="px-4 py-2.5 text-center"><RiskBadge score={r.riskScore} /></td>
                  <td className="px-4 py-2.5 text-center font-bold" style={{ color: toneFg(toneForHealth(r.portfolioHealth)) }}>{r.portfolioHealth}</td>
                  <td className="px-4 py-2.5 text-center font-bold text-gray-700">{r.riskAdjustedReadiness}</td>
                  <td className="px-4 py-2.5"><DecisionBadge decision={r.recommendation} label={r.decisionLabel} /></td>
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
  const q = trpc.commandCentreLean.decisionBoard.useQuery();
  if (q.isLoading) return <Loading />;
  const cards = q.data ?? [];
  if (!cards.length) return <EmptyState title="No ventures to triage" description="Seed ventures to populate the decision board." />;
  const grouped = useMemo(() => {
    const m: Record<string, typeof cards> = {};
    for (const c of cards) (m[c.column] ??= []).push(c);
    return m;
  }, [cards]);

  return (
    <div className="space-y-5">
      <SectionHead title="Lean Decision Board" description="Every venture sorted into the recommended Lean decision lane, driven by evidence and risk." />
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
                      <div className="text-[11px] text-gray-500 border-t pt-2">
                        <span className="font-semibold">Next:</span> {c.nextBestAction}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 3. Experiment Queue ───────────────────────────────────────────────────────
export function ExperimentQueue() {
  const q = trpc.commandCentreLean.experimentQueue.useQuery();
  if (q.isLoading) return <Loading />;
  const all = (q.data ?? []) as any[];
  if (!all.length) return <EmptyState title="No experiments" description="Experiments proposed across ventures will appear here as a kanban." />;
  const grouped: Record<string, any[]> = {};
  for (const e of all) (grouped[e.effectiveStatus] ??= []).push(e);

  return (
    <div className="space-y-5">
      <SectionHead title="Experiment Queue" description="Every venture's experiments by status — proposed, running, blocked, overdue or completed." />
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
                      <div className="flex items-center justify-between">
                        <ExperimentStatusBadge status={e.effectiveStatus} />
                        {e.dueDate && <span className="text-[10px] text-gray-400">{e.dueDate}</span>}
                      </div>
                      {e.experimentOwner && <div className="text-[10px] text-gray-400 mt-1">{e.experimentOwner}</div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
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
