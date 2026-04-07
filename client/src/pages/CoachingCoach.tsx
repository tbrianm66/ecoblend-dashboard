/**
 * COACHING MODULE V2 — Coach Dashboard
 * Architecture: BEBUS-COACH-V2-001 Phase 2 UI
 *
 * Shows: Assigned founders, high-risk alerts, upcoming sessions,
 *        session notes input, founder PRL history
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlertTriangle, Users, Calendar, CheckCircle2, Loader2,
  TrendingUp, TrendingDown, Minus, Plus, BookTemplate, Zap
} from "lucide-react";
import { format } from "date-fns";

const DEFAULT_COACH_ID = "coach-001"; // placeholder — replace with auth context

// ── Commitment Templates Panel ─────────────────────────────────────────────────────
function CommitmentTemplatesPanel({ founderId }: { founderId: number | null }) {
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [applying, setApplying] = useState(false);
  const utils = trpc.useUtils();

  const { data: templates = [], isLoading } = trpc.coaching.templates.list.useQuery(
    { vrlStage: selectedStage },
    { enabled: true }
  );

  const applyTemplate = trpc.coaching.templates.apply.useMutation({
    onSuccess: (result) => {
      toast.success(`Applied ${result.applied} commitment${result.applied !== 1 ? "s" : ""} from VRL Stage ${selectedStage} template`);
      utils.coaching.commitments.list.invalidate();
      utils.coaching.dashboard.coachDashboard.invalidate();
      setApplying(false);
    },
    onError: (e) => {
      toast.error(e.message);
      setApplying(false);
    },
  });

  const VRL_STAGES = [
    { stage: 1, label: "Opportunity Discovery" },
    { stage: 2, label: "Concept" },
    { stage: 3, label: "Validation" },
    { stage: 4, label: "Prototype" },
  ];

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <BookTemplate className="w-4 h-4 text-amber-400" />
            Weekly Commitment Templates
          </CardTitle>
          <Button
            size="sm"
            disabled={!founderId || applying || applyTemplate.isPending || templates.length === 0}
            onClick={() => {
              if (!founderId) { toast.error("Select a founder first"); return; }
              setApplying(true);
              applyTemplate.mutate({ founderId, vrlStage: selectedStage });
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1"
          >
            {applyTemplate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            Apply to Founder
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Pre-built commitment sets per VRL stage — apply in one click to onboard a founder onto a structured programme
        </p>
      </CardHeader>
      <CardContent>
        {/* Stage Selector */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {VRL_STAGES.map((s) => (
            <button
              key={s.stage}
              onClick={() => setSelectedStage(s.stage)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                selectedStage === s.stage
                  ? "bg-amber-600 border-amber-600 text-white"
                  : "bg-transparent border-slate-600 text-slate-400 hover:border-amber-500 hover:text-amber-300"
              }`}
            >
              Stage {s.stage} — {s.label}
            </button>
          ))}
        </div>

        {/* Template List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No templates for Stage {selectedStage}.</p>
        ) : (
          <div className="space-y-2">
            {templates.map((t, i) => (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
                <span className="w-5 h-5 rounded-full bg-amber-600/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{t.taskTemplate}</p>
                  {t.metricTemplate && (
                    <p className="text-xs text-slate-400 mt-0.5">Metric: {t.metricTemplate}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 capitalize">{t.category}</span>
                    <span className="text-xs text-slate-500">Priority {t.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!founderId && (
          <p className="text-xs text-amber-400/70 mt-3 text-center">
            ⚠️ Select a founder from the list to enable the Apply button
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function getRagColor(riskLevel: string | null) {
  if (riskLevel === "HIGH") return "#ef4444";
  if (riskLevel === "MEDIUM") return "#f59e0b";
  if (riskLevel === "LOW") return "#22c55e";
  return "#64748b";
}

function TrendIcon({ trend }: { trend: string | null }) {
  if (trend === "improving") return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === "declining") return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-amber-500" />;
}

export default function CoachingCoach() {
  const [selectedFounderId, setSelectedFounderId] = useState<number | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionType, setSessionType] = useState<"check_in" | "deep_dive" | "crisis" | "review">("check_in");
  const [sessionDate, setSessionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [sessionDuration, setSessionDuration] = useState(60);

  const utils = trpc.useUtils();

  const { data: dashboard, isLoading } = trpc.coaching.dashboard.coachDashboard.useQuery(
    { coachId: DEFAULT_COACH_ID },
    { refetchInterval: 30_000 }
  );

  const { data: founderPrlHistory } = trpc.coaching.prl.getHistory.useQuery(
    { founderId: selectedFounderId!, weeks: 8 },
    { enabled: selectedFounderId !== null }
  );

  const { data: founderCommitments } = trpc.coaching.commitments.list.useQuery(
    { founderId: selectedFounderId! },
    { enabled: selectedFounderId !== null }
  );

  const logSession = trpc.coaching.sessions.create.useMutation({
    onSuccess: () => {
      utils.coaching.dashboard.coachDashboard.invalidate();
      setShowSessionForm(false);
      setSessionNotes("");
      toast.success("Session logged — PRL recalculated");
    },
    onError: () => toast.error("Failed to log session"),
  });

  const verifyCommitment = trpc.coaching.commitments.updateStatus.useMutation({
    onSuccess: () => {
      utils.coaching.commitments.list.invalidate();
      utils.coaching.dashboard.coachDashboard.invalidate();
      toast.success("Commitment verified — PRL updated");
    },
    onError: () => toast.error("Failed to verify commitment"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Coach Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Execution Discipline Engine · BEBUS-COACH-V2-001
          </p>
        </div>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          onClick={() => setShowSessionForm(!showSessionForm)}
        >
          <Plus className="w-4 h-4" /> Log Session
        </Button>
      </div>

      {/* High Risk Alerts */}
      {dashboard?.highRiskFounders && dashboard.highRiskFounders.length > 0 && (
        <Card className="bg-red-950 border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {dashboard.highRiskFounders.length} Founder{dashboard.highRiskFounders.length > 1 ? "s" : ""} at HIGH RISK — Immediate Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dashboard.highRiskFounders.map((f) => (
                <button
                  key={f.founder?.id}
                  className="px-3 py-1.5 rounded-lg bg-red-900 border border-red-700 text-sm text-red-200 hover:bg-red-800 transition-colors"
                  onClick={() => setSelectedFounderId(f.founder?.id || null)}
                >
                  {f.founder?.name || `Founder #${f.founder?.id}`}
                  <span className="ml-2 text-red-400 font-mono text-xs">
                    PRL {parseFloat(f.latestPrl?.score as unknown as string || "0").toFixed(0)}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Log Form */}
      {showSessionForm && (
        <Card className="bg-slate-900 border-blue-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Log Coaching Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Founder ID</label>
                <input
                  type="number"
                  placeholder="Founder ID"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
                  onChange={(e) => setSelectedFounderId(parseInt(e.target.value) || null)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Session Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Session Type</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as typeof sessionType)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
                >
                  <option value="check_in">Check-in</option>
                  <option value="deep_dive">Deep Dive</option>
                  <option value="crisis">Crisis</option>
                  <option value="review">Review</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Duration (mins)</label>
                <input
                  type="number"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(parseInt(e.target.value) || 60)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
                />
              </div>
            </div>
            <Textarea
              placeholder="Session notes (min 200 characters recommended — describe what was discussed, decisions made, and next steps)..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white text-sm min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                disabled={!sessionNotes.trim() || !selectedFounderId || logSession.isPending}
                onClick={() =>
                  logSession.mutate({
                    coachId: DEFAULT_COACH_ID,
                    founderId: selectedFounderId!,
                    sessionDate,
                    notes: sessionNotes,
                    sessionType,
                    durationMins: sessionDuration,
                  })
                }
              >
                {logSession.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Log Session"}
              </Button>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowSessionForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Assigned Founders */}
        <div className="xl:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> Assigned Founders ({dashboard?.assignedFounders.length || 0})
          </h2>
          {dashboard?.assignedFounders.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm bg-slate-900 rounded-lg border border-slate-700">
              No founders assigned yet.
            </div>
          )}
          {dashboard?.assignedFounders.map((f) => {
            const prlScore = f.latestPrl ? parseFloat(f.latestPrl.score as unknown as string) : null;
            const ragColor = getRagColor(f.latestPrl?.riskLevel || null);
            const isSelected = selectedFounderId === f.founder?.id;
            return (
              <button
                key={f.founder?.id}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? "bg-blue-900/40 border-blue-600"
                    : "bg-slate-900 border-slate-700 hover:border-slate-500"
                }`}
                onClick={() => setSelectedFounderId(isSelected ? null : (f.founder?.id || null))}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    {f.founder?.name || `Founder #${f.founder?.id}`}
                  </span>
                  {prlScore !== null && (
                    <span className="text-sm font-bold font-mono" style={{ color: ragColor }}>
                      {prlScore.toFixed(0)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {f.latestPrl?.riskLevel && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${ragColor}20`, color: ragColor }}
                    >
                      {f.latestPrl.riskLevel}
                    </span>
                  )}
                  <TrendIcon trend={f.latestPrl?.trend || null} />
                  <span className="text-xs text-slate-500 capitalize">{f.latestPrl?.trend || "no data"}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Founder Detail */}
        <div className="xl:col-span-2 space-y-4">
          {selectedFounderId ? (
            <>
              {/* PRL History */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">PRL History — Last 8 Weeks</CardTitle>
                </CardHeader>
                <CardContent>
                  {founderPrlHistory && founderPrlHistory.length > 0 ? (
                    <div className="space-y-2">
                      {[...founderPrlHistory].reverse().map((p) => {
                        const score = parseFloat(p.score as unknown as string);
                        const color = getRagColor(p.riskLevel);
                        return (
                          <div key={p.id} className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 w-20 shrink-0">
                              {format(new Date(p.week as unknown as string), "dd MMM")}
                            </span>
                            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${score}%`, background: color }}
                              />
                            </div>
                            <span className="text-xs font-mono w-8 text-right" style={{ color }}>
                              {score.toFixed(0)}
                            </span>
                            <TrendIcon trend={p.trend} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No PRL history for this founder.</p>
                  )}
                </CardContent>
              </Card>

              {/* Commitments to Verify */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Commitments Awaiting Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {founderCommitments?.filter((c) => c.status === "complete" && !c.coachVerified).length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No commitments awaiting verification.</p>
                  ) : (
                    <div className="space-y-2">
                      {founderCommitments
                        ?.filter((c) => c.status === "complete" && !c.coachVerified)
                        .map((c) => (
                          <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white">{c.task}</p>
                              {c.metric && <p className="text-xs text-slate-400 mt-0.5">✓ {c.metric}</p>}
                              {c.evidenceNote && (
                                <p className="text-xs text-blue-300 mt-1 italic">"{c.evidenceNote}"</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              className="bg-green-700 hover:bg-green-600 text-white text-xs shrink-0"
                              onClick={() =>
                                verifyCommitment.mutate({
                                  id: c.id,
                                  status: "complete",
                                  coachVerified: true,
                                })
                              }
                            >
                              Verify
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm bg-slate-900 rounded-lg border border-slate-700">
              Select a founder from the list to view their details
            </div>
          )}

          {/* Commitment Templates */}
          <CommitmentTemplatesPanel founderId={selectedFounderId} />

          {/* Upcoming Sessions */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.recentSessions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No sessions logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {dashboard?.recentSessions.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-white">
                            {format(new Date(s.sessionDate as unknown as string), "dd MMM yyyy")}
                          </span>
                          <Badge className="bg-slate-700 text-slate-300 text-xs capitalize">
                            {s.sessionType?.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-slate-500">{s.durationMins}m</span>
                        </div>
                        {s.notes && (
                          <p className="text-xs text-slate-400 line-clamp-2">{s.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
