import { useState } from "react";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { trpc } from "@/lib/trpc";
import {
  GraduationCap, RefreshCw, Star, CheckCircle2,
  AlertTriangle, Clock, Send, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type SignOff = "Approved" | "Needs_Revision" | "Pending";

interface Review {
  id: number;
  advisorName: string;
  advisorRole: string;
  feedbackNotes: string;
  validationRating: number;
  signOffStatus: string;
  createdAt: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const SIGN_OFF: Record<SignOff, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Approved:       { label: "Approved",        color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircle2 size={13} /> },
  Needs_Revision: { label: "Needs Revision",  color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", icon: <AlertTriangle size={13} /> },
  Pending:        { label: "Pending",          color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: <Clock size={13} /> },
};

const ADVISOR_ROLES = [
  "Deep Tech Venture Capitalist",
  "Sustainability Auditor",
  "Market Strategy Advisor",
  "Materials Science Expert",
  "Impact Investment Analyst",
  "Regulatory Affairs Counsel",
  "Carbon Markets Specialist",
  "Consumer Electronics VC",
  "Retail Channel Strategist",
  "Supply Chain Resilience Advisor",
  "Development Finance Advisor",
];

const SIGN_OFF_OPTIONS: SignOff[] = ["Approved", "Needs_Revision", "Pending"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ratingColor(r: number) {
  if (r >= 8) return "#10b981";
  if (r >= 6) return "#2563eb";
  if (r >= 4) return "#f59e0b";
  return "#ef4444";
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ConsensusRing({ score, count }: { score: number; count: number }) {
  const r = 52, size = 128, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  const color = ratingColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={12} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ * 0.25}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={26} fontWeight="800" fill={color}>
          {score.toFixed(1)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="#9ca3af">/ 10</text>
      </svg>
      <div className="text-center">
        <div className="text-xs font-bold text-gray-700">Expert Consensus</div>
        <div className="text-xs text-gray-400">{count} advisor{count !== 1 ? "s" : ""}</div>
      </div>
    </div>
  );
}

// ── Star row ──────────────────────────────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} style={{ color: i < rating ? ratingColor(rating) : "#e5e7eb", fontSize: 10 }}>★</span>
      ))}
      <span className="ml-1.5 text-xs font-bold" style={{ color: ratingColor(rating) }}>{rating}/10</span>
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(true);
  const sc = SIGN_OFF[review.signOffStatus as SignOff] ?? SIGN_OFF.Pending;

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: sc.border }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3" style={{ background: sc.bg }}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
            style={{ background: ratingColor(review.validationRating) }}>
            {review.advisorName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{review.advisorName}</div>
            <div className="text-xs text-gray-500 mt-0.5">{review.advisorRole}</div>
            <div className="mt-1.5">
              <StarRow rating={review.validationRating} />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ color: sc.color, background: `${sc.color}18`, border: `1px solid ${sc.border}` }}>
            {sc.icon} {sc.label}
          </span>
          <span className="text-[10px] text-gray-400">{fmtDate(review.createdAt)}</span>
        </div>
      </div>
      {/* Body toggle */}
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 border-t transition-colors"
        style={{ borderColor: sc.border }}>
        <span>Feedback Notes</span>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {expanded && (
        <div className="px-4 py-3">
          <p className="text-sm text-gray-700 leading-relaxed">{review.feedbackNotes}</p>
        </div>
      )}
    </div>
  );
}

