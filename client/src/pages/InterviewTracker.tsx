// ============================================================
// ECOBLEND INTERVIEW TRACKER
// Brand: EcoBlend — Green #51AF37, Blue #3A97D3, Orange #F49C13
// Typography: Prompt (headings) + Nunito (body)
// ============================================================

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MessageSquare, Plus, CheckCircle2, XCircle, Clock,
  User, Calendar, Tag, ChevronDown, ChevronUp, Trash2
} from "lucide-react";

type HypothesisStatus = "Validated" | "Invalidated" | "Partial" | "Pending";
type InterviewStatus = "Scheduled" | "Completed" | "Cancelled";

// BMC blocks: Key Partners, Key Activities, Key Resources, Value Propositions,
//   Customer Relationships, Channels, Customer Segments, Cost Structure, Revenue Streams
// MMC blocks: Mission, Beneficiaries, Value Created, Key Partners (Mission), Key Activities (Mission),
//   Key Resources (Mission), Channels (Mission), Cost Structure (Mission), Revenue/Funding Streams
type BmcBlock =
  | "Value Propositions" | "Customer Segments" | "Channels" | "Customer Relationships"
  | "Revenue Streams" | "Key Resources" | "Key Activities" | "Key Partners" | "Cost Structure";

type MmcBlock =
  | "Mission" | "Beneficiaries" | "Value Created" | "Key Partners (Mission)"
  | "Key Activities (Mission)" | "Key Resources (Mission)" | "Channels (Mission)"
  | "Cost Structure (Mission)" | "Funding Streams";

interface Hypothesis {
  id: string;
  text: string;
  status: HypothesisStatus;
  bmcBlock?: BmcBlock;
  mmcBlock?: MmcBlock;
}

interface Interview {
  id: string;
  ventureId: string;
  interviewee: string;
  role: string;
  date: string;
  status: InterviewStatus;
  phase: string;
  keyInsights: string;
  hypotheses: Hypothesis[];
}

const VENTURE_OPTIONS = [
  { id: "ecoblend-rd", label: "EcoBlend R&D", color: "#51AF37" },
  { id: "bebus",       label: "BEBUS",         color: "#3A97D3" },
  { id: "tone",        label: "TONE",           color: "#F49C13" },
  { id: "real",        label: "REAL",           color: "#f1c411" },
];

const PHASE_OPTIONS = [
  "VRL 1 — Fundamentals",
  "VRL 2 — Kickoff",
  "VRL 3 — Go-to-Market",
  "VRL 4 — Scaling",
];

const HYPOTHESIS_STATUS_COLOURS: Record<HypothesisStatus, string> = {
  Validated:   "#51AF37",
  Invalidated: "#ef4444",
  Partial:     "#F49C13",
  Pending:     "#9ca3af",
};

const INTERVIEW_STATUS_COLOURS: Record<InterviewStatus, string> = {
  Completed:  "#51AF37",
  Scheduled:  "#3A97D3",
  Cancelled:  "#9ca3af",
};

