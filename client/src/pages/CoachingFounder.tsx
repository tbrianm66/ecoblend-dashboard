/**
 * Module 13 — Sub-Module 1: Founder Dashboard
 * Route: /coaching/founder
 * Bound to the active venture via SelectedVentureContext.
 *
 * Layout:
 *   Top row  — Next Session countdown card + Pending Action Items counter
 *   Left col — Interactive coach action-item checklist
 *   Right col — Historical session timeline with downloadable notes
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Calendar, Clock, CheckSquare, Square, Download,
  CalendarClock, ClipboardList, ChevronDown, ChevronUp,
  AlertCircle, Sparkles, BookOpen, User, Timer,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays, differenceInHours, isPast, parseISO } from "date-fns";

// ── Type helpers ──────────────────────────────────────────────────────────────

type ActionItem = {
  id: string;
  text: string;
  done: boolean;
  sessionId: string;
  sessionDate: string;
  focusArea: string | null;
};

type Session = {
  id: string;
  coachId: string;
  founderId: number;
  ventureId: string | null;
  sessionDate: string;
  focusArea: string | null;
  notes: string | null;
  actions: unknown;
  sessionType: string | null;
  durationMins: number | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── Countdown helpers ─────────────────────────────────────────────────────────

function getCountdown(dateStr: string): { label: string; urgent: boolean } {
  const date = parseISO(dateStr);
  if (isPast(date)) return { label: "Today / Overdue", urgent: true };
  const days = differenceInDays(date, new Date());
  const hours = differenceInHours(date, new Date());
  if (days === 0) return { label: `In ${hours}h`, urgent: true };
  if (days === 1) return { label: "Tomorrow", urgent: false };
  return { label: `In ${days} days`, urgent: false };
}

// ── Session type badge ────────────────────────────────────────────────────────

const SESSION_TYPE_MAP: Record<string, { label: string; color: string }> = {
  check_in:   { label: "Check-in",     color: "bg-blue-900/60 text-blue-300 border-blue-700" },
  prl_review: { label: "PRL Review",   color: "bg-purple-900/60 text-purple-300 border-purple-700" },
  strategy:   { label: "Strategy",     color: "bg-amber-900/60 text-amber-300 border-amber-700" },
  deep_dive:  { label: "Deep Dive",    color: "bg-emerald-900/60 text-emerald-300 border-emerald-700" },
  crisis:     { label: "Crisis",       color: "bg-red-900/60 text-red-300 border-red-700" },
  review:     { label: "Review",       color: "bg-slate-700 text-slate-300 border-slate-600" },
};

function SessionTypeBadge({ type }: { type: string | null }) {
  const t = SESSION_TYPE_MAP[type ?? ""] ?? SESSION_TYPE_MAP.check_in;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${t.color}`}>
      {t.label}
    </span>
  );
}

// ── Download session notes ────────────────────────────────────────────────────

function downloadNotes(session: Session) {
  const lines = [
    `SESSION NOTES`,
    `═══════════════════════════════════════`,
    `Date:       ${format(parseISO(session.sessionDate), "dd MMMM yyyy")}`,
    `Focus:      ${session.focusArea ?? "—"}`,
    `Type:       ${SESSION_TYPE_MAP[session.sessionType ?? ""]?.label ?? session.sessionType ?? "—"}`,
    `Duration:   ${session.durationMins ?? 60} mins`,
    ``,
    `SUMMARY`,
    `───────────────────────────────────────`,
    session.notes ?? "(No notes recorded for this session.)",
    ``,
    `ACTION ITEMS`,
    `───────────────────────────────────────`,
    ...((session.actions as ActionItem[] | null) ?? []).map(
      (a, i) => `${i + 1}. [${a.done ? "✓" : " "}] ${a.text}`
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `session-notes-${session.sessionDate}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Checklist section ─────────────────────────────────────────────────────────

function ActionChecklist({
  items,
  onToggle,
  isToggling,
}: {
  items: ActionItem[];
  onToggle: (sessionId: string, itemId: string) => void;
  isToggling: string | null;
}) {
  const [showDone, setShowDone] = useState(false);
  const pending = items.filter((a) => !a.done);
  const done = items.filter((a) => a.done);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-slate-400 text-sm font-medium">No action items yet</p>
        <p className="text-slate-500 text-xs mt-1">Action items will appear here after your first coaching session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Pending */}
      {pending.length === 0 && (
        <div className="flex items-center gap-2 py-3 px-3 rounded-lg bg-emerald-900/20 border border-emerald-800/40">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-sm font-medium">All caught up! No pending items.</p>
        </div>
      )}

      {pending.map((item) => (
        <ActionItemRow
          key={`${item.sessionId}-${item.id}`}
          item={item}
          onToggle={onToggle}
          isToggling={isToggling}
        />
      ))}

      {/* Completed */}
      {done.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowDone((p) => !p)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2"
          >
            {showDone ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {done.length} completed item{done.length !== 1 ? "s" : ""}
          </button>
          {showDone && done.map((item) => (
            <ActionItemRow
              key={`${item.sessionId}-${item.id}`}
              item={item}
              onToggle={onToggle}
              isToggling={isToggling}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionItemRow({
  item,
  onToggle,
  isToggling,
}: {
  item: ActionItem;
  onToggle: (sessionId: string, itemId: string) => void;
  isToggling: string | null;
}) {
  const key = `${item.sessionId}-${item.id}`;
  const busy = isToggling === key;

  return (
    <button
      onClick={() => onToggle(item.sessionId, item.id)}
      disabled={busy}
      className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all group
        ${item.done
          ? "border-slate-700/50 bg-slate-800/30 opacity-60"
          : "border-slate-700 bg-slate-800/60 hover:border-purple-600/60 hover:bg-slate-800"
        }`}
    >
      <div className="mt-0.5 shrink-0">
        {busy ? (
          <div className="w-4 h-4 rounded border border-slate-500 animate-pulse" />
        ) : item.done ? (
          <CheckSquare className="w-4 h-4 text-emerald-400" />
        ) : (
          <Square className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${item.done ? "line-through text-slate-500" : "text-slate-200"}`}>
          {item.text}
        </p>
        {item.focusArea && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            From: {item.focusArea} · {format(parseISO(item.sessionDate), "d MMM yyyy")}
          </p>
        )}
      </div>
    </button>
  );
}

// ── Session timeline ──────────────────────────────────────────────────────────

function SessionTimeline({ sessions }: { sessions: Session[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const past = sessions.filter((s) => s.sessionDate < today);
  const upcoming = sessions.filter((s) => s.sessionDate >= today);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-slate-400 text-sm font-medium">No sessions logged yet</p>
        <p className="text-slate-500 text-xs mt-1">Your session history will appear here after your first coaching session.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2.5">Upcoming</p>
          <div className="space-y-2">
            {upcoming.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                expanded={expandedId === s.id}
                onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                isUpcoming
              />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Session History</p>
          <div className="relative pl-4">
            {/* vertical line */}
            <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-700/60" />
            <div className="space-y-3">
              {past.map((s) => (
                <div key={s.id} className="relative">
                  {/* dot */}
                  <div className="absolute -left-[19px] top-3.5 w-2.5 h-2.5 rounded-full border-2 border-slate-500 bg-slate-900" />
                  <SessionCard
                    session={s}
                    expanded={expandedId === s.id}
                    onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    isUpcoming={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  expanded,
  onToggle,
  isUpcoming,
}: {
  session: Session;
  expanded: boolean;
  onToggle: () => void;
  isUpcoming: boolean;
}) {
  const actions = (session.actions as ActionItem[] | null) ?? [];
  const done = actions.filter((a) => a.done).length;

  return (
    <div className={`rounded-lg border transition-colors ${isUpcoming ? "border-purple-700/40 bg-purple-950/20" : "border-slate-700/60 bg-slate-800/40"}`}>
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-3.5 text-left"
      >
        <div className={`shrink-0 mt-0.5 p-1.5 rounded-md ${isUpcoming ? "bg-purple-900/50" : "bg-slate-700/50"}`}>
          {isUpcoming
            ? <CalendarClock className="w-3.5 h-3.5 text-purple-400" />
            : <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isUpcoming ? "text-purple-200" : "text-slate-200"}`}>
              {format(parseISO(session.sessionDate), "d MMMM yyyy")}
            </span>
            <SessionTypeBadge type={session.sessionType} />
          </div>
          {session.focusArea && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{session.focusArea}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            {session.durationMins && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Timer className="w-3 h-3" /> {session.durationMins}m
              </span>
            )}
            {actions.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CheckSquare className="w-3 h-3" /> {done}/{actions.length} done
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-slate-500 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-700/40 space-y-3">
          {/* Notes */}
          {session.notes ? (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Summary Notes</p>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 rounded-md p-3 border border-slate-700/40">
                {session.notes}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No summary notes for this session.</p>
          )}

          {/* Action items mini-list */}
          {actions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Action Items from this Session
              </p>
              <div className="space-y-1">
                {actions.map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    {a.done
                      ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      : <Square className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                    }
                    <span className={`text-xs ${a.done ? "line-through text-slate-500" : "text-slate-300"}`}>
                      {a.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download */}
          {session.notes && (
            <button
              onClick={() => downloadNotes(session)}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download session notes (.txt)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CoachingFounder() {
  const { selectedVenture, loading: ventureLoading } = useSelectedVenture();
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const ventureId = selectedVenture?.id ?? "";

  const { data, isLoading, refetch } = trpc.coaching.dashboard.getFounderDashboardData.useQuery(
    { ventureId },
    { enabled: !!ventureId, refetchInterval: 60_000 }
  );

  const utils = trpc.useUtils();

  const toggleItem = trpc.coaching.sessions.toggleActionItem.useMutation({
    onMutate: ({ sessionId, itemId }) => {
      setTogglingKey(`${sessionId}-${itemId}`);
    },
    onSuccess: (result) => {
      toast.success(result.done ? "Marked complete" : "Marked pending");
      utils.coaching.dashboard.getFounderDashboardData.invalidate({ ventureId });
    },
    onError: () => toast.error("Failed to update action item"),
    onSettled: () => setTogglingKey(null),
  });

  function handleToggle(sessionId: string, itemId: string) {
    toggleItem.mutate({ sessionId, itemId });
  }

  // ── Loading / empty states ──

  if (ventureLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedVenture) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <AlertCircle className="w-10 h-10 text-slate-500" />
        <p className="text-slate-400 text-sm">Select a venture from the sidebar dropdown to view the Founder Dashboard.</p>
      </div>
    );
  }

  const next = data?.nextSession ?? null;
  const countdown = next ? getCountdown(next.sessionDate) : null;
  const pendingCount = data?.pendingCount ?? 0;
  const allItems: ActionItem[] = data?.allActionItems ?? [];
  const sessions: Session[] = (data?.sessions ?? []) as Session[];

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Founder Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {selectedVenture.name} · Coaching Sub-Module 1
          </p>
        </div>
        <Badge className="bg-purple-900/60 text-purple-300 border border-purple-700 text-xs">
          Module 13
        </Badge>
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Next Session card */}
        <Card className={`border transition-colors ${next ? (countdown?.urgent ? "bg-amber-950/20 border-amber-700/50" : "bg-slate-900 border-slate-700") : "bg-slate-900 border-slate-700"}`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${next ? (countdown?.urgent ? "bg-amber-900/40" : "bg-purple-900/40") : "bg-slate-800"}`}>
                <CalendarClock className={`w-6 h-6 ${next ? (countdown?.urgent ? "text-amber-400" : "text-purple-400") : "text-slate-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  Next Scheduled Session
                </p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-slate-700 rounded animate-pulse mt-1" />
                ) : next ? (
                  <>
                    <p className={`text-3xl font-bold leading-none ${countdown?.urgent ? "text-amber-400" : "text-white"}`}>
                      {countdown?.label}
                    </p>
                    <p className="text-sm text-slate-300 mt-1.5 font-medium">
                      {format(parseISO(next.sessionDate), "EEEE, d MMMM yyyy")}
                    </p>
                    {next.focusArea && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{next.focusArea}</p>
                    )}
                    {next.coachName && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-400">{next.coachName}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-slate-500 leading-none mt-1">Not scheduled</p>
                    <p className="text-xs text-slate-500 mt-1.5">No upcoming sessions found for this venture.</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Action Items card */}
        <Card className={`border transition-colors ${pendingCount > 0 ? "bg-slate-900 border-slate-700" : "bg-emerald-950/20 border-emerald-800/40"}`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${pendingCount > 0 ? "bg-orange-900/30" : "bg-emerald-900/30"}`}>
                <ClipboardList className={`w-6 h-6 ${pendingCount > 0 ? "text-orange-400" : "text-emerald-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  Pending Coach Action Items
                </p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-700 rounded animate-pulse mt-1" />
                ) : (
                  <>
                    <p className={`text-5xl font-bold leading-none ${pendingCount > 0 ? "text-orange-400" : "text-emerald-400"}`}>
                      {pendingCount}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {pendingCount === 0
                        ? "All action items completed — great work!"
                        : `${allItems.filter((a) => a.done).length} of ${allItems.length} total items completed`
                      }
                    </p>
                    {allItems.length > 0 && (
                      <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-emerald-500"
                          style={{ width: `${Math.round((allItems.filter((a) => a.done).length / allItems.length) * 100)}%` }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Two-column body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left: Coach Action Items checklist */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3 border-b border-slate-700/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-purple-400" />
                Coach Action Items
              </CardTitle>
              {allItems.length > 0 && (
                <Badge className={`text-xs border ${pendingCount > 0 ? "bg-orange-900/40 text-orange-300 border-orange-700" : "bg-emerald-900/40 text-emerald-300 border-emerald-700"}`}>
                  {pendingCount} pending
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tasks assigned by your coach across all sessions. Tap to mark complete.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-14 bg-slate-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <ActionChecklist
                items={allItems}
                onToggle={handleToggle}
                isToggling={togglingKey}
              />
            )}
          </CardContent>
        </Card>

        {/* Right: Session history timeline */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3 border-b border-slate-700/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Session Log
              </CardTitle>
              {sessions.length > 0 && (
                <Badge className="bg-slate-700 text-slate-300 border border-slate-600 text-xs">
                  {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tap any session to view notes and action items. Download summaries as .txt.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <SessionTimeline sessions={sessions} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
