// ============================================================
// BOARD DECISION AUDIT TRAIL
// Structured decision log with vote recording, rationale tracking,
// mission alignment scoring, and implementation status.
// Phase 5 Medium-Term — Board Decision Audit Trail
// ============================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Plus, CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Users, Target, TrendingUp, Calendar,
  Shield, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ──
interface BoardDecision {
  id: string;
  ventureId: string;
  ventureName: string;
  decisionTitle: string;
  decisionType: string;
  description?: string;
  rationale?: string;
  missionAlignmentScore: number;
  financialImpact: string;
  strategicImpact: string;
  decisionDate: string;
  decisionStatus: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalBoardMembers: number;
  quorumMet: boolean;
  proposedBy?: string;
  approvedBy?: string;
  implementationDeadline?: string;
  implementationStatus: string;
  notes?: string;
  tags?: string;
  createdAt: string;
}

const DECISION_TYPES = [
  "Strategic Direction", "Investment / Funding", "Acquisition / Partnership",
  "Mission Amendment", "Leadership Change", "Risk Acceptance",
  "Product Launch", "Market Entry", "Governance Change", "General",
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  Approved:   { color: "#16a34a", bg: "#dcfce7", icon: CheckCircle2 },
  Rejected:   { color: "#dc2626", bg: "#fee2e2", icon: XCircle },
  Pending:    { color: "#d97706", bg: "#fef3c7", icon: Clock },
  Deferred:   { color: "#7c3aed", bg: "#ede9fe", icon: AlertTriangle },
  Withdrawn:  { color: "#6b7280", bg: "#f3f4f6", icon: XCircle },
};

const IMPACT_COLORS: Record<string, string> = {
  None: "#6b7280", Low: "#16a34a", Medium: "#d97706", High: "#ea580c", Critical: "#dc2626",
};

const IMPL_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  "Not Started": { color: "#6b7280", label: "Not Started" },
  "In Progress": { color: "#3A97D3", label: "In Progress" },
  "Completed":   { color: "#16a34a", label: "Completed" },
  "Blocked":     { color: "#dc2626", label: "Blocked" },
  "Cancelled":   { color: "#9ca3af", label: "Cancelled" },
};

// ── Sample Seed Data (shown when DB is empty) ──
const SEED_DECISIONS: BoardDecision[] = [
  {
    id: "bd-seed-1",
    ventureId: "ecoblend-rd",
    ventureName: "EcoBlend Materials",
    decisionTitle: "Approve Series A funding round at £3M pre-money valuation",
    decisionType: "Investment / Funding",
    description: "Board resolution to accept term sheet from GreenTech Ventures for £1.5M Series A at £3M pre-money valuation, with 20% equity dilution.",
    rationale: "Runway extension to 24 months enables TRL 7 milestone. Investor brings OEM network access. Mission-aligned impact clause included in term sheet.",
    missionAlignmentScore: 72,
    financialImpact: "High",
    strategicImpact: "High",
    decisionDate: "2026-03-15",
    decisionStatus: "Approved",
    votesFor: 4,
    votesAgainst: 1,
    votesAbstain: 0,
    totalBoardMembers: 5,
    quorumMet: true,
    proposedBy: "Brian (Founder)",
    approvedBy: "Brian (Founder), Dr. Sarah Chen, Independent Director",
    implementationDeadline: "2026-06-30",
    implementationStatus: "In Progress",
    notes: "Legal due diligence in progress. Shareholder approval required.",
    tags: "funding,series-a,dilution",
    createdAt: "2026-03-15T10:00:00Z",
  },
  {
    id: "bd-seed-2",
    ventureId: "ecoblend-rd",
    ventureName: "EcoBlend Materials",
    decisionTitle: "Reject acquisition offer from PetroChemCorp",
    decisionType: "Acquisition / Partnership",
    description: "Board voted to reject unsolicited acquisition offer of £8M from PetroChemCorp, a fossil fuel conglomerate.",
    rationale: "Acquirer's core business fundamentally misaligned with EcoBlend's sustainability mission. Acceptance would trigger mission drift and reputational damage with impact investors and B Corp certification.",
    missionAlignmentScore: 15,
    financialImpact: "High",
    strategicImpact: "Critical",
    decisionDate: "2026-01-22",
    decisionStatus: "Rejected",
    votesFor: 0,
    votesAgainst: 5,
    votesAbstain: 0,
    totalBoardMembers: 5,
    quorumMet: true,
    proposedBy: "External Acquirer",
    approvedBy: "N/A — Rejected unanimously",
    implementationStatus: "Not Started",
    notes: "Founder veto rights exercised. Mission protection clause invoked.",
    tags: "acquisition,mission-protection,veto",
    createdAt: "2026-01-22T14:30:00Z",
  },
  {
    id: "bd-seed-3",
    ventureId: "bebus",
    ventureName: "BeBus",
    decisionTitle: "Approve B Corp certification application",
    decisionType: "Governance Change",
    description: "Board resolution to formally apply for B Corp certification and commit to annual impact reporting.",
    rationale: "B Corp status strengthens mission credibility, attracts impact-aligned talent and investors, and provides governance accountability framework.",
    missionAlignmentScore: 95,
    financialImpact: "Low",
    strategicImpact: "High",
    decisionDate: "2026-02-10",
    decisionStatus: "Approved",
    votesFor: 5,
    votesAgainst: 0,
    votesAbstain: 0,
    totalBoardMembers: 5,
    quorumMet: true,
    proposedBy: "Brian (Founder)",
    approvedBy: "Unanimous",
    implementationDeadline: "2026-09-30",
    implementationStatus: "In Progress",
    notes: "BIA assessment in progress. Target score: 80+.",
    tags: "bcorp,governance,impact",
    createdAt: "2026-02-10T09:00:00Z",
  },
];