const INITIAL_INTERVIEWS: Interview[] = [
  {
    id: "i1",
    ventureId: "bebus",
    interviewee: "James Thornton",
    role: "Head of Procurement, National Bus Company",
    date: "2026-03-05",
    status: "Completed",
    phase: "VRL 2 — Kickoff",
    keyInsights: "OEMs are actively seeking Scope 3 reduction solutions. TCO is the primary decision driver, not upfront cost. Ingredient brand credibility matters — they want to see TRL 5+ validation before supplier conversations.",
    hypotheses: [
      { id: "h1", text: "OEMs will pay a premium for certified eco-materials", status: "Validated" },
      { id: "h2", text: "Procurement decisions are made at board level", status: "Partial" },
      { id: "h3", text: "TRL 4 is sufficient for initial supplier qualification", status: "Invalidated" },
    ],
  },
  {
    id: "i2",
    ventureId: "tone",
    interviewee: "Priya Mehta",
    role: "Sustainability Manager, Live Events Co.",
    date: "2026-03-10",
    status: "Scheduled",
    phase: "VRL 2 — Kickoff",
    keyInsights: "",
    hypotheses: [
      { id: "h4", text: "Event organisers will pay 15% premium for eco-certified products", status: "Pending" },
      { id: "h5", text: "Brand story is more important than price for D2C eco products", status: "Pending" },
    ],
  },
  {
    id: "i3",
    ventureId: "real",
    interviewee: "Marcus Webb",
    role: "Elite Rugby Player & Brand Ambassador",
    date: "2026-02-28",
    status: "Completed",
    phase: "VRL 1 — Fundamentals",
    keyInsights: "Performance is non-negotiable — athletes will not accept any reduction in protection characteristics for sustainability. Eco credentials are a 'nice to have' that becomes a 'must have' once performance is proven. Athlete ambassador model is very compelling.",
    hypotheses: [
      { id: "h6", text: "Athletes prioritise performance over eco credentials", status: "Validated" },
      { id: "h7", text: "Social media reach drives D2C sales in sports protection", status: "Validated" },
    ],
  },
];

const emptyInterview = (): Omit<Interview, "id"> => ({
  ventureId: "tone",
  interviewee: "",
  role: "",
  date: new Date().toISOString().split("T")[0],
  status: "Scheduled",
  phase: "VRL 2 — Kickoff",
  keyInsights: "",
  hypotheses: [{ id: "h-new-1", text: "", status: "Pending" }],
});

function HypothesisStatusIcon({ status }: { status: HypothesisStatus }) {
  if (status === "Validated")   return <CheckCircle2 size={14} style={{ color: "#51AF37" }} />;
  if (status === "Invalidated") return <XCircle size={14} style={{ color: "#ef4444" }} />;
  if (status === "Partial")     return <Clock size={14} style={{ color: "#F49C13" }} />;
  return <Clock size={14} style={{ color: "#9ca3af" }} />;
}

