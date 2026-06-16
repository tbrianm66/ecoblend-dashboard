/**
 * FEDSILK governance sub-module — Confidential. © repository owner.
 * Mechanism implementation; check priority-filing status before any public disclosure.
 *
 * FedsilkPanel: governance sub-section UI wired to FedEngine.
 * Displays all five FEDSILK mechanisms as governance evidence.
 */

import { useState, useEffect, useRef, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer,
} from "recharts";
import {
  ShieldCheck, ShieldAlert, Network, Play, FastForward, Zap,
  LogOut, RotateCcw, PlusCircle, CheckCircle2, XCircle,
  ChevronRight, Lock, AlertTriangle, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createFedEngine, runRound, exitAndUnlearn, addClient, resetEngine,
  verifyLedgerIntegrity,
} from "./FedEngine";
import type { FedEngineState, LedgerEntry } from "./FedEngine";

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  navy:     "#0B2545",
  navyMid:  "#163662",
  navyFade: "rgba(11,37,69,0.07)",
  green:    "#1B4D3E",
  greenFade:"rgba(27,77,62,0.10)",
  gold:     "#B8862F",
  goldFade: "rgba(184,134,47,0.10)",
  reject:   "#b91c1c",
  rejectFade: "rgba(185,28,28,0.08)",
  border:   "#dde3ec",
  muted:    "#64748b",
  text:     "#1a2332",
};

// ─── Small helpers ────────────────────────────────────────────────────────────

