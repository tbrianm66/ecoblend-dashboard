// ============================================================
// ECOBLEND VENTURE DETAIL PAGE
// Design: Precision Industrial — full VRL/TRL breakdown
// ============================================================

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ventures, VRL_STAGES, TRL_LEVELS } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, Circle, AlertTriangle, TrendingUp, FlaskConical, LayoutGrid, Briefcase, GitBranch, Plus, Trash2, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const riskColors = { Low: "#22c55e", Medium: "#f59e0b", High: "#dc2626" };

export default function VentureDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const venture = ventures.find(v => v.id === id);

  if (!venture) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Venture not found</p>
          <button onClick={() => navigate("/")} className="text-sm text-green-600 hover:underline">← Back to Portfolio</button>
        </div>
      </div>
    );
  }

  const vrlPct = ((venture.vrl - 1) / 4 + venture.vrlPercent / 400) * 100;
  const trlPct = ((venture.trl - 1) / 9 + venture.trlPercent / 900) * 100;

  // BRL score for this venture
  const { data: brlSummary = [] } = trpc.brl.portfolioSummary.useQuery();
  const brlEntry = brlSummary.find((s: { ventureId: string; score: number; completedCount: number; totalCount: number }) => s.ventureId === venture.id);
  const brlScore = brlEntry?.score ?? 0;
  const brlCompleted = brlEntry?.completedCount ?? 0;
  const brlTotal = brlEntry?.totalCount ?? 100;
  // Computed VRL score from scoring engine
  const { data: vrlComputedScore } = trpc.vrlScoring.getScore.useQuery({ ventureId: venture.id });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Portfolio
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {venture.logo && (
              <div
                className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 shadow-md"
                style={{
                  borderColor: `${venture.color}50`,
                  background: venture.logoBg || "#f9fafb",
                }}
              >
                <img src={venture.logo} alt={`${venture.name} logo`} className="w-full h-full object-contain p-2" />
              </div>
            )}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="vos-page-title" style={{ color: venture.color }}>{venture.name}</h1>
              <span className="vos-badge" style={{ background: `${venture.color}15`, color: venture.color, fontSize: "0.65rem" }}>{venture.channel}</span>
              <span className="vos-badge" style={{ background: "#f3f4f6", color: "#6b7280", fontSize: "0.65rem" }}>{venture.status}</span>
            </div>
            <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>{venture.description}</p>
          </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Nominated Charity</div>
            <div className="text-sm font-semibold text-gray-700">{venture.nominatedCharity}</div>
            <div className="text-xs text-gray-400">{venture.charityFocus}</div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Triple Readiness Matrix: VRL / TRL / BRL */}
        {/* BRL Summary Card */}
        <div className="bg-white rounded-xl border p-5 shadow-sm flex items-center gap-6" style={{ borderColor: "#e5e7eb", borderTop: "3px solid #8B5CF6" }}>
          <div className="flex items-center gap-2">
            <Briefcase size={18} style={{ color: "#8B5CF6" }} />
            <span className="font-bold text-gray-900">Business Readiness Level (BRL)</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">{brlCompleted} of {brlTotal} tasks complete</span>
              <span className="text-sm font-bold" style={{ color: "#8B5CF6" }}>{brlScore}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${brlScore}%`, background: "#8B5CF6" }} />
            </div>
          </div>
          <a href="/brl" className="text-xs text-purple-600 hover:underline whitespace-nowrap">View BRL →</a>
        </div>

        {/* VRL + TRL Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VRL Card */}
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb", borderTop: "3px solid #22c55e" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} style={{ color: "#22c55e" }} />
              <h3 className="font-bold text-gray-900">Venture Readiness Level (VRL)</h3>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-bold font-mono" style={{ color: "#22c55e" }}>{venture.vrl}</span>
              <span className="text-gray-400 mb-2">/ 4 stages</span>
              {vrlComputedScore && (
                <div className="ml-auto flex flex-col items-end">
                  <span className="text-xs text-gray-400 mb-0.5">Computed VRL</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono" style={{ color: "#51AF37" }}>{vrlComputedScore.vrlScore.toFixed(1)}</span>
                    <span className="text-sm text-gray-400">/9</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: "#51AF3715", color: "#51AF37" }}>
                    L{vrlComputedScore.vrlLevel}: {vrlComputedScore.vrlLevelLabel}
                  </span>
                </div>
              )}
            </div>
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${vrlPct}%`, background: "#22c55e" }} />
            </div>
            <div className="space-y-2">
              {VRL_STAGES.map((stage) => (
                <div key={stage.id} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: "#f3f4f6" }}>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{
                      background: stage.id < venture.vrl ? "#22c55e" : stage.id === venture.vrl ? "#22c55e20" : "#f3f4f6",
                      color: stage.id < venture.vrl ? "white" : stage.id === venture.vrl ? "#22c55e" : "#9ca3af",
                      border: stage.id === venture.vrl ? "2px solid #22c55e" : "none",
                    }}
                  >
                    {stage.id}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{stage.label}</div>
                    <div className="text-xs text-gray-400">{stage.tasks} · {stage.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TRL Card */}
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb", borderTop: "3px solid #1d4ed8" }}>
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical size={18} style={{ color: "#1d4ed8" }} />
              <h3 className="font-bold text-gray-900">Technology Readiness Level (TRL)</h3>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-bold font-mono" style={{ color: "#1d4ed8" }}>{venture.trl}</span>
              <span className="text-gray-400 mb-2">/ 9 levels</span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${trlPct}%`, background: "#1d4ed8" }} />
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {TRL_LEVELS.map((level) => (
                <div key={level.id} className="flex items-start gap-3 py-1.5 border-b last:border-0" style={{ borderColor: "#f3f4f6" }}>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{
                      background: level.id < venture.trl ? "#1d4ed8" : level.id === venture.trl ? "#1d4ed820" : "#f3f4f6",
                      color: level.id < venture.trl ? "white" : level.id === venture.trl ? "#1d4ed8" : "#9ca3af",
                      border: level.id === venture.trl ? "2px solid #1d4ed8" : "none",
                    }}
                  >
                    {level.id}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-700">{level.label}</div>
                    <div className="text-xs text-gray-400">{level.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4">Milestones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {venture.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: m.completed ? "#f0fdf4" : "#f9fafb" }}>
                {m.completed
                  ? <CheckCircle2 size={18} style={{ color: "#22c55e", flexShrink: 0 }} />
                  : <Circle size={18} style={{ color: "#d1d5db", flexShrink: 0 }} />
                }
                <div>
                  <div className="text-sm font-medium text-gray-700">{m.label}</div>
                  {m.date && <div className="text-xs text-gray-400">{m.date}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4">Risk Management</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#f3f4f6" }}>
                  <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Domain</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Risk Level</th>
                  <th className="text-left py-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {venture.risks.map((risk, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: "#f3f4f6" }}>
                    <td className="py-3 pr-4 font-medium text-gray-700">{risk.domain}</td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${riskColors[risk.level]}15`, color: riskColors[risk.level] }}
                      >
                        {risk.level === "High" && <AlertTriangle size={11} />}
                        {risk.level}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{risk.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BMC / MMC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb", borderTop: "3px solid #51AF37" }}>
            <h3 className="font-bold text-gray-900 mb-2">Business Model Canvas (BMC)</h3>
            <p className="text-sm text-gray-600">{venture.bmc}</p>
          </div>
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb", borderTop: "3px solid #3A97D3" }}>
            <h3 className="font-bold text-gray-900 mb-2">Mission Model Canvas (MMC)</h3>
            <p className="text-sm text-gray-600">{venture.mmc}</p>
          </div>
        </div>

        {/* Canvas Evidence Summary */}
        <CanvasEvidenceSummary ventureId={venture.id} ventureColor={venture.color} />

        {/* Pivot or Persevere — Lean Startup Decision Log */}
        <PivotDecisionLog ventureId={venture.id} ventureColor={venture.color} currentVrlScore={vrlComputedScore?.vrlScore} />
      </div>
    </div>
  );
}