function InterviewCard({
  interview,
  onUpdate,
  onDelete,
}: {
  interview: Interview;
  onUpdate: (updated: Interview) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const venture = VENTURE_OPTIONS.find(v => v.id === interview.ventureId);
  const statusColor = INTERVIEW_STATUS_COLOURS[interview.status];
  const validatedCount = interview.hypotheses.filter(h => h.status === "Validated").length;
  const invalidatedCount = interview.hypotheses.filter(h => h.status === "Invalidated").length;

  const toggleHypothesis = (hId: string) => {
    const cycle: HypothesisStatus[] = ["Pending", "Validated", "Partial", "Invalidated"];
    const updated = interview.hypotheses.map(h => {
      if (h.id !== hId) return h;
      const idx = cycle.indexOf(h.status);
      return { ...h, status: cycle[(idx + 1) % cycle.length] };
    });
    onUpdate({ ...interview, hypotheses: updated });
  };

  return (
    <div
      className="bg-white rounded-xl border shadow-sm overflow-hidden"
      style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${venture?.color || "#51AF37"}` }}
    >
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="font-bold text-base"
                style={{ fontFamily: "'Prompt', sans-serif", color: "#1a2332" }}
              >
                {interview.interviewee}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${statusColor}15`, color: statusColor, fontFamily: "'Nunito', sans-serif" }}
              >
                {interview.status}
              </span>
              {venture && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${venture.color}15`, color: venture.color, fontFamily: "'Nunito', sans-serif" }}
                >
                  {venture.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <User size={11} />
                {interview.role}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {interview.date}
              </span>
              <span className="flex items-center gap-1">
                <Tag size={11} />
                {interview.phase}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-0.5">Hypotheses</div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold" style={{ color: "#51AF37" }}>{validatedCount}✓</span>
                <span className="text-xs font-bold" style={{ color: "#ef4444" }}>{invalidatedCount}✗</span>
                <span className="text-xs text-gray-400">{interview.hypotheses.length - validatedCount - invalidatedCount} pending</span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(interview.id); }}
              className="p-1.5 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} style={{ color: "#ef4444" }} />
            </button>
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: "#f3f4f6" }}>
          {/* Key Insights */}
          {interview.status === "Completed" && (
            <div className="mt-4 mb-4">
              <div
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: "#9ca3af", fontFamily: "'Nunito', sans-serif" }}
              >
                Key Insights
              </div>
              <textarea
                className="w-full text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border resize-none"
                style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif", minHeight: "80px" }}
                value={interview.keyInsights}
                onChange={(e) => onUpdate({ ...interview, keyInsights: e.target.value })}
                placeholder="Record key insights from this interview..."
              />
            </div>
          )}

          {/* Hypotheses with BMC/MMC linking */}
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "#9ca3af", fontFamily: "'Nunito', sans-serif" }}
            >
              Hypotheses — Click status to cycle · Click canvas tag to link
            </div>
            <div className="space-y-2">
              {interview.hypotheses.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-lg border transition-colors"
                  style={{ borderColor: `${HYPOTHESIS_STATUS_COLOURS[h.status]}30`, background: `${HYPOTHESIS_STATUS_COLOURS[h.status]}05` }}
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => toggleHypothesis(h.id)}
                  >
                    <HypothesisStatusIcon status={h.status} />
                    <span className="text-sm flex-1" style={{ fontFamily: "'Nunito', sans-serif" }}>{h.text}</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: `${HYPOTHESIS_STATUS_COLOURS[h.status]}15`,
                        color: HYPOTHESIS_STATUS_COLOURS[h.status],
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      {h.status}
                    </span>
                  </div>
                  {/* BMC / MMC block tags */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>Links to:</span>
                    {/* BMC block selector */}
                    <select
                      className="text-xs rounded-md border px-2 py-0.5 cursor-pointer"
                      style={{
                        borderColor: "#3A97D320",
                        background: h.bmcBlock ? "#3A97D310" : "#f9fafb",
                        color: h.bmcBlock ? "#1e40af" : "#9ca3af",
                        fontFamily: "'Nunito', sans-serif",
                      }}
                      value={h.bmcBlock || ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const val = e.target.value as BmcBlock | "";
                        const updated = interview.hypotheses.map(hh =>
                          hh.id === h.id ? { ...hh, bmcBlock: val || undefined } : hh
                        );
                        onUpdate({ ...interview, hypotheses: updated });
                      }}
                    >
                      <option value="">BMC Block…</option>
                      {(["Value Propositions","Customer Segments","Channels","Customer Relationships","Revenue Streams","Key Resources","Key Activities","Key Partners","Cost Structure"] as BmcBlock[]).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {/* MMC block selector */}
                    <select
                      className="text-xs rounded-md border px-2 py-0.5 cursor-pointer"
                      style={{
                        borderColor: "#51AF3720",
                        background: h.mmcBlock ? "#51AF3710" : "#f9fafb",
                        color: h.mmcBlock ? "#166534" : "#9ca3af",
                        fontFamily: "'Nunito', sans-serif",
                      }}
                      value={h.mmcBlock || ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const val = e.target.value as MmcBlock | "";
                        const updated = interview.hypotheses.map(hh =>
                          hh.id === h.id ? { ...hh, mmcBlock: val || undefined } : hh
                        );
                        onUpdate({ ...interview, hypotheses: updated });
                      }}
                    >
                      <option value="">MMC Block…</option>
                      {(["Mission","Beneficiaries","Value Created","Key Partners (Mission)","Key Activities (Mission)","Key Resources (Mission)","Channels (Mission)","Cost Structure (Mission)","Funding Streams"] as MmcBlock[]).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InterviewTracker() {
  const [interviews, setInterviews] = useState<Interview[]>(INITIAL_INTERVIEWS);
  const [filterVenture, setFilterVenture] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [newInterview, setNewInterview] = useState(emptyInterview());
  const [newHypText, setNewHypText] = useState("");

  const filtered = interviews.filter(i => {
    if (filterVenture !== "all" && i.ventureId !== filterVenture) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    return true;
  });

  const totalValidated = interviews.flatMap(i => i.hypotheses).filter(h => h.status === "Validated").length;
  const totalInvalidated = interviews.flatMap(i => i.hypotheses).filter(h => h.status === "Invalidated").length;
  const totalHypotheses = interviews.flatMap(i => i.hypotheses).length;

  const handleUpdate = (updated: Interview) => {
    setInterviews(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const handleDelete = (id: string) => {
    setInterviews(prev => prev.filter(i => i.id !== id));
    toast.success("Interview removed");
  };

  const handleAdd = () => {
    if (!newInterview.interviewee.trim()) {
      toast.error("Please enter an interviewee name");
      return;
    }
    const id = `i-${Date.now()}`;
    setInterviews(prev => [...prev, { ...newInterview, id }]);
    setNewInterview(emptyInterview());
    setNewHypText("");
    setAddOpen(false);
    toast.success("Interview added");
  };

  const addHypothesis = () => {
    if (!newHypText.trim()) return;
    setNewInterview(prev => ({
      ...prev,
      hypotheses: [...prev.hypotheses, { id: `h-${Date.now()}`, text: newHypText, status: "Pending" }],
    }));
    setNewHypText("");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={18} style={{ color: "#51AF37" }} />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#51AF37", fontFamily: "'Nunito', sans-serif" }}
              >
                H4 Beneficiary Discovery
              </span>
            </div>
            <h1
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "'Prompt', sans-serif" }}
            >
              Customer Interview Tracker
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Log and track all customer discovery interviews per venture. Record insights, validate or invalidate hypotheses, and monitor H4 Beneficiary Discovery progress.
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="gap-2"
            style={{ background: "#51AF37", color: "white", fontFamily: "'Prompt', sans-serif" }}
          >
            <Plus size={15} /> Add Interview
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Total Interviews", value: interviews.length, color: "#1a2332" },
            { label: "Completed", value: interviews.filter(i => i.status === "Completed").length, color: "#51AF37" },
            { label: "Hypotheses Validated", value: totalValidated, color: "#51AF37" },
            { label: "Hypotheses Invalidated", value: totalInvalidated, color: "#ef4444" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-gray-50 rounded-xl p-4 border" style={{ borderColor: "#e5e7eb" }}>
              <div
                className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {kpi.label}
              </div>
              <div
                className="text-3xl font-bold"
                style={{ color: kpi.color, fontFamily: "'Prompt', sans-serif" }}
              >
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Hypothesis validation summary bar */}
        {totalHypotheses > 0 && (
          <div className="bg-white rounded-xl border p-5 mb-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div
              className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Portfolio Hypothesis Validation — {totalHypotheses} total
            </div>
            <div className="flex rounded-full overflow-hidden h-4">
              <div style={{ width: `${(totalValidated / totalHypotheses) * 100}%`, background: "#51AF37" }} title="Validated" />
              <div style={{ width: `${(totalInvalidated / totalHypotheses) * 100}%`, background: "#ef4444" }} title="Invalidated" />
              <div style={{ width: `${(interviews.flatMap(i => i.hypotheses).filter(h => h.status === "Partial").length / totalHypotheses) * 100}%`, background: "#F49C13" }} title="Partial" />
              <div className="flex-1 bg-gray-200" title="Pending" />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
              {[
                { label: "Validated", color: "#51AF37", count: totalValidated },
                { label: "Invalidated", color: "#ef4444", count: totalInvalidated },
                { label: "Partial", color: "#F49C13", count: interviews.flatMap(i => i.hypotheses).filter(h => h.status === "Partial").length },
                { label: "Pending", color: "#9ca3af", count: interviews.flatMap(i => i.hypotheses).filter(h => h.status === "Pending").length },
              ].map(s => (
                <span key={s.label} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />
                  {s.count} {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Filter:
          </span>
          <div className="flex gap-2 flex-wrap">
            {["all", ...VENTURE_OPTIONS.map(v => v.id)].map(v => {
              const label = v === "all" ? "All Ventures" : VENTURE_OPTIONS.find(o => o.id === v)?.label || v;
              const color = v === "all" ? "#6b7280" : VENTURE_OPTIONS.find(o => o.id === v)?.color || "#6b7280";
              return (
                <button
                  key={v}
                  onClick={() => setFilterVenture(v)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                  style={{
                    background: filterVenture === v ? `${color}20` : "#f3f4f6",
                    color: filterVenture === v ? color : "#6b7280",
                    border: `1px solid ${filterVenture === v ? `${color}40` : "#e5e7eb"}`,
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 ml-2 flex-wrap">
            {(["all", "Completed", "Scheduled", "Cancelled"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={{
                  background: filterStatus === s ? "#3A97D320" : "#f3f4f6",
                  color: filterStatus === s ? "#3A97D3" : "#6b7280",
                  border: `1px solid ${filterStatus === s ? "#3A97D340" : "#e5e7eb"}`,
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {s === "all" ? "All Statuses" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Interview list */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>No interviews match the current filters.</p>
            </div>
          ) : (
            filtered.map(interview => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Add Interview Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Prompt', sans-serif" }}>Add New Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>Venture</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                  value={newInterview.ventureId}
                  onChange={e => setNewInterview(p => ({ ...p, ventureId: e.target.value }))}
                >
                  {VENTURE_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>Status</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                  value={newInterview.status}
                  onChange={e => setNewInterview(p => ({ ...p, status: e.target.value as InterviewStatus }))}
                >
                  {(["Scheduled", "Completed", "Cancelled"] as InterviewStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>Interviewee Name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                value={newInterview.interviewee}
                onChange={e => setNewInterview(p => ({ ...p, interviewee: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>Role / Organisation</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                value={newInterview.role}
                onChange={e => setNewInterview(p => ({ ...p, role: e.target.value }))}
                placeholder="e.g. Head of Procurement, Acme Corp"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                  value={newInterview.date}
                  onChange={e => setNewInterview(p => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>Playbook Phase</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                  value={newInterview.phase}
                  onChange={e => setNewInterview(p => ({ ...p, phase: e.target.value }))}
                >
                  {PHASE_OPTIONS.map(ph => <option key={ph} value={ph}>{ph}</option>)}
                </select>
              </div>
            </div>
            {/* Hypotheses */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2" style={{ fontFamily: "'Nunito', sans-serif" }}>Hypotheses to Test</label>
              <div className="space-y-2 mb-2">
                {newInterview.hypotheses.map((h, idx) => (
                  <div key={h.id} className="flex items-center gap-2">
                    <input
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                      style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                      value={h.text}
                      onChange={e => {
                        const updated = [...newInterview.hypotheses];
                        updated[idx] = { ...h, text: e.target.value };
                        setNewInterview(p => ({ ...p, hypotheses: updated }));
                      }}
                      placeholder={`Hypothesis ${idx + 1}`}
                    />
                    <button
                      onClick={() => setNewInterview(p => ({ ...p, hypotheses: p.hypotheses.filter((_, i) => i !== idx) }))}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                  style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                  value={newHypText}
                  onChange={e => setNewHypText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addHypothesis()}
                  placeholder="Add hypothesis and press Enter or +"
                />
                <Button size="sm" variant="outline" onClick={addHypothesis}>
                  <Plus size={13} />
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button
                onClick={handleAdd}
                style={{ background: "#51AF37", color: "white", fontFamily: "'Prompt', sans-serif" }}
              >
                Add Interview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
