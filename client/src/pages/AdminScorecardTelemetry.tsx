// ============================================================
// ADMIN — SCORECARD TELEMETRY & KILL-CRITERIA MONITOR
// FHV-EB-AUD-001 §4 — Eight audit hypotheses H1–H8
// ============================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ShieldAlert, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Activity, TrendingUp, Scale, Banknote, Brain, HeartHandshake,
  LayoutGrid, Leaf, ChevronDown, ChevronRight, ClipboardCheck,
  Clock, X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type HStatus = "PASS" | "WARNING" | "KILL_TRIGGERED";

interface HResult {
  id: string;
  name: string;
  description: string;
  killCriterion: string;
  status: HStatus;
  metric: number | null;
  metricLabel: string;
  threshold: string;
  sampleSize: number;
  detail: string;
  computedAt: string;
}

interface KillAlert {
  id: string;
  hypothesisId: string;
  hypothesisName: string;
  breachDetail: string;
  metricAtBreach: string | null;
  killCriterion: string;
  sampleSizeAtBreach: number | null;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  resolvedNote: string | null;
  createdAt: Date;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const H_ICONS: Record<string, React.ElementType> = {
  H1: Activity, H2: ClipboardCheck, H3: Scale, H4: Banknote,
  H5: TrendingUp, H6: HeartHandshake, H7: LayoutGrid, H8: Leaf,
};

const STATUS_COLOR: Record<HStatus, string> = {
  PASS:          "#56A837",
  WARNING:       "#f59e0b",
  KILL_TRIGGERED: "#ef4444",
};
const STATUS_BG: Record<HStatus, string> = {
  PASS:          "#071a03",
  WARNING:       "#1c1200",
  KILL_TRIGGERED: "#1f0505",
};
const STATUS_LABEL: Record<HStatus, string> = {
  PASS:          "PASS",
  WARNING:       "WARNING",
  KILL_TRIGGERED: "KILL TRIGGERED",
};

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: HStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {status === "PASS"          && <CheckCircle2 size={11} />}
      {status === "WARNING"       && <AlertTriangle size={11} />}
      {status === "KILL_TRIGGERED" && <XCircle size={11} />}
      {STATUS_LABEL[status]}
    </span>
  );
}