// ── Submit form ───────────────────────────────────────────────────────────────
function SubmitForm({ ventureId, onCreated }: { ventureId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    advisorName: "", advisorRole: ADVISOR_ROLES[0],
    feedbackNotes: "", validationRating: 7,
    signOffStatus: "Pending" as SignOff,
  });
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = trpc.collaboration.submitAdvisoryReview.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setOpen(false); }, 1500);
      onCreated();
      setForm({ advisorName: "", advisorRole: ADVISOR_ROLES[0], feedbackNotes: "", validationRating: 7, signOffStatus: "Pending" });
    },
    onError: (e) => setErr(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.advisorName.trim() || !form.feedbackNotes.trim()) {
      setErr("Advisor name and feedback notes are required.");
      return;
    }
    setErr("");
    submit.mutate({ ventureId, ...form });
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-gray-700 hover:text-indigo-600 transition-colors">
        <div className="flex items-center gap-2">
          <Send size={15} style={{ color: "#6366f1" }} />
          Simulate Advisor Review
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-gray-100 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Advisor Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Advisor Name <span className="text-red-400">*</span></label>
              <input value={form.advisorName} onChange={e => setForm(f => ({ ...f, advisorName: e.target.value }))}
                placeholder="e.g. Dr. Jane Smith"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            {/* Advisor Role */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Advisor Role</label>
              <select value={form.advisorRole} onChange={e => setForm(f => ({ ...f, advisorRole: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {ADVISOR_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Feedback Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Feedback Notes <span className="text-red-400">*</span></label>
            <textarea value={form.feedbackNotes} onChange={e => setForm(f => ({ ...f, feedbackNotes: e.target.value }))}
              rows={4} placeholder="Enter detailed advisory feedback, observations, and recommendations…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rating slider */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Validation Rating — <span style={{ color: ratingColor(form.validationRating) }}>{form.validationRating}/10</span>
              </label>
              <input type="range" min={0} max={10} step={1} value={form.validationRating}
                onChange={e => setForm(f => ({ ...f, validationRating: Number(e.target.value) }))}
                className="w-full accent-indigo-500" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>0</span><span>10</span></div>
            </div>
            {/* Sign-off */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sign-off Status</label>
              <div className="flex flex-col gap-1.5">
                {SIGN_OFF_OPTIONS.map(s => {
                  const cfg = SIGN_OFF[s];
                  return (
                    <label key={s} className="flex items-center gap-2 cursor-pointer text-xs font-semibold"
                      style={{ color: form.signOffStatus === s ? cfg.color : "#9ca3af" }}>
                      <input type="radio" name="signOff" value={s}
                        checked={form.signOffStatus === s}
                        onChange={() => setForm(f => ({ ...f, signOffStatus: s }))}
                        className="accent-indigo-500" />
                      <span className="flex items-center gap-1">{cfg.icon} {cfg.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle size={13} /> {err}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
              <CheckCircle2 size={13} /> Review submitted successfully
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submit.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold text-white transition-colors disabled:opacity-60"
              style={{ background: "#6366f1" }}>
              {submit.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              {submit.isPending ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdvisoryFunction() {
  const { selectedVentureId, selectedVenture } = useSelectedVenture();

  const { data: reviews = [], isLoading, refetch } = trpc.collaboration.getAdvisoryReviews.useQuery(
    { ventureId: selectedVentureId ?? "" },
    { enabled: !!selectedVentureId }
  );

  if (!selectedVentureId) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <GraduationCap size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold">Select a venture to view Advisory Function</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const avgScore = reviews.length
    ? reviews.reduce((s, r) => s + r.validationRating, 0) / reviews.length
    : 0;
  const approved = reviews.filter(r => r.signOffStatus === "Approved").length;
  const pending  = reviews.filter(r => r.signOffStatus === "Pending").length;
  const revision = reviews.filter(r => r.signOffStatus === "Needs_Revision").length;

  // Sort newest first
  const sorted = [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap size={18} style={{ color: "#6366f1" }} />
          <h1 className="text-xl font-bold text-gray-900">Advisory Function</h1>
        </div>
        <p className="text-sm text-gray-500">
          {selectedVenture?.name ?? selectedVentureId} — Expert Advisory Reviews & Sign-offs
        </p>
      </div>

      {/* Top summary */}
      <div className="rounded-2xl border p-5 bg-white shadow-sm flex flex-col sm:flex-row items-center gap-6"
        style={{ borderColor: "#e5e7eb" }}>
        <ConsensusRing score={avgScore} count={reviews.length} />
        <div className="flex-1 grid grid-cols-3 gap-4 w-full">
          <div className="rounded-xl border p-3 text-center" style={{ borderColor: "#bbf7d0", background: "#f0fdf4" }}>
            <div className="text-2xl font-extrabold text-emerald-600">{approved}</div>
            <div className="text-xs font-semibold text-emerald-500 mt-0.5">Approved</div>
          </div>
          <div className="rounded-xl border p-3 text-center" style={{ borderColor: "#fde68a", background: "#fffbeb" }}>
            <div className="text-2xl font-extrabold text-amber-500">{revision}</div>
            <div className="text-xs font-semibold text-amber-400 mt-0.5">Needs Revision</div>
          </div>
          <div className="rounded-xl border p-3 text-center" style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
            <div className="text-2xl font-extrabold text-gray-500">{pending}</div>
            <div className="text-xs font-semibold text-gray-400 mt-0.5">Pending</div>
          </div>
        </div>
      </div>

      {/* Submit form */}
      <SubmitForm ventureId={selectedVentureId} onCreated={() => refetch()} />

      {/* Review feed */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-bold text-gray-700">Advisory Timeline</span>
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs text-gray-400">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
        </div>
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-gray-400 text-sm">
            No advisory reviews yet — simulate one above.
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