// ── Canvas Evidence Summary ──────────────────────────────────────────────────
type BmcBlock = "Value Propositions" | "Customer Segments" | "Channels" | "Customer Relationships" | "Revenue Streams" | "Key Resources" | "Key Activities" | "Key Partners" | "Cost Structure";
type MmcBlock = "Mission" | "Beneficiaries" | "Value Created" | "Key Partners (Mission)" | "Key Activities (Mission)" | "Key Resources (Mission)" | "Channels (Mission)" | "Cost Structure (Mission)" | "Funding Streams";
type HypothesisStatus = "Validated" | "Invalidated" | "Partial" | "Pending";

interface HypothesisEvidence {
  text: string;
  status: HypothesisStatus;
  bmcBlock?: BmcBlock;
  mmcBlock?: MmcBlock;
}

const BMC_BLOCKS: BmcBlock[] = ["Key Partners","Key Activities","Key Resources","Value Propositions","Customer Relationships","Channels","Customer Segments","Cost Structure","Revenue Streams"];
const MMC_BLOCKS: MmcBlock[] = ["Mission","Beneficiaries","Value Created","Key Partners (Mission)","Key Activities (Mission)","Key Resources (Mission)","Channels (Mission)","Cost Structure (Mission)","Funding Streams"];

const STATUS_COLOUR: Record<HypothesisStatus, string> = {
  Validated: "#51AF37",
  Invalidated: "#ef4444",
  Partial: "#F49C13",
  Pending: "#9ca3af",
};

