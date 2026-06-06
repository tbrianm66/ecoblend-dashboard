// ============================================================
// INTERVIEW TRACKER — Database-backed with AI Summarisation
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  MessageSquare, Plus, User, Calendar, ChevronDown, ChevronUp,
  Sparkles, Loader2, Trash2, Brain,
} from "lucide-react";

const VENTURES = [
  { id: "ecoblend-rd", name: "EcoRace", color: "#56A837" },
  { id: "ecoblend",    name: "EcoComp",     color: "#56A837" },
  { id: "bebus",       name: "BEBUS",        color: "#3B85BA" },
  { id: "tone",        name: "TONE",         color: "#F69111" },
  { id: "real",        name: "REAL",         color: "#ef4444" },
  { id: "pipe",        name: "PIPE",         color: "#0ea5e9" },
];

const VRL_STAGES = [
  "VRL 1 — Fundamentals",
  "VRL 2 — Kickoff",
  "VRL 3 — Go-to-Market",
  "VRL 4 — Scaling",
];

const CHANNELS = ["In-Person", "Video", "Phone", "Survey"] as const;

function InterviewCard({
  interview,
  ventureColor,
  onDelete,
  onSummarise,
  isSummarising,
}: {
  interview: any;
  ventureColor: string;
  onDelete: () => void;
  onSummarise: (transcript: string) => void;
  isSummarising: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState(interview.rawTranscript ?? "");

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${ventureColor}` }}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
          style={{ background: ventureColor }}>
          <User size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-900">
              {interview.intervieweeName ?? "Anonymous"}
            </span>
            {interview.intervieweeRole && (
              <span className="text-xs text-gray-400">· {interview.intervieweeRole}</span>
            )}
            {interview.intervieweeOrg && (
              <span className="text-xs text-gray-400">@ {interview.intervieweeOrg}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {interview.date && (
              <span className="flex items-center gap-1"><Calendar size={10} /> {interview.date}</span>
            )}
            {interview.channel && <span>{interview.channel}</span>}
            {interview.vrlStageRelevant && (
              <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                VRL {interview.vrlStageRelevant}
              </span>
            )}
            {interview.aiSummary && (
              <span className="flex items-center gap-1 text-violet-500">
                <Brain size={10} /> AI Summary
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-gray-300" /> : <ChevronDown size={14} className="text-gray-300" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "#f3f4f6" }}>
          {interview.aiSummary && (
            <div className="p-3 rounded-lg" style={{ background: "#f5f3ff" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Brain size={12} style={{ color: "#7c3aed" }} />
                <span className="text-xs font-semibold" style={{ color: "#7c3aed" }}>AI Summary</span>
              </div>
              <p className="text-xs text-gray-700">{interview.aiSummary}</p>
            </div>
          )}
          {interview.keyInsights && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Key Insights</div>
              <p className="text-xs text-gray-700 whitespace-pre-line">{interview.keyInsights}</p>
            </div>
          )}
          {interview.painPoints && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Pain Points</div>
              <p className="text-xs text-gray-700 whitespace-pre-line">{interview.painPoints}</p>
            </div>
          )}
          {interview.validationSignals && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Validation Signals</div>
              <p className="text-xs text-gray-700 whitespace-pre-line">{interview.validationSignals}</p>
            </div>
          )}

          {/* Transcript + AI summarise */}
          <div className="border rounded-lg p-3" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">Raw Transcript</span>
              <button
                className="text-xs text-gray-400 underline"
                onClick={() => setShowTranscript(t => !t)}
              >
                {showTranscript ? "Hide" : "Show / Edit"}
              </button>
            </div>
            {showTranscript && (
              <>
                <Textarea
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  rows={6}
                  className="text-xs mb-2"
                  placeholder="Paste the interview transcript here to enable AI summarisation..."
                />
                <Button
                  size="sm"
                  className="gap-1.5 text-xs w-full"
                  style={{ background: "#7c3aed", color: "white" }}
                  disabled={!transcript || isSummarising}
                  onClick={() => onSummarise(transcript)}
                >
                  {isSummarising ? <><Loader2 size={12} className="animate-spin" /> Summarising...</> : <><Sparkles size={12} /> AI Summarise</>}
                </Button>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6 text-red-400 border-red-200 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 size={10} className="mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InterviewTracker() {
  const utils = trpc.useUtils();
  const [selectedVenture, setSelectedVenture] = useState("ecoblend");
  const [showAdd, setShowAdd] = useState(false);
  const [summarising, setSummarising] = useState<number | null>(null);
  const [form, setForm] = useState({
    intervieweeName: "", intervieweeRole: "", intervieweeOrg: "",
    date: "", channel: "Video" as typeof CHANNELS[number],
    keyInsights: "", painPoints: "", validationSignals: "",
    vrlStageRelevant: 1,
  });

  const venture = VENTURES.find(v => v.id === selectedVenture);
  const { data: interviews = [], isLoading } = trpc.interviews.list.useQuery({ ventureId: selectedVenture });

  const addMutation = trpc.interviews.add.useMutation({
    onSuccess: () => {
      utils.interviews.list.invalidate({ ventureId: selectedVenture });
      setShowAdd(false);
      setForm({ intervieweeName: "", intervieweeRole: "", intervieweeOrg: "", date: "", channel: "Video", keyInsights: "", painPoints: "", validationSignals: "", vrlStageRelevant: 1 });
      toast.success("Interview logged");
    },
    onError: () => toast.error("Failed to log interview"),
  });

  const deleteMutation = trpc.interviews.delete.useMutation({
    onSuccess: () => { utils.interviews.list.invalidate({ ventureId: selectedVenture }); toast.success("Interview deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const summariseMutation = trpc.interviews.summarise.useMutation({
    onSuccess: (_, vars) => {
      utils.interviews.list.invalidate({ ventureId: selectedVenture });
      setSummarising(null);
      toast.success("AI summary generated");
    },
    onError: () => { setSummarising(null); toast.error("AI summarisation failed"); },
  });

  const handleSummarise = (id: number, transcript: string) => {
    setSummarising(id);
    summariseMutation.mutate({ id, rawTranscript: transcript, ventureId: selectedVenture });
  };

  const totalInterviews = interviews.length;
  const withAiSummary = interviews.filter(i => i.aiSummary).length;
  const vrlCoverage = new Set(interviews.map(i => i.vrlStageRelevant).filter(Boolean)).size;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={16} style={{ color: "#16a34a" }} />
              <span className="vos-badge vos-badge-success" style={{ fontSize: "0.65rem" }}>Customer Discovery</span>
            </div>
            <h1 className="vos-page-title mb-1">Interview Tracker</h1>
            <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              Log customer discovery interviews. Paste transcripts to generate AI-powered structured summaries.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            style={{ background: "#16a34a", color: "white" }}
            onClick={() => setShowAdd(true)}
          >
            <Plus size={13} /> Log Interview
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5">
          {[
            { label: "Interviews Logged", value: totalInterviews, sub: "discovery sessions", color: "#16a34a" },
            { label: "AI Summaries", value: withAiSummary, sub: "auto-generated", color: "#7c3aed" },
            { label: "VRL Stages Covered", value: `${vrlCoverage}/4`, sub: "stages validated", color: "#3B85BA" },
          ].map(k => (
            <div key={k.label} className="vos-metric">
              <span className="vos-metric-label">{k.label}</span>
              <span className="vos-metric-value" style={{ color: k.color }}>{k.value}</span>
              <span className="vos-metric-sub">{k.sub}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Venture selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {VENTURES.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVenture(v.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={selectedVenture === v.id
                ? { background: v.color, color: "white", borderColor: v.color }
                : { background: "white", color: "#6b7280", borderColor: "#e5e7eb" }
              }
            >
              {v.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading interviews...</div>
        ) : interviews.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
            <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No interviews logged for {venture?.name} yet.</p>
            <p className="text-xs text-gray-300 mt-1">Log your first customer discovery interview to start building validation evidence.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map(interview => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                ventureColor={venture?.color ?? "#56A837"}
                onDelete={() => deleteMutation.mutate({ id: interview.id })}
                onSummarise={(transcript) => handleSummarise(interview.id, transcript)}
                isSummarising={summarising === interview.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Interview Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare size={16} style={{ color: "#16a34a" }} />
              Log Interview — {venture?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Interviewee Name</label>
                <Input placeholder="Full name" value={form.intervieweeName} onChange={e => setForm(f => ({ ...f, intervieweeName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Role / Title</label>
                <Input placeholder="e.g. Procurement Manager" value={form.intervieweeRole} onChange={e => setForm(f => ({ ...f, intervieweeRole: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Organisation</label>
                <Input placeholder="Company or institution" value={form.intervieweeOrg} onChange={e => setForm(f => ({ ...f, intervieweeOrg: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Date</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Channel</label>
                <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v as any }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">VRL Stage Relevant</label>
                <Select value={String(form.vrlStageRelevant)} onValueChange={v => setForm(f => ({ ...f, vrlStageRelevant: parseInt(v) }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(n => <SelectItem key={n} value={String(n)} className="text-xs">VRL {n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Key Insights</label>
              <Textarea placeholder="Main takeaways from the interview" value={form.keyInsights} onChange={e => setForm(f => ({ ...f, keyInsights: e.target.value }))} rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Pain Points</label>
              <Textarea placeholder="Problems or frustrations expressed" value={form.painPoints} onChange={e => setForm(f => ({ ...f, painPoints: e.target.value }))} rows={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Validation Signals</label>
              <Textarea placeholder="Evidence supporting or challenging the hypothesis" value={form.validationSignals} onChange={e => setForm(f => ({ ...f, validationSignals: e.target.value }))} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button
                size="sm"
                style={{ background: "#16a34a", color: "white" }}
                disabled={addMutation.isPending}
                onClick={() => addMutation.mutate({ ventureId: selectedVenture, ...form })}
              >
                {addMutation.isPending ? "Logging..." : "Log Interview"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