function pct(v: number) { return (v * 100).toFixed(1) + "%"; }
function fmtHash(h: string) { return h.slice(0, 6) + "…" + h.slice(-4); }
function fmtTs(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const EVENT_LABELS: Record<LedgerEntry["eventType"], string> = {
  INIT:           "Init",
  ROUND_COMPLETE: "Round",
  CLIENT_REJECTED:"Rejected",
  CREDIT_CHANGE:  "Credit",
  EXIT_UNLEARN:   "Unlearn",
};

const EVENT_COLORS: Record<LedgerEntry["eventType"], string> = {
  INIT:           C.navy,
  ROUND_COMPLETE: C.green,
  CLIENT_REJECTED:C.reject,
  CREDIT_CHANGE:  C.gold,
  EXIT_UNLEARN:   "#7c3aed",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FedsilkPanel() {
  const [engine, setEngine] = useState<FedEngineState>(() => createFedEngine(5));
  const [poisonTarget, setPoisonTarget] = useState<string>("");
  const [exitTarget, setExitTarget]     = useState<string>("");
  const [running, setRunning]           = useState(false);
  const ledgerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ledger to bottom on new entries
  useEffect(() => {
    if (ledgerRef.current) ledgerRef.current.scrollTop = ledgerRef.current.scrollHeight;
  }, [engine.ledger.length]);

  // Sync selectors when clients change
  const activeClients = engine.clients.filter(c => c.active);
  useEffect(() => {
    if (!activeClients.find(c => c.id === poisonTarget)) setPoisonTarget(activeClients[0]?.id ?? "");
    if (!activeClients.find(c => c.id === exitTarget))   setExitTarget(activeClients[0]?.id ?? "");
  }, [engine.clients]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const doRound = (state: FedEngineState, poison?: string) => runRound(state, poison);

  const handleRun1 = () => setEngine(s => doRound(s));
  const handleRun5 = async () => {
    setRunning(true);
    setEngine(s => {
      let st = s;
      for (let i = 0; i < 5; i++) st = doRound(st);
      return st;
    });
    setRunning(false);
  };
  const handlePoison = () => {
    if (!poisonTarget) return;
    setEngine(s => doRound(s, poisonTarget));
  };
  const handleExit = () => {
    if (!exitTarget) return;
    setEngine(s => exitAndUnlearn(s, exitTarget));
    setExitTarget("");
  };
  const handleAddClient = () => setEngine(s => addClient(s));
  const handleReset     = () => setEngine(resetEngine(5));

  // ── Derived data ─────────────────────────────────────────────────────────────

  const ledgerCheck = useMemo(() => verifyLedgerIntegrity(engine.ledger), [engine.ledger]);
  const lastRound   = engine.roundHistory[engine.roundHistory.length - 1];

  const chartData = useMemo(() =>
    engine.roundHistory.map(r => ({
      round: r.round,
      "Accuracy %": +(r.globalAccuracy * 100).toFixed(2),
      "Loss (MSE)":  +r.globalLoss.toFixed(4),
    })), [engine.roundHistory]);

  const roundBarData = useMemo(() =>
    engine.roundHistory.slice(-12).map(r => ({
      round: r.round,
      Accepted: r.acceptedCount,
      Rejected: r.rejectedCount,
    })), [engine.roundHistory]);

  const sortedClients = useMemo(() =>
    [...engine.clients].sort((a, b) => b.creditBalance - a.creditBalance),
    [engine.clients]);

  const topContributor = sortedClients.find(c => c.active);
  const totalCredit    = engine.clients.reduce((s, c) => s + c.creditBalance, 0);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: C.navy }}>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Network size={22} style={{ color: C.gold }} />
              <div>
                <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  FEDSILK Attribution Engine
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Federated contribution attribution · privacy-preserving · governance-verifiable
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "M1 Data Locality",      ok: true },
                { label: "M2 Gate Validation",    ok: true },
                { label: "M3 Contribution Score", ok: true },
                { label: "M4 Audit Ledger",        ok: ledgerCheck.valid },
                { label: "M5 Unlearn Exit",        ok: true },
              ].map(m => (
                <span key={m.label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                  style={{ background: m.ok ? C.greenFade : C.rejectFade, color: m.ok ? "#6ee7b7" : "#fca5a5", border: `1px solid ${m.ok ? "rgba(110,231,183,0.25)" : "rgba(252,165,165,0.25)"}` }}>
                  {m.ok ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="px-6 py-2.5 flex flex-wrap gap-5 text-xs border-t" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.18)" }}>
          {[
            { label: "Round",    value: engine.round },
            { label: "Active",   value: `${activeClients.length} clients` },
            { label: "Accuracy", value: pct(engine.testAccuracy) },
            { label: "Loss",     value: engine.testLoss.toFixed(4) },
            { label: "Ledger",   value: `${engine.ledger.length} entries`, ok: ledgerCheck.valid },
          ].map(s => (
            <span key={s.label} className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</span>
              <span className="font-mono font-semibold" style={{ color: s.ok === false ? "#fca5a5" : "white" }}>{s.value}</span>
              {s.ok === true  && <CheckCircle2 size={10} style={{ color: "#6ee7b7" }} />}
              {s.ok === false && <ShieldAlert   size={10} style={{ color: "#fca5a5" }} />}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1.5">
            {ledgerCheck.valid
              ? <><ShieldCheck size={11} style={{ color: "#6ee7b7" }} /><span style={{ color: "#6ee7b7" }}>Chain verified</span></>
              : <><ShieldAlert  size={11} style={{ color: "#fca5a5" }} /><span style={{ color: "#fca5a5" }}>Tamper detected seq {ledgerCheck.firstTamperedSeq}</span></>
            }
          </span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.border }}>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" className="gap-1.5 text-xs" style={{ background: C.navy }}
            onClick={handleRun1} disabled={running || activeClients.length === 0}>
            <Play size={12} /> Run Round
          </Button>

          <Button size="sm" variant="outline" className="gap-1.5 text-xs" style={{ borderColor: C.navy, color: C.navy }}
            onClick={handleRun5} disabled={running || activeClients.length === 0}>
            <FastForward size={12} /> Run 5×
          </Button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: C.rejectFade, border: `1px solid ${C.reject}30` }}>
            <Zap size={12} style={{ color: C.reject }} />
            <span className="text-xs font-medium" style={{ color: C.reject }}>Inject Poison</span>
            <select className="text-xs bg-transparent outline-none" style={{ color: C.reject }}
              value={poisonTarget} onChange={e => setPoisonTarget(e.target.value)}>
              {activeClients.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button className="text-xs font-bold underline" style={{ color: C.reject }} onClick={handlePoison}
              disabled={activeClients.length === 0}>
              Fire
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.25)" }}>
            <LogOut size={12} style={{ color: "#7c3aed" }} />
            <span className="text-xs font-medium" style={{ color: "#7c3aed" }}>Exit + Unlearn</span>
            <select className="text-xs bg-transparent outline-none" style={{ color: "#7c3aed" }}
              value={exitTarget} onChange={e => setExitTarget(e.target.value)}>
              {activeClients.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button className="text-xs font-bold underline" style={{ color: "#7c3aed" }} onClick={handleExit}
              disabled={activeClients.length === 0}>
              Execute
            </button>
          </div>

          <Button size="sm" variant="outline" className="gap-1.5 text-xs ml-auto" style={{ borderColor: C.border }}
            onClick={handleAddClient}>
            <PlusCircle size={12} /> Add Client
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-gray-400"
            onClick={handleReset}>
            <RotateCcw size={12} /> Reset
          </Button>
        </div>
      </div>

      {/* ── Charts + Client Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Accuracy / Loss over rounds */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded" style={{ background: C.navy }} />
            <h3 className="text-sm font-bold" style={{ color: C.text }}>Global Model Performance</h3>
            {engine.round === 0 && <span className="text-xs text-gray-400 ml-auto">Run rounds to populate</span>}
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="round" tick={{ fontSize: 10 }} label={{ value: "Round", position: "insideBottom", offset: -2, fontSize: 10 }} />
                <YAxis yAxisId="acc" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => v + "%"} />
                <YAxis yAxisId="loss" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, name) => [typeof v === "number" ? v.toFixed(3) : v, name]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="acc"  type="monotone" dataKey="Accuracy %" stroke={C.navy}  strokeWidth={2} dot={false} />
                <Line yAxisId="loss" type="monotone" dataKey="Loss (MSE)" stroke={C.gold}  strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-gray-300">
              No rounds yet
            </div>
          )}
        </div>

        {/* Accept / Reject per round */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded" style={{ background: C.green }} />
            <h3 className="text-sm font-bold" style={{ color: C.text }}>Gate Validation — Accept / Reject</h3>
            <Badge className="ml-auto text-[10px]" style={{ background: C.navyFade, color: C.navy, border: "none" }}>
              M2
            </Badge>
          </div>
          {roundBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={roundBarData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="round" tick={{ fontSize: 10 }} label={{ value: "Round", position: "insideBottom", offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Accepted" fill={C.green}  radius={[3, 3, 0, 0]} />
                <Bar dataKey="Rejected" fill={C.reject} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-gray-300">
              No rounds yet
            </div>
          )}
        </div>
      </div>

      {/* ── Client Attribution Table ── */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: C.border, background: "#fafbfc" }}>
          <div className="w-1 h-4 rounded" style={{ background: C.gold }} />
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Contribution Scores & Credit Balances</h3>
          <Badge className="text-[10px] ml-1" style={{ background: C.goldFade, color: C.gold, border: "none" }}>M3</Badge>
          <span className="text-xs ml-auto" style={{ color: C.muted }}>
            Total credit distributed: <strong>{totalCredit.toFixed(2)}</strong>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: `1px solid ${C.border}` }}>
                {["Participant", "Data Quality", "Rounds", "Last Contribution", "Credit Balance", "Status"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedClients.map(client => {
                const lastContrib = client.contributionHistory[client.contributionHistory.length - 1];
                const qualityPct = Math.max(0, Math.min(100, Math.round((1 - client.noiseFactor) * 100)));
                return (
                  <tr key={client.id} className="border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                    style={{ borderColor: "#f1f5f9", opacity: client.active ? 1 : 0.45 }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: C.text }}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: client.active ? C.green : "#9ca3af" }} />
                        {client.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: qualityPct + "%", background: qualityPct > 60 ? C.green : qualityPct > 35 ? C.gold : C.reject }} />
                        </div>
                        <span style={{ color: C.muted }}>{qualityPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: C.muted }}>{client.roundsParticipated}</td>
                    <td className="px-4 py-2.5">
                      {lastContrib !== undefined ? (
                        <span className="font-mono font-semibold" style={{ color: lastContrib >= 0 ? C.green : C.reject }}>
                          {lastContrib >= 0 ? "+" : ""}{(lastContrib * 100).toFixed(2)}%
                        </span>
                      ) : <span style={{ color: C.muted }}>—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono font-bold" style={{ color: client.creditBalance > 0 ? C.gold : C.muted }}>
                        {client.creditBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className="text-[10px]" style={{
                        background: client.active ? C.greenFade : C.rejectFade,
                        color: client.active ? C.green : "#9ca3af",
                        border: "none",
                      }}>
                        {client.active ? "Active" : "Exited"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Last Round Detail + Governance Signals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Last Round Detail */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded" style={{ background: C.navy }} />
            <h3 className="text-sm font-bold" style={{ color: C.text }}>
              {lastRound ? `Round ${lastRound.round} — Gate Detail` : "Round Detail"}
            </h3>
            <Badge className="text-[10px] ml-1" style={{ background: C.navyFade, color: C.navy, border: "none" }}>M2</Badge>
          </div>
          {lastRound ? (
            <div className="space-y-2">
              {lastRound.updates.map(u => (
                <div key={u.clientId} className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{ background: u.accepted ? C.greenFade : C.rejectFade }}>
                  {u.accepted
                    ? <CheckCircle2 size={13} style={{ color: C.green }} />
                    : <XCircle      size={13} style={{ color: C.reject }} />
                  }
                  <span className="text-xs font-semibold" style={{ color: C.text, minWidth: 100 }}>
                    {engine.clients.find(c => c.id === u.clientId)?.label ?? u.clientId}
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: C.muted }}>
                    ‖g‖ = {u.gradientNorm.toFixed(3)}
                  </span>
                  {u.isPoisoned && (
                    <Badge className="text-[10px] ml-1" style={{ background: C.rejectFade, color: C.reject, border: "none" }}>
                      <AlertTriangle size={8} className="mr-0.5" /> Poisoned
                    </Badge>
                  )}
                  {!u.accepted && u.rejectionReason && (
                    <span className="text-[10px] truncate ml-auto max-w-[160px]" style={{ color: C.reject }} title={u.rejectionReason}>
                      {u.rejectionReason.split("(")[0].trim()}
                    </span>
                  )}
                  {u.accepted && lastRound.contributions[u.clientId] !== undefined && (
                    <span className="text-[11px] font-mono ml-auto" style={{ color: C.gold }}>
                      Δ {(lastRound.contributions[u.clientId] * 100).toFixed(2)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Run a round to see gate detail.</p>
          )}
        </div>

        {/* Governance Signals */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded" style={{ background: C.gold }} />
            <h3 className="text-sm font-bold" style={{ color: C.text }}>Governance Signals</h3>
            <span className="text-[10px] ml-auto" style={{ color: C.muted }}>→ VRL / SRL / PRL / MRL gates</span>
          </div>
          <div className="space-y-3">
            {[
              {
                gate: "VRL / MRL",
                label: "Validation Integrity",
                value: lastRound
                  ? `${lastRound.acceptedCount}/${lastRound.acceptedCount + lastRound.rejectedCount} updates clean`
                  : "Awaiting rounds",
                ok: lastRound ? lastRound.rejectedCount === 0 : null,
                note: "Poisoned/anomalous updates trigger gate block",
              },
              {
                gate: "SRL",
                label: "Top Attribution",
                value: topContributor
                  ? `${topContributor.label} — ${topContributor.creditBalance.toFixed(2)} credits`
                  : "No active participants",
                ok: topContributor ? topContributor.creditBalance > 0 : null,
                note: "Marginal-value Shapley score drives credit allocation",
              },
              {
                gate: "PRL",
                label: "Data Locality",
                value: `${activeClients.length} private datasets · 0 raw data shared`,
                ok: true,
                note: "Only gradients traverse trust boundary (M1)",
              },
              {
                gate: "Compliance",
                label: "Audit Completeness",
                value: `${engine.ledger.length} entries · ${ledgerCheck.valid ? "chain verified" : "TAMPER DETECTED"}`,
                ok: ledgerCheck.valid,
                note: "Hash-linked ledger; every event is immutable evidence",
              },
            ].map(sig => (
              <div key={sig.gate} className="flex items-start gap-3 rounded-lg p-3"
                style={{ background: sig.ok === null ? "#f8fafc" : sig.ok ? C.greenFade : C.rejectFade, border: `1px solid ${sig.ok === null ? C.border : sig.ok ? "rgba(27,77,62,0.2)" : "rgba(185,28,28,0.2)"}` }}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5" style={{ background: C.navy, color: "white", whiteSpace: "nowrap" }}>
                  {sig.gate}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold" style={{ color: C.text }}>{sig.label}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: sig.ok === false ? C.reject : C.green }}>
                    {sig.value}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{sig.note}</div>
                </div>
                {sig.ok !== null && (
                  sig.ok
                    ? <CheckCircle2 size={14} style={{ color: C.green, flexShrink: 0 }} />
                    : <XCircle      size={14} style={{ color: C.reject, flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Audit Ledger (M4) ── */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: C.border, background: "#fafbfc" }}>
          <Lock size={14} style={{ color: C.navy }} />
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Hash-Linked Audit Ledger</h3>
          <Badge className="text-[10px] ml-1" style={{ background: C.navyFade, color: C.navy, border: "none" }}>M4</Badge>
          <span className="text-[10px] ml-2" style={{ color: C.muted }}>
            {engine.ledger.length} entries · each entry seals the previous hash
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {ledgerCheck.valid
              ? <><ShieldCheck size={12} style={{ color: C.green }} /><span className="text-[10px] font-semibold" style={{ color: C.green }}>Verified</span></>
              : <><ShieldAlert  size={12} style={{ color: C.reject }} /><span className="text-[10px] font-semibold" style={{ color: C.reject }}>Tampered at seq {ledgerCheck.firstTamperedSeq}</span></>
            }
          </div>
        </div>
        <div ref={ledgerRef} className="overflow-y-auto" style={{ maxHeight: 280 }}>
          {engine.ledger.length === 0 ? (
            <div className="px-5 py-6 text-xs text-center" style={{ color: C.muted }}>No entries yet</div>
          ) : (
            engine.ledger.map(entry => (
              <div key={entry.seq} className="flex items-start gap-3 px-4 py-2.5 border-b text-xs hover:bg-slate-50"
                style={{ borderColor: "#f1f5f9" }}>
                <span className="font-mono w-6 text-right flex-shrink-0" style={{ color: C.muted }}>
                  {entry.seq}
                </span>
                <ChevronRight size={10} style={{ color: C.muted, flexShrink: 0, marginTop: 2 }} />
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0"
                  style={{ background: EVENT_COLORS[entry.eventType] + "18", color: EVENT_COLORS[entry.eventType] }}>
                  {EVENT_LABELS[entry.eventType]}
                </span>
                <span className="flex-1 font-mono text-[10px] truncate" style={{ color: C.muted, marginTop: 2 }}>
                  {JSON.stringify(entry.data).slice(0, 90)}{JSON.stringify(entry.data).length > 90 ? "…" : ""}
                </span>
                <span className="font-mono text-[10px] flex-shrink-0 ml-2" style={{ color: "#94a3b8" }} title={`prev: ${entry.prevHash}\nhash: ${entry.hash}`}>
                  {fmtHash(entry.hash)}
                </span>
                <span className="text-[10px] flex-shrink-0" style={{ color: "#94a3b8" }}>{fmtTs(entry.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Unlearning Events (M5) ── */}
      {engine.unlearningEvents.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: C.border, background: "#fafbfc" }}>
            <LogOut size={14} style={{ color: "#7c3aed" }} />
            <h3 className="text-sm font-bold" style={{ color: C.text }}>Verifiable Unlearning Events</h3>
            <Badge className="text-[10px] ml-1" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "none" }}>M5</Badge>
          </div>
          <div className="p-5 space-y-4">
            {engine.unlearningEvents.map((evt, i) => (
              <div key={i} className="rounded-xl p-4 border" style={{ borderColor: "rgba(124,58,237,0.25)", background: "rgba(124,58,237,0.04)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <LogOut size={13} style={{ color: "#7c3aed" }} />
                  <span className="text-xs font-bold" style={{ color: C.text }}>
                    {evt.clientLabel} — Exit &amp; Unlearn
                  </span>
                  <span className="text-[10px] ml-auto" style={{ color: C.muted }}>{fmtTs(evt.timestamp)}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Accuracy Before", value: pct(evt.accuracyBefore), color: C.navy },
                    { label: "Accuracy After",  value: pct(evt.accuracyAfter),  color: "#7c3aed" },
                    { label: "Credit Forfeited",value: evt.creditForfeited.toFixed(2), color: C.reject },
                    { label: "Model Δ (w₁)",    value: (evt.modelAfter.w[0] - evt.modelBefore.w[0]).toFixed(4), color: C.gold },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg p-2.5 text-center" style={{ background: "white", border: `1px solid ${C.border}` }}>
                      <div className="text-[10px] mb-0.5" style={{ color: C.muted }}>{s.label}</div>
                      <div className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px]" style={{ color: C.muted }}>
                  <span className="font-semibold">Model before:</span>
                  <span className="font-mono">[{evt.modelBefore.w.map(v => v.toFixed(3)).join(", ")}] b={evt.modelBefore.b.toFixed(3)}</span>
                  <ArrowRight size={10} />
                  <span className="font-semibold">After:</span>
                  <span className="font-mono">[{evt.modelAfter.w.map(v => v.toFixed(3)).join(", ")}] b={evt.modelAfter.b.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
