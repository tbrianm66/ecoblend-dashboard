// ============================================================
// ECOBLEND VENTURE DETAIL PAGE
// Design: Precision Industrial — full VRL/TRL breakdown
// ============================================================

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ventures, VRL_STAGES, TRL_LEVELS } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Circle, AlertTriangle, TrendingUp, FlaskConical, LayoutGrid } from "lucide-react";

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
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ background: venture.color }} />
              <h1 className="vos-page-title" style={{ color: venture.color }}>{venture.name}</h1>
              <span className="vos-badge" style={{ background: `${venture.color}15`, color: venture.color, fontSize: "0.65rem" }}>{venture.channel}</span>
              <span className="vos-badge" style={{ background: "#f3f4f6", color: "#6b7280", fontSize: "0.65rem" }}>{venture.status}</span>
            </div>
            <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>{venture.description}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Nominated Charity</div>
            <div className="text-sm font-semibold text-gray-700">{venture.nominatedCharity}</div>
            <div className="text-xs text-gray-400">{venture.charityFocus}</div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Dual Readiness Overview */}
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