const STATUS_BG: Record<HypothesisStatus, string> = {
  Validated: "#f0fdf4",
  Invalidated: "#fef2f2",
  Partial: "#fffbeb",
  Pending: "#f9fafb",
};

function getBlockStatus(hypotheses: HypothesisEvidence[]): HypothesisStatus {
  if (!hypotheses.length) return "Pending";
  if (hypotheses.every(h => h.status === "Validated")) return "Validated";
  if (hypotheses.some(h => h.status === "Invalidated")) return "Invalidated";
  if (hypotheses.some(h => h.status === "Validated" || h.status === "Partial")) return "Partial";
  return "Pending";
}

function CanvasEvidenceSummary({ ventureId, ventureColor }: { ventureId: string; ventureColor: string }) {
  const [activeCanvas, setActiveCanvas] = useState<"bmc" | "mmc">("bmc");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  // Pull hypotheses from localStorage (written by InterviewTracker)
  const stored = localStorage.getItem("ecoblend-interviews-v1");
  const allInterviews: Array<{ ventureId: string; hypotheses: HypothesisEvidence[] }> = stored ? JSON.parse(stored) : [];
  const ventureInterviews = allInterviews.filter(i => i.ventureId === ventureId);
  const allHypotheses: HypothesisEvidence[] = ventureInterviews.flatMap(i => i.hypotheses);

  const blocks = activeCanvas === "bmc" ? BMC_BLOCKS : MMC_BLOCKS;
  const blockKey = activeCanvas === "bmc" ? "bmcBlock" : "mmcBlock";

  const blockMap: Record<string, HypothesisEvidence[]> = {};
  blocks.forEach(b => { blockMap[b] = []; });
  allHypotheses.forEach(h => {
    const val = h[blockKey as keyof HypothesisEvidence] as string | undefined;
    if (val && blockMap[val]) blockMap[val].push(h);
  });

  const selectedHypotheses = selectedBlock ? (blockMap[selectedBlock] || []) : [];

  const validatedCount = blocks.filter(b => getBlockStatus(blockMap[b]) === "Validated").length;
  const partialCount = blocks.filter(b => getBlockStatus(blockMap[b]) === "Partial").length;
  const invalidatedCount = blocks.filter(b => getBlockStatus(blockMap[b]) === "Invalidated").length;

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#f3f4f6" }}>
        <div className="flex items-center gap-2">
          <LayoutGrid size={18} style={{ color: ventureColor }} />
          <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Canvas Evidence Summary</h3>
          <span className="text-xs text-gray-400 ml-1">— Customer interview validation mapped to canvas blocks</span>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#f3f4f6" }}>
          {(["bmc", "mmc"] as const).map(c => (
            <button
              key={c}
              onClick={() => { setActiveCanvas(c); setSelectedBlock(null); }}
              className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                background: activeCanvas === c ? ventureColor : "transparent",
                color: activeCanvas === c ? "white" : "#6b7280",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 divide-x" style={{ borderBottom: "1px solid #f3f4f6" }}>
        {[
          { label: "Total Blocks", value: blocks.length, color: "#6b7280" },
          { label: "Validated", value: validatedCount, color: "#51AF37" },
          { label: "Partial", value: partialCount, color: "#F49C13" },
          { label: "Invalidated", value: invalidatedCount, color: "#ef4444" },
        ].map(s => (
          <div key={s.label} className="px-4 py-3 text-center">
            <div className="text-xl font-bold" style={{ color: s.color, fontFamily: "'Prompt', sans-serif" }}>{s.value}</div>
            <div className="text-xs text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Block grid */}
        <div className="flex-1 p-6">
          {allHypotheses.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>
              No interview hypotheses linked yet. Go to Interview Tracker and link hypotheses to canvas blocks.
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {blocks.map(block => {
              const hyps = blockMap[block];
              const status = getBlockStatus(hyps);
              const isSelected = selectedBlock === block;
              return (
                <button
                  key={block}
                  onClick={() => setSelectedBlock(isSelected ? null : block)}
                  className="text-left p-3 rounded-xl border-2 transition-all hover:shadow-md"
                  style={{
                    borderColor: isSelected ? ventureColor : `${STATUS_COLOUR[status]}40`,
                    background: isSelected ? `${ventureColor}08` : STATUS_BG[status],
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: STATUS_COLOUR[status], fontFamily: "'Nunito', sans-serif" }}>
                      {status}
                    </span>
                    <span className="text-xs text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>{hyps.length} hyp.</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800" style={{ fontFamily: "'Nunito', sans-serif" }}>{block}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hypothesis detail panel */}
        {selectedBlock && (
          <div className="w-72 border-l p-4 bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3" style={{ fontFamily: "'Nunito', sans-serif" }}>
              {selectedBlock}
            </div>
            {selectedHypotheses.length === 0 ? (
              <p className="text-xs text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>No hypotheses linked to this block yet.</p>
            ) : (
              <div className="space-y-2">
                {selectedHypotheses.map((h, i) => (
                  <div key={i} className="p-3 rounded-lg border" style={{ borderColor: `${STATUS_COLOUR[h.status]}30`, background: STATUS_BG[h.status] }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold" style={{ color: STATUS_COLOUR[h.status], fontFamily: "'Nunito', sans-serif" }}>{h.status}</span>
                    </div>
                    <p className="text-xs text-gray-700" style={{ fontFamily: "'Nunito', sans-serif" }}>{h.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pivot Decision Log ────────────────────────────────────────────────────────
const PIVOT_TYPES = [
  { value: "Zoom-In", label: "Zoom-In", desc: "Single feature becomes the whole product" },
  { value: "Zoom-Out", label: "Zoom-Out", desc: "Whole product becomes a single feature" },
  { value: "Customer-Segment", label: "Customer Segment", desc: "Same problem, different customer" },
  { value: "Customer-Need", label: "Customer Need", desc: "Same customer, different problem" },
  { value: "Platform", label: "Platform", desc: "Application becomes a platform" },
  { value: "Business-Architecture", label: "Business Architecture", desc: "High-margin/low-volume ↔ low-margin/high-volume" },
  { value: "Value-Capture", label: "Value Capture", desc: "Change how you monetise" },
  { value: "Engine-of-Growth", label: "Engine of Growth", desc: "Sticky → Viral → Paid" },
  { value: "Channel", label: "Channel", desc: "Change the distribution channel" },
  { value: "Technology", label: "Technology", desc: "Same solution, different technology" },
] as const;

type PivotType = typeof PIVOT_TYPES[number]["value"];

const DECISION_COLORS: Record<string, string> = {
  Pivot: "#ef4444",
  Persevere: "#22c55e",
  Pause: "#f59e0b",
};

function PivotDecisionLog({
  ventureId,
  ventureColor,
  currentVrlScore,
}: {
  ventureId: string;
  ventureColor: string;
  currentVrlScore?: number;
}) {
  const utils = trpc.useUtils();
  const { data: decisions = [], isLoading } = trpc.pivots.list.useQuery({ ventureId });
  const { data: runwayData } = trpc.pivots.getRunwayInputs.useQuery({ ventureId });

  const addMutation = trpc.pivots.add.useMutation({
    onSuccess: () => {
      utils.pivots.list.invalidate({ ventureId });
      setShowAdd(false);
      setForm(defaultForm);
      toast.success("Decision logged");
    },
    onError: () => toast.error("Failed to log decision"),
  });
  const deleteMutation = trpc.pivots.delete.useMutation({
    onSuccess: () => utils.pivots.list.invalidate({ ventureId }),
    onError: () => toast.error("Failed to delete"),
  });
  const runwayMutation = trpc.pivots.upsertRunwayInputs.useMutation({
    onSuccess: (data) => {
      utils.pivots.getRunwayInputs.invalidate({ ventureId });
      toast.success(`Runway: ${data.runwayMonths?.toFixed(1) ?? "∞"} months · ${data.pivotsRemaining?.toFixed(1) ?? "∞"} pivots remaining`);
    },
    onError: () => toast.error("Failed to save runway inputs"),
  });

  const defaultForm = {
    decision: "Persevere" as "Pivot" | "Persevere" | "Pause",
    pivotType: "" as PivotType | "",
    hypothesisTested: "",
    evidenceSummary: "",
    experimentsPassed: 0,
    experimentsFailed: 0,
    interviewsReviewed: 0,
    newHypothesis: "",
    rationale: "",
    decidedBy: "",
    decisionDate: new Date().toISOString().slice(0, 10),
  };
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [runwayForm, setRunwayForm] = useState({
    currentCashBalance: runwayData?.currentCashBalance ?? 0,
    monthlyBurnRate: runwayData?.monthlyBurnRate ?? 0,
    avgPivotDurationWeeks: runwayData?.avgPivotDurationWeeks ?? 8,
  });
  const [showRunway, setShowRunway] = useState(false);

  const runway = runwayData?.estimatedRunwayMonths;
  const pivotsLeft = runwayData?.estimatedPivotsRemaining;
  const runwayAlert = runwayData?.runwayAlertActive;

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb", borderTop: `3px solid ${ventureColor}` }}>
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#f3f4f6" }}>
        <div className="flex items-center gap-2">
          <GitBranch size={18} style={{ color: ventureColor }} />
          <h3 className="font-bold text-gray-900">Pivot or Persevere</h3>
          <span className="text-xs text-gray-400 ml-1">— Lean Startup decision log</span>
          {decisions.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${ventureColor}15`, color: ventureColor }}>
              {decisions.length} decision{decisions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setShowRunway(!showRunway)}>
            <RefreshCw size={11} /> Runway
          </Button>
          <Button size="sm" className="gap-1 text-xs h-7" style={{ background: ventureColor, color: "white" }} onClick={() => setShowAdd(true)}>
            <Plus size={11} /> Log Decision
          </Button>
        </div>
      </div>

      {/* Runway Calculator Panel */}
      {showRunway && (
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f3f4f6", background: runwayAlert ? "#fef2f2" : "#f9fafb" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Runway Calculator</span>
            {runwayAlert && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-600 flex items-center gap-1">
                <AlertTriangle size={10} /> Low runway — fewer than 2 pivots remaining
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "Cash Balance ($)", key: "currentCashBalance", step: 1000 },
              { label: "Monthly Burn ($)", key: "monthlyBurnRate", step: 500 },
              { label: "Avg Pivot Duration (weeks)", key: "avgPivotDurationWeeks", step: 1 },
            ].map(({ label, key, step }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input
                  type="number"
                  step={step}
                  min={0}
                  value={(runwayForm as any)[key]}
                  onChange={e => setRunwayForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  className="w-full text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2"
                  style={{ borderColor: "#e5e7eb" }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              className="gap-1 text-xs h-7"
              style={{ background: ventureColor, color: "white" }}
              onClick={() => runwayMutation.mutate({ ventureId, ...runwayForm })}
              disabled={runwayMutation.isPending}
            >
              {runwayMutation.isPending ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Calculate
            </Button>
            {runway !== null && runway !== undefined && (
              <div className="flex items-center gap-4 text-sm">
                <span className="font-mono font-bold" style={{ color: runwayAlert ? "#ef4444" : "#22c55e" }}>
                  {runway.toFixed(1)} months runway
                </span>
                <span className="text-gray-400">·</span>
                <span className="font-mono font-bold" style={{ color: runwayAlert ? "#ef4444" : "#22c55e" }}>
                  {pivotsLeft?.toFixed(1)} pivots remaining
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decision list */}
      <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
        {isLoading && (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Loading decisions…</div>
        )}
        {!isLoading && decisions.length === 0 && (
          <div className="px-6 py-8 text-center">
            <GitBranch size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No decisions logged yet.</p>
            <p className="text-xs text-gray-300 mt-1">Log your first Pivot or Persevere decision to start your learning history.</p>
          </div>
        )}
        {decisions.map((d: any) => (
          <div key={d.id} className="px-6 py-4 flex items-start gap-4">
            <div
              className="w-20 text-center py-1 rounded-lg text-xs font-bold shrink-0"
              style={{ background: `${DECISION_COLORS[d.decision]}15`, color: DECISION_COLORS[d.decision] }}
            >
              {d.decision}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-semibold text-gray-800">{d.hypothesisTested}</span>
                {d.pivotType && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${ventureColor}15`, color: ventureColor }}>
                    {d.pivotType}
                  </span>
                )}
              </div>
              {d.evidenceSummary && (
                <p className="text-xs text-gray-500 mb-1">{d.evidenceSummary}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={10} style={{ color: "#22c55e" }} />
                  {d.experimentsPassed ?? 0} passed
                </span>
                <span className="flex items-center gap-1">
                  <Circle size={10} style={{ color: "#ef4444" }} />
                  {d.experimentsFailed ?? 0} failed
                </span>
                {d.interviewsReviewed > 0 && (
                  <span>{d.interviewsReviewed} interviews</span>
                )}
                {d.vrlScoreAtDecision !== null && d.vrlScoreAtDecision !== undefined && (
                  <span className="font-mono">VRL {d.vrlScoreAtDecision.toFixed(1)}/9 at decision</span>
                )}
                <span className="ml-auto">{d.decisionDate ? new Date(d.decisionDate).toLocaleDateString() : ""}</span>
              </div>
              {d.newHypothesis && (
                <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: "#f0fdf4", color: "#15803d" }}>
                  <span className="font-semibold">Next hypothesis: </span>{d.newHypothesis}
                </div>
              )}
            </div>
            <button
              onClick={() => deleteMutation.mutate({ id: d.id })}
              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-50 transition-colors shrink-0"
            >
              <Trash2 size={12} className="text-gray-300 hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Decision Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch size={16} style={{ color: ventureColor }} />
              Log Pivot or Persevere Decision
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Decision type */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Decision *</label>
              <div className="flex gap-2">
                {(["Persevere", "Pivot", "Pause"] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setForm(f => ({ ...f, decision: d }))}
                    className="flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all"
                    style={{
                      borderColor: form.decision === d ? DECISION_COLORS[d] : "#e5e7eb",
                      background: form.decision === d ? `${DECISION_COLORS[d]}10` : "white",
                      color: form.decision === d ? DECISION_COLORS[d] : "#6b7280",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Pivot type — only shown when Pivot selected */}
            {form.decision === "Pivot" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Pivot Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PIVOT_TYPES.map(pt => (
                    <button
                      key={pt.value}
                      onClick={() => setForm(f => ({ ...f, pivotType: pt.value }))}
                      className="text-left p-2 rounded-lg border text-xs transition-all"
                      style={{
                        borderColor: form.pivotType === pt.value ? ventureColor : "#e5e7eb",
                        background: form.pivotType === pt.value ? `${ventureColor}08` : "white",
                      }}
                    >
                      <div className="font-semibold text-gray-800">{pt.label}</div>
                      <div className="text-gray-400 mt-0.5">{pt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hypothesis tested */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1 block">Hypothesis Tested *</label>
              <input
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                style={{ borderColor: "#e5e7eb" }}
                placeholder="We believe that…"
                value={form.hypothesisTested}
                onChange={e => setForm(f => ({ ...f, hypothesisTested: e.target.value }))}
              />
            </div>

            {/* Evidence counts */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Experiments Passed", key: "experimentsPassed" },
                { label: "Experiments Failed", key: "experimentsFailed" },
                { label: "Interviews Reviewed", key: "interviewsReviewed" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full text-sm border rounded-lg px-3 py-1.5 focus:outline-none"
                    style={{ borderColor: "#e5e7eb" }}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>

            {/* Evidence summary */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1 block">Evidence Summary</label>
              <textarea
                rows={2}
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none resize-none"
                style={{ borderColor: "#e5e7eb" }}
                placeholder="Key findings from experiments and interviews…"
                value={form.evidenceSummary}
                onChange={e => setForm(f => ({ ...f, evidenceSummary: e.target.value }))}
              />
            </div>

            {/* Next hypothesis */}
            {form.decision !== "Persevere" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1 block">Next Hypothesis</label>
                <input
                  className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none"
                  style={{ borderColor: "#e5e7eb" }}
                  placeholder="After this pivot, we now believe that…"
                  value={form.newHypothesis}
                  onChange={e => setForm(f => ({ ...f, newHypothesis: e.target.value }))}
                />
              </div>
            )}

            {/* Date + decided by */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Decision Date</label>
                <input
                  type="date"
                  className="w-full text-sm border rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ borderColor: "#e5e7eb" }}
                  value={form.decisionDate}
                  onChange={e => setForm(f => ({ ...f, decisionDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Decided By</label>
                <input
                  className="w-full text-sm border rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ borderColor: "#e5e7eb" }}
                  placeholder="Founder name"
                  value={form.decidedBy}
                  onChange={e => setForm(f => ({ ...f, decidedBy: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                style={{ background: ventureColor, color: "white" }}
                disabled={!form.hypothesisTested.trim() || addMutation.isPending}
                onClick={() =>
                  addMutation.mutate({
                    ventureId,
                    decision: form.decision,
                    pivotType: form.pivotType || undefined,
                    hypothesisTested: form.hypothesisTested,
                    evidenceSummary: form.evidenceSummary || undefined,
                    experimentsPassed: form.experimentsPassed,
                    experimentsFailed: form.experimentsFailed,
                    interviewsReviewed: form.interviewsReviewed,
                    newHypothesis: form.newHypothesis || undefined,
                    decidedBy: form.decidedBy || undefined,
                    decisionDate: new Date(form.decisionDate),
                    vrlScoreAtDecision: currentVrlScore,
                  })
                }
              >
                {addMutation.isPending ? "Saving…" : "Log Decision"}
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