function HypothesisCard({ h, onExpand, expanded }: { h: HResult; onExpand: () => void; expanded: boolean }) {
  const Icon = H_ICONS[h.id] ?? Activity;
  const color = STATUS_COLOR[h.status];
  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: "#090f1a", border: `1px solid ${h.status === "KILL_TRIGGERED" ? "#ef444430" : "#1e2d3d"}` }}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
        onClick={onExpand}
      >
        {/* Icon + ID */}
        <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>

        {/* Name + criterion */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold tracking-widest" style={{ color: "#475569" }}>{h.id}</span>
            <span className="text-sm font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>{h.name}</span>
          </div>
          <p className="text-xs truncate" style={{ color: "#475569" }}>{h.killCriterion}</p>
        </div>

        {/* Metric */}
        <div className="text-right shrink-0 mr-4">
          <p className="text-sm font-bold" style={{ color }}>{h.metricLabel}</p>
          <p className="text-[10px]" style={{ color: "#334155" }}>n={h.sampleSize} · threshold: {h.threshold}</p>
        </div>

        {/* Status badge */}
        <StatusBadge status={h.status} />

        {/* Expand toggle */}
        <div style={{ color: "#334155" }} className="shrink-0 ml-2">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: "#1a2535" }}>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "#64748b" }}>{h.description}</p>
          <div
            className="rounded-lg px-4 py-3 text-xs leading-relaxed"
            style={{ background: STATUS_BG[h.status], border: `1px solid ${STATUS_COLOR[h.status]}25`, color: "#94a3b8" }}
          >
            {h.detail}
          </div>
          <p className="text-[10px] mt-2" style={{ color: "#2d3d52" }}>
            Computed at {new Date(h.computedAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

function ResolveModal({ alert, onResolve, onClose }: { alert: KillAlert; onResolve: (note: string) => void; onClose: () => void }) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="rounded-2xl w-full max-w-lg mx-4 p-6" style={{ background: "#0a1520", border: "1px solid #1e2d3d" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
              Resolve Alert — {alert.hypothesisId}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{alert.hypothesisName}</p>
          </div>
          <button onClick={onClose} style={{ color: "#475569" }}><X size={16} /></button>
        </div>

        <div className="rounded-lg px-4 py-3 mb-4 text-xs" style={{ background: "#0d1825", border: "1px solid #1e2d3d", color: "#64748b" }}>
          {alert.breachDetail}
        </div>

        <label className="block text-xs font-semibold mb-2" style={{ color: "#94a3b8" }}>
          Resolution note <span style={{ color: "#ef4444" }}>*</span> (min 10 chars)
        </label>
        <textarea
          className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-1"
          style={{
            background: "#060d17", border: "1px solid #1e2d3d", color: "#e2e8f0",
            height: "90px", lineHeight: "1.5",
          }}
          placeholder="Describe the corrective action taken and why this alert is resolved…"
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ background: "#1e2d3d", color: "#94a3b8" }}>
            Cancel
          </button>
          <button
            onClick={() => { if (note.length >= 10) onResolve(note); }}
            disabled={note.length < 10}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: note.length >= 10 ? "#56A83720" : "#1e2d3d", color: note.length >= 10 ? "#56A837" : "#334155", border: "1px solid #56A83750" }}
          >
            Confirm Resolution
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminScorecardTelemetry() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<KillAlert | null>(null);
  const [h8Desc, setH8Desc] = useState("");
  const [h8Sev, setH8Sev] = useState<"low"|"medium"|"high"|"critical">("medium");
  const [showH8Panel, setShowH8Panel] = useState(false);

  const { data, isLoading, refetch } = trpc.scorecardTelemetry.getScorecard.useQuery(undefined, {
    refetchInterval: 60_000, // auto-refresh every minute
  });
  const { data: alerts = [], refetch: refetchAlerts } = trpc.scorecardTelemetry.getKillAlerts.useQuery(
    { includeResolved: showResolved }
  );

  const resolveAlertMut  = trpc.scorecardTelemetry.resolveAlert.useMutation({
    onSuccess: () => { toast.success("Alert resolved."); setResolveTarget(null); refetchAlerts(); },
    onError: (e) => toast.error(e.message),
  });
  const logH8Mut = trpc.scorecardTelemetry.logEnvironmentalEvent.useMutation({
    onSuccess: () => {
      toast.success("Environmental event logged and H8 alert created.");
      setH8Desc(""); setShowH8Panel(false);
      refetch(); refetchAlerts();
    },
    onError: (e) => toast.error(e.message),
  });

  const hypotheses: HResult[] = data?.hypotheses ?? [];
  const summary = data?.summary;

  const killCount   = summary?.killTriggered ?? 0;
  const warnCount   = summary?.warning ?? 0;
  const passCount   = summary?.pass ?? 0;
  const overallStatus: HStatus =
    killCount > 0 ? "KILL_TRIGGERED" : warnCount > 0 ? "WARNING" : "PASS";

  function runRefresh() {
    refetch().then(() => refetchAlerts()).then(() => toast.success("Scorecard refreshed."));
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert size={15} style={{ color: "#f59e0b" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#f59e0b" }}>
                Admin / System Integrity & Scorecard
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
              Scorecard Telemetry Monitor
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              FHV-EB-AUD-001 §4 — Real-time kill-criteria tracking for audit hypotheses H1–H8.
            </p>
          </div>

          {/* Summary pills */}
          <div className="flex items-center gap-6">
            {[
              { label: "Pass",          value: passCount,   color: "#56A837" },
              { label: "Warning",       value: warnCount,   color: "#f59e0b" },
              { label: "Kill Triggered", value: killCount,  color: "#ef4444" },
            ].map(s => (
              <div key={s.label} className="text-right">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: "#475569" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Overall status bar */}
        <div className="mt-5 flex items-center justify-between">
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{
              background: STATUS_BG[overallStatus],
              border: `1px solid ${STATUS_COLOR[overallStatus]}40`,
            }}
          >
            {overallStatus === "PASS" && <CheckCircle2 size={16} style={{ color: "#56A837" }} />}
            {overallStatus === "WARNING" && <AlertTriangle size={16} style={{ color: "#f59e0b" }} />}
            {overallStatus === "KILL_TRIGGERED" && <XCircle size={16} style={{ color: "#ef4444" }} />}
            <span className="text-sm font-semibold" style={{ color: STATUS_COLOR[overallStatus] }}>
              {overallStatus === "PASS"
                ? "All 8 hypotheses within operating bounds"
                : overallStatus === "WARNING"
                ? `${warnCount} hypothesis${warnCount !== 1 ? "es" : ""} in warning state — data accumulating`
                : `${killCount} kill criterion${killCount !== 1 ? "a" : ""} breached — immediate action required`}
            </span>
            {summary && (
              <span className="text-xs" style={{ color: "#2d3d52" }}>
                · Computed {new Date(summary.computedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <button
            onClick={runRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b50" }}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Computing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">

        {/* ── H1–H8 Cards ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#f59e0b" }}>
              Audit Hypotheses
            </h2>
            <div className="flex-1 h-px" style={{ background: "#1e2d3d" }} />
            <span className="text-xs" style={{ color: "#334155" }}>8 hypotheses · FHV-EB-AUD-001 §4</span>
          </div>

          {isLoading ? (
            <div className="rounded-xl p-8 text-center" style={{ background: "#090f1a", border: "1px solid #1e2d3d" }}>
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" style={{ color: "#f59e0b" }} />
              <p className="text-sm" style={{ color: "#475569" }}>Computing metrics from live data…</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hypotheses.map(h => (
                <HypothesisCard
                  key={h.id}
                  h={h}
                  expanded={expanded === h.id}
                  onExpand={() => setExpanded(prev => prev === h.id ? null : h.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Kill-criteria alerts ───────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#ef4444" }}>
              Kill-Criteria Breach Log
            </h2>
            <div className="flex-1 h-px" style={{ background: "#1e2d3d" }} />
            <button
              onClick={() => { setShowResolved(p => !p); setTimeout(() => refetchAlerts(), 100); }}
              className="text-xs px-3 py-1 rounded-lg transition-all"
              style={{
                background: showResolved ? "#1e2d3d" : "transparent",
                color: "#475569",
                border: "1px solid #1e2d3d",
              }}
            >
              {showResolved ? "Hide resolved" : "Show resolved"}
            </button>
          </div>

          {(alerts as KillAlert[]).length === 0 ? (
            <div className="rounded-xl px-5 py-8 text-center" style={{ background: "#090f1a", border: "1px solid #1e2d3d" }}>
              <CheckCircle2 size={20} className="mx-auto mb-2" style={{ color: "#56A837" }} />
              <p className="text-sm font-semibold" style={{ color: "#56A837" }}>No active kill-criterion breaches</p>
              <p className="text-xs mt-1" style={{ color: "#334155" }}>
                {showResolved ? "No alerts in history." : "All hypotheses are within acceptable bounds — no alerts logged."}
              </p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#1e2d3d" }}>
              {(alerts as KillAlert[]).map((alert, i) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 px-5 py-4"
                  style={{
                    background: i % 2 === 0 ? "#080f18" : "#070d15",
                    borderBottom: i < (alerts as KillAlert[]).length - 1 ? "1px solid #0d1825" : "none",
                    opacity: alert.resolved ? 0.6 : 1,
                  }}
                >
                  {/* Status indicator */}
                  <div className="shrink-0 mt-0.5">
                    {alert.resolved
                      ? <CheckCircle2 size={16} style={{ color: "#56A837" }} />
                      : <XCircle size={16} style={{ color: "#ef4444" }} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold" style={{ color: "#ef4444" }}>{alert.hypothesisId}</span>
                      <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{alert.hypothesisName}</span>
                      {alert.resolved && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#56A83720", color: "#56A837" }}>
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-xs mb-1" style={{ color: "#64748b" }}>{alert.breachDetail}</p>
                    <div className="flex items-center gap-4">
                      {alert.metricAtBreach && (
                        <span className="text-[10px]" style={{ color: "#334155" }}>
                          Metric: {alert.metricAtBreach}
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: "#334155" }}>
                        <Clock size={10} className="inline mr-1" />
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                      {alert.resolved && alert.resolvedBy && (
                        <span className="text-[10px]" style={{ color: "#56A837" }}>
                          Resolved by {alert.resolvedBy}
                        </span>
                      )}
                    </div>
                    {alert.resolved && alert.resolvedNote && (
                      <p className="text-[10px] mt-1 italic" style={{ color: "#334155" }}>
                        "{alert.resolvedNote}"
                      </p>
                    )}
                  </div>

                  {/* Resolve button */}
                  {!alert.resolved && (
                    <button
                      onClick={() => setResolveTarget(alert)}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: "#56A83715", color: "#56A837", border: "1px solid #56A83740" }}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── H8: Manual environmental event logger ─────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#4ade80" }}>
              H8 — Manual Environmental Event Logger
            </h2>
            <div className="flex-1 h-px" style={{ background: "#1e2d3d" }} />
          </div>

          <div className="rounded-xl p-5" style={{ background: "#090f1a", border: "1px solid #1e2d3d" }}>
            <p className="text-xs mb-4" style={{ color: "#475569" }}>
              Manually flag a greenwashing, ESG compliance challenge, or environmental integrity event.
              Any submission immediately creates a KILL TRIGGERED alert for H8 and writes to the audit log.
            </p>

            <button
              onClick={() => setShowH8Panel(p => !p)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "#4ade8015", color: "#4ade80", border: "1px solid #4ade8040" }}
            >
              <Leaf size={14} />
              {showH8Panel ? "Cancel" : "Log Environmental Event"}
            </button>

            {showH8Panel && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Event description *</label>
                  <textarea
                    className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none"
                    style={{ background: "#060d17", border: "1px solid #1e2d3d", color: "#e2e8f0", height: "80px" }}
                    placeholder="Describe the greenwashing or compliance challenge event in detail…"
                    value={h8Desc}
                    onChange={e => setH8Desc(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Severity</label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high", "critical"] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setH8Sev(s)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                        style={{
                          background: h8Sev === s ? "#4ade8020" : "#0d1825",
                          color: h8Sev === s ? "#4ade80" : "#475569",
                          border: h8Sev === s ? "1px solid #4ade8050" : "1px solid #1e2d3d",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { if (h8Desc.length >= 10) logH8Mut.mutate({ description: h8Desc, severity: h8Sev }); }}
                  disabled={h8Desc.length < 10 || logH8Mut.isPending}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: h8Desc.length >= 10 ? "#ef444420" : "#1e2d3d",
                    color: h8Desc.length >= 10 ? "#ef4444" : "#334155",
                    border: "1px solid #ef444440",
                  }}
                >
                  {logH8Mut.isPending ? "Logging…" : "Submit Flag"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Reference: Kill-criteria thresholds ───────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: "#475569" }} />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#475569" }}>
              Kill-Criteria Reference (FHV-EB-AUD-001 §4)
            </h2>
            <div className="flex-1 h-px" style={{ background: "#1e2d3d" }} />
          </div>

          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#1e2d3d" }}>
            {[
              { id: "H1", criterion: "< 95% independent reproduction rate at n = 20 resolved score disputes" },
              { id: "H2", criterion: "< 100% of persisted dimension scores carrying enforced evidence links" },
              { id: "H3", criterion: "Veto-gate block rate differential hardware vs software/social > 2× — mandates Profile SV-01" },
              { id: "H4", criterion: "0 of 5 target paid pilot conversions with zero studio equity relationship" },
              { id: "H5", criterion: "Pearson r < 0.6 between VRL score at T0 and verified outcome at T+12 months" },
              { id: "H6", criterion: "r² < 0.15 — commitment completion rate explains < 15% of venture outcome variance" },
              { id: "H7", criterion: "< 6 active platform modules per founder per week" },
              { id: "H8", criterion: "Any greenwashing or environmental compliance challenge event — zero tolerance" },
            ].map((row, i) => {
              const Icon = H_ICONS[row.id] ?? Activity;
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{
                    background: i % 2 === 0 ? "#080f18" : "#070d15",
                    borderBottom: i < 7 ? "1px solid #0d1825" : "none",
                  }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#1e2d3d" }}>
                    <Icon size={13} style={{ color: "#64748b" }} />
                  </div>
                  <span className="text-xs font-bold w-6 shrink-0" style={{ color: "#f59e0b" }}>{row.id}</span>
                  <p className="text-xs" style={{ color: "#475569" }}>{row.criterion}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Resolve modal ─────────────────────────────────────────────────── */}
      {resolveTarget && (
        <ResolveModal
          alert={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onResolve={note => resolveAlertMut.mutate({ alertId: resolveTarget.id, resolvedNote: note })}
        />
      )}
    </div>
  );
}