// ── New Decision Form ──
function NewDecisionForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    ventureId: "ecoblend-rd",
    ventureName: "EcoBlend Materials",
    decisionTitle: "",
    decisionType: "General",
    description: "",
    rationale: "",
    missionAlignmentScore: 50,
    financialImpact: "None",
    strategicImpact: "None",
    decisionDate: new Date().toISOString().split("T")[0],
    decisionStatus: "Pending",
    votesFor: 0,
    votesAgainst: 0,
    votesAbstain: 0,
    totalBoardMembers: 5,
    proposedBy: "Brian (Founder)",
    implementationStatus: "Not Started",
    notes: "",
  });

  const save = trpc.boardDecisions.upsert.useMutation({
    onSuccess: () => {
      toast.success("Decision recorded in audit trail");
      onSaved();
      onClose();
    },
    onError: () => toast.error("Failed to save decision"),
  });

  const miiColor = form.missionAlignmentScore >= 70 ? "#16a34a"
    : form.missionAlignmentScore >= 40 ? "#d97706" : "#dc2626";

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
          Record Board Decision
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Decision Title */}
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Decision Title *</label>
          <input
            type="text"
            value={form.decisionTitle}
            onChange={e => setForm(f => ({ ...f, decisionTitle: e.target.value }))}
            placeholder="e.g., Approve Series A funding at £3M pre-money valuation"
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
            style={{ borderColor: "#e5e7eb" }}
          />
        </div>

        {/* Decision Type */}
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Decision Type</label>
          <select
            value={form.decisionType}
            onChange={e => setForm(f => ({ ...f, decisionType: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
            style={{ borderColor: "#e5e7eb" }}
          >
            {DECISION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Decision Status</label>
          <select
            value={form.decisionStatus}
            onChange={e => setForm(f => ({ ...f, decisionStatus: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
            style={{ borderColor: "#e5e7eb" }}
          >
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="What was decided? Include key terms and conditions."
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 resize-none"
            style={{ borderColor: "#e5e7eb" }}
          />
        </div>

        {/* Rationale */}
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Mission Rationale</label>
          <textarea
            value={form.rationale}
            onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))}
            rows={2}
            placeholder="Why is this decision aligned (or not) with the mission? What mission risks were considered?"
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 resize-none"
            style={{ borderColor: "#e5e7eb" }}
          />
        </div>

        {/* Mission Alignment Score */}
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 block mb-2">
            Mission Alignment Score: <span style={{ color: miiColor, fontWeight: 700 }}>{form.missionAlignmentScore}/100</span>
          </label>
          <input
            type="range" min={0} max={100} step={5}
            value={form.missionAlignmentScore}
            onChange={e => setForm(f => ({ ...f, missionAlignmentScore: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>Mission Destructive (0)</span>
            <span>Neutral (50)</span>
            <span>Mission Advancing (100)</span>
          </div>
        </div>

        {/* Vote Counts */}
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Votes For</label>
          <input
            type="number" min={0} max={20}
            value={form.votesFor}
            onChange={e => setForm(f => ({ ...f, votesFor: parseInt(e.target.value) || 0 }))}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
            style={{ borderColor: "#e5e7eb" }}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Votes Against</label>
          <input
            type="number" min={0} max={20}
            value={form.votesAgainst}
            onChange={e => setForm(f => ({ ...f, votesAgainst: parseInt(e.target.value) || 0 }))}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
            style={{ borderColor: "#e5e7eb" }}
          />
        </div>

        {/* Proposed By */}
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Proposed By</label>
          <input
            type="text"
            value={form.proposedBy}
            onChange={e => setForm(f => ({ ...f, proposedBy: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
            style={{ borderColor: "#e5e7eb" }}
          />
        </div>

        {/* Decision Date */}
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Decision Date</label>
          <input
            type="date"
            value={form.decisionDate}
            onChange={e => setForm(f => ({ ...f, decisionDate: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900"
            style={{ borderColor: "#e5e7eb" }}
          />
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            placeholder="Any additional context, conditions, or follow-up actions."
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 resize-none"
            style={{ borderColor: "#e5e7eb" }}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-5 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
        <Button
          className="gap-2"
          style={{ background: "#7c3aed" }}
          onClick={() => save.mutate(form as any)}
          disabled={save.isPending || !form.decisionTitle}
        >
          {save.isPending ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Record Decision
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Decision Card ──
function DecisionCard({ decision }: { decision: BoardDecision }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[decision.decisionStatus] || STATUS_CONFIG.Pending;
  const StatusIcon = cfg.icon;
  const implCfg = IMPL_STATUS_CONFIG[decision.implementationStatus] || IMPL_STATUS_CONFIG["Not Started"];
  const miiColor = decision.missionAlignmentScore >= 70 ? "#16a34a"
    : decision.missionAlignmentScore >= 40 ? "#d97706" : "#dc2626";

  const totalVotes = decision.votesFor + decision.votesAgainst + decision.votesAbstain;

  return (
    <div
      className="bg-white rounded-xl border overflow-hidden"
      style={{
        borderColor: "#e5e7eb",
        borderLeft: `4px solid ${cfg.color}`,
      }}
    >
      {/* Header Row */}
      <div
        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
          <StatusIcon size={14} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-gray-900">{decision.decisionTitle}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="text-[9px] px-1.5 py-0" style={{ background: cfg.bg, color: cfg.color, border: "none" }}>
              {decision.decisionStatus}
            </Badge>
            <span className="text-[10px] text-gray-400">{decision.decisionType}</span>
            <span className="text-[10px] text-gray-400" style={{ color: decision.ventureName ? "#3A97D3" : "#6b7280" }}>
              {decision.ventureName}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">{decision.decisionDate}</span>
          </div>
        </div>
        {/* Mission Alignment Score */}
        <div className="flex flex-col items-center flex-shrink-0">
          <span className="text-lg font-bold" style={{ color: miiColor, fontFamily: "'Prompt', sans-serif" }}>
            {decision.missionAlignmentScore}
          </span>
          <span className="text-[9px] text-gray-400">MAS</span>
        </div>
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
          <div className="pt-4 grid grid-cols-2 gap-4">
            {/* Vote Breakdown */}
            {totalVotes > 0 && (
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Vote Breakdown</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#16a34a" }} />
                    <span className="text-xs text-gray-700 font-medium">{decision.votesFor} For</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#dc2626" }} />
                    <span className="text-xs text-gray-700 font-medium">{decision.votesAgainst} Against</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#9ca3af" }} />
                    <span className="text-xs text-gray-700 font-medium">{decision.votesAbstain} Abstain</span>
                  </div>
                  {decision.quorumMet && (
                    <Badge className="text-[9px] px-1.5 py-0 bg-green-50 text-green-600 border-none">Quorum Met</Badge>
                  )}
                </div>
                {/* Vote Bar */}
                <div className="mt-2 flex h-2 rounded-full overflow-hidden w-full" style={{ background: "#f3f4f6" }}>
                  <div style={{ width: `${(decision.votesFor / totalVotes) * 100}%`, background: "#16a34a" }} />
                  <div style={{ width: `${(decision.votesAgainst / totalVotes) * 100}%`, background: "#dc2626" }} />
                  <div style={{ width: `${(decision.votesAbstain / totalVotes) * 100}%`, background: "#9ca3af" }} />
                </div>
              </div>
            )}

            {/* Description */}
            {decision.description && (
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Decision Description</p>
                <p className="text-xs text-gray-700 leading-relaxed">{decision.description}</p>
              </div>
            )}

            {/* Mission Rationale */}
            {decision.rationale && (
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Mission Rationale</p>
                <p className="text-xs text-gray-700 leading-relaxed">{decision.rationale}</p>
              </div>
            )}

            {/* Impact Indicators */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Financial Impact</p>
              <span className="text-xs font-medium" style={{ color: IMPACT_COLORS[decision.financialImpact] || "#6b7280" }}>
                {decision.financialImpact}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Strategic Impact</p>
              <span className="text-xs font-medium" style={{ color: IMPACT_COLORS[decision.strategicImpact] || "#6b7280" }}>
                {decision.strategicImpact}
              </span>
            </div>

            {/* Implementation */}
            {decision.implementationStatus !== "Not Started" && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Implementation</p>
                <span className="text-xs font-medium" style={{ color: implCfg.color }}>{implCfg.label}</span>
                {decision.implementationDeadline && (
                  <span className="text-[10px] text-gray-400 ml-2">Deadline: {decision.implementationDeadline}</span>
                )}
              </div>
            )}

            {/* Proposed / Approved By */}
            {decision.proposedBy && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Proposed By</p>
                <p className="text-xs text-gray-700">{decision.proposedBy}</p>
              </div>
            )}

            {/* Notes */}
            {decision.notes && (
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-xs text-gray-600 italic">{decision.notes}</p>
              </div>
            )}

            {/* Tags */}
            {decision.tags && (
              <div className="col-span-2 flex gap-1 flex-wrap">
                {decision.tags.split(",").map(tag => (
                  <Badge key={tag} className="text-[9px] px-1.5 py-0 bg-gray-100 text-gray-500 border-none">
                    #{tag.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──
export default function BoardDecisionAuditTrail() {
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const utils = trpc.useUtils();

  const { data: decisions = [], isLoading, refetch } = trpc.boardDecisions.list.useQuery(
    {},
    { refetchOnWindowFocus: false }
  );

  // Merge DB decisions with seed data (seed shown when DB is empty)
  const allDecisions: BoardDecision[] = decisions.length > 0
    ? decisions as BoardDecision[]
    : SEED_DECISIONS;

  const filtered = allDecisions.filter(d => {
    if (typeFilter !== "All" && d.decisionType !== typeFilter) return false;
    if (statusFilter !== "All" && d.decisionStatus !== statusFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.decisionDate).getTime() - new Date(a.decisionDate).getTime());

  // Stats
  const approved = allDecisions.filter(d => d.decisionStatus === "Approved").length;
  const rejected = allDecisions.filter(d => d.decisionStatus === "Rejected").length;
  const pending = allDecisions.filter(d => d.decisionStatus === "Pending").length;
  const avgMAS = allDecisions.length > 0
    ? Math.round(allDecisions.reduce((s, d) => s + d.missionAlignmentScore, 0) / allDecisions.length)
    : 0;
  const masColor = avgMAS >= 70 ? "#16a34a" : avgMAS >= 40 ? "#d97706" : "#dc2626";

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
          <span className="text-xs font-semibold text-gray-400 uppercase">Approved</span>
          <p className="text-2xl font-bold" style={{ color: "#16a34a", fontFamily: "'Prompt', sans-serif" }}>{approved}</p>
        </div>
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
          <span className="text-xs font-semibold text-gray-400 uppercase">Rejected</span>
          <p className="text-2xl font-bold" style={{ color: "#dc2626", fontFamily: "'Prompt', sans-serif" }}>{rejected}</p>
        </div>
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
          <span className="text-xs font-semibold text-gray-400 uppercase">Pending</span>
          <p className="text-2xl font-bold" style={{ color: "#d97706", fontFamily: "'Prompt', sans-serif" }}>{pending}</p>
        </div>
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
          <span className="text-xs font-semibold text-gray-400 uppercase">Avg Mission Alignment</span>
          <p className="text-2xl font-bold" style={{ color: masColor, fontFamily: "'Prompt', sans-serif" }}>{avgMAS}</p>
          <span className="text-[10px] text-gray-400">/ 100</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-xs border rounded-lg px-2.5 py-1.5 text-gray-600"
            style={{ borderColor: "#e5e7eb" }}
          >
            <option value="All">All Types</option>
            {DECISION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border rounded-lg px-2.5 py-1.5 text-gray-600"
            style={{ borderColor: "#e5e7eb" }}
          >
            <option value="All">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-xs text-gray-400">{filtered.length} decision{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <Button
          size="sm"
          className="gap-2 text-xs"
          style={{ background: "#7c3aed" }}
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={13} /> Record Decision
        </Button>
      </div>

      {/* New Decision Form */}
      {showForm && (
        <NewDecisionForm
          onClose={() => setShowForm(false)}
          onSaved={() => utils.boardDecisions.list.invalidate()}
        />
      )}

      {/* Decision List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <RefreshCw size={16} className="animate-spin mr-2" />
          <span className="text-sm">Loading decisions…</span>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <DecisionCard key={d.id} decision={d} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <FileText size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No decisions match the current filters</p>
            </div>
          )}
        </div>
      )}

      {decisions.length === 0 && !isLoading && (
        <p className="text-[10px] text-gray-400 text-center">
          Showing sample decisions — click "Record Decision" to add real board decisions to the audit trail.
        </p>
      )}
    </div>
  );
}
