/**
 * VRL Results Dashboard — BEBUS-VRL-UPDATE-001
 * 10-axis radar, veto banner, meta-domain bars, transparency panel, history, disputes (Gate 3)
 */
import { useState } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import VrlEvidencePanel, { EvidenceStatusBadge } from "@/components/VrlEvidencePanel";

// ── Dimension definitions (same order as form) ────────────────────────────────
const DIMS = [
  { key: "trlScore", code: "TRL", label: "Technology",          color: "#3b82f6" },
  { key: "mrlScore", code: "MRL", label: "Manufacturing",       color: "#6366f1" },
  { key: "brlScore", code: "BRL", label: "Business",            color: "#22c55e" },
  { key: "ecoScore", code: "ECO", label: "Environmental",       color: "#10b981" },
  { key: "prlScore", code: "PRL", label: "People",              color: "#f59e0b" },
  { key: "ipScore",  code: "IP",  label: "IP",                  color: "#f97316" },
  { key: "frlScore", code: "FRL", label: "Financial",           color: "#8b5cf6" },
  { key: "regScore", code: "REG", label: "Regulatory",          color: "#ec4899" },
  { key: "srlScore", code: "SRL", label: "Sustainability",      color: "#14b8a6" },
  { key: "mvlScore", code: "MVL", label: "Market Validation",   color: "#a78bfa" },
] as const;

// Gate 2: MVL canonical 15% composite = market weight(0.30) × MVL in market(0.50)
// baseAverage = product×0.175 + market×0.30 + execution×0.175 + structural×0.175 + sustainability×0.175
const META_DOMAINS = [
  { key: "productScore",        label: "Product",        color: "#3b82f6", formula: "TRL×0.4 + MRL×0.35 + BRL×0.25",    weight: "17.5%" },
  { key: "marketScore",         label: "Market",         color: "#22c55e", formula: "BRL×0.25 + PRL×0.25 + MVL×0.50",   weight: "30%" },
  { key: "executionScore",      label: "Execution",      color: "#8b5cf6", formula: "FRL×0.6 + MRL×0.4",                weight: "17.5%" },
  { key: "structuralScore",     label: "Structural",     color: "#f59e0b", formula: "IP×0.5 + REG×0.5",                 weight: "17.5%" },
  { key: "sustainabilityScore", label: "Sustainability", color: "#10b981", formula: "ECO×0.6 + SRL×0.4",                weight: "17.5%" },
] as const;

function getBandColor(score: number): string {
  if (score < 20) return "#6b7280";
  if (score < 40) return "#f59e0b";
  if (score < 55) return "#f97316";
  if (score < 70) return "#22c55e";
  if (score < 85) return "#3b82f6";
  return "#7c3aed";
}

// ── Gate 3: Dispute components ────────────────────────────────────────────────

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  UNDER_DISPUTE:        "#f59e0b",
  RESOLVED_UPHELD:      "#22c55e",
  RESOLVED_OVERTURNED:  "#ef4444",
};

function DisputeStatusBadge({ status }: { status: string }) {
  const color = DISPUTE_STATUS_COLORS[status] ?? "#6b7280";
  return (
    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${color}20`, color }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function DisputeLog({ ventureId, assessmentId }: { ventureId: string; assessmentId: string }) {
  const { data, isLoading, refetch } = trpc.scoreDispute.listDisputes.useQuery(
    { ventureId, status: "ALL", limit: 100 },
    { enabled: !!ventureId },
  );
  if (isLoading) return <div className="text-xs text-gray-500 py-4">Loading dispute log…</div>;
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-xs">
        No score disputes recorded for this venture.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-4 py-2 text-left text-gray-400">Date</th>
            <th className="px-4 py-2 text-left text-gray-400">Dimension</th>
            <th className="px-4 py-2 text-left text-gray-400">Status</th>
            <th className="px-4 py-2 text-left text-gray-400">Raised By</th>
            <th className="px-4 py-2 text-left text-gray-400">Explanation</th>
            <th className="px-4 py-2 text-left text-gray-400">Resolved By</th>
            <th className="px-4 py-2 text-left text-gray-400">Resolution Note</th>
          </tr>
        </thead>
        <tbody>
          {data.map(d => (
            <tr key={d.id} className="border-b border-gray-800 hover:bg-gray-900/50">
              <td className="px-4 py-2 text-gray-500 font-mono whitespace-nowrap">
                {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-2 font-mono text-white font-bold">{d.dimensionKey}</td>
              <td className="px-4 py-2"><DisputeStatusBadge status={d.status} /></td>
              <td className="px-4 py-2 text-gray-400">{d.raisedBy}</td>
              <td className="px-4 py-2 text-gray-300 max-w-xs truncate" title={d.explanation}>{d.explanation}</td>
              <td className="px-4 py-2 text-gray-400">{d.resolvedBy ?? "—"}</td>
              <td className="px-4 py-2 text-gray-400 max-w-xs truncate" title={d.resolvedNote ?? ""}>{d.resolvedNote ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DIMENSION_OPTIONS = [
  { value: "trlScore", label: "TRL — Technology" },
  { value: "mrlScore", label: "MRL — Manufacturing" },
  { value: "brlScore", label: "BRL — Business" },
  { value: "ecoScore", label: "ECO — Environmental" },
  { value: "prlScore", label: "PRL — People" },
  { value: "ipScore",  label: "IP — Intellectual Property" },
  { value: "frlScore", label: "FRL — Financial" },
  { value: "regScore", label: "REG — Regulatory" },
  { value: "srlScore", label: "SRL — Sustainability" },
  { value: "mvlScore", label: "MVL — Market Validation" },
] as const;

function DisputeForm({ assessmentId, ventureId }: { assessmentId: string; ventureId: string }) {
  const [dimensionKey, setDimensionKey] = useState<string>("");
  const [explanation, setExplanation] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = trpc.scoreDispute.raiseDispute.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setDimensionKey("");
      setExplanation("");
      setEvidenceUrl("");
    },
    onError: (e) => setError(e.message),
  });

  if (submitted) {
    return (
      <div className="rounded-lg border border-amber-800 bg-amber-900/20 p-4 text-xs text-amber-300">
        ✓ Dispute raised. The dimension is now in <strong>UNDER_DISPUTE</strong> status. An independent integrity reviewer will be notified.
        <button className="ml-3 underline" onClick={() => setSubmitted(false)}>Raise another</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-xs text-red-300">{error}</div>
      )}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Dimension *</label>
        <select
          value={dimensionKey}
          onChange={e => setDimensionKey(e.target.value)}
          className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">Select a dimension…</option>
          {DIMENSION_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Explanation * (min 10 chars)</label>
        <textarea
          value={explanation}
          onChange={e => setExplanation(e.target.value)}
          placeholder="Describe why you believe this dimension score is inaccurate…"
          rows={3}
          className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Supporting Evidence URL (optional)</label>
        <input
          type="url"
          value={evidenceUrl}
          onChange={e => setEvidenceUrl(e.target.value)}
          placeholder="https://…"
          className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        />
      </div>
      <button
        onClick={() => {
          setError(null);
          if (!dimensionKey) { setError("Please select a dimension."); return; }
          if (explanation.trim().length < 10) { setError("Explanation must be at least 10 characters."); return; }
          mutation.mutate({
            assessmentId,
            ventureId,
            dimensionKey: dimensionKey as typeof DIMENSION_OPTIONS[number]["value"],
            explanation: explanation.trim(),
            evidenceUrl: evidenceUrl.trim() || undefined,
          });
        }}
        disabled={mutation.isPending}
        className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
        style={{ background: "#f59e0b" }}
      >
        {mutation.isPending ? "Raising dispute…" : "Raise Dispute"}
      </button>
    </div>
  );
}

// ── 10-axis SVG Radar ─────────────────────────────────────────────────────────
function RadarChart({ inputs, isVetoed }: { inputs: Record<string, number>; isVetoed: boolean }) {
  const cx = 200, cy = 200, r = 150;
  const n = DIMS.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  // Grid rings
  const rings = [20, 40, 60, 80, 100];

  // Axis lines
  const axes = DIMS.map((d, i) => {
    const angle = startAngle + i * angleStep;
    const outer = toXY(angle, r);
    const label = toXY(angle, r + 24);
    return { ...d, angle, outer, label };
  });

  // Data polygon
  const dataPoints = DIMS.map((d, i) => {
    const val = inputs[d.key] ?? 0;
    const angle = startAngle + i * angleStep;
    return toXY(angle, (val / 100) * r);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  const vetoPoints = DIMS.map((d, i) => {
    const val = inputs[d.key] ?? 0;
    const angle = startAngle + i * angleStep;
    const isVetoedDim = val < 20;
    return { ...toXY(angle, (val / 100) * r), isVetoedDim, val, code: d.code, color: d.color };
  });

  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-sm mx-auto">
      {/* Grid rings */}
      {rings.map(ring => {
        const pts = DIMS.map((_, i) => {
          const angle = startAngle + i * angleStep;
          return toXY(angle, (ring / 100) * r);
        });
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
        return <path key={ring} d={path} fill="none" stroke="#30363d" strokeWidth="0.5" />;
      })}

      {/* Axis lines */}
      {axes.map(a => (
        <line key={a.key} x1={cx} y1={cy} x2={a.outer.x} y2={a.outer.y} stroke="#30363d" strokeWidth="0.5" />
      ))}

      {/* Data polygon */}
      <path
        d={dataPath}
        fill={isVetoed ? "rgba(239,68,68,0.15)" : "rgba(86, 168, 55,0.15)"}
        stroke={isVetoed ? "#ef4444" : "#56A837"}
        strokeWidth="1.5"
      />

      {/* Data points */}
      {vetoPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={p.isVetoedDim ? "#ef4444" : p.color}
          stroke="#0D1117"
          strokeWidth="1.5"
        />
      ))}

      {/* Axis labels */}
      {axes.map(a => {
        const val = inputs[a.key] ?? 0;
        const isVetoedDim = val < 20;
        const textAnchor = a.label.x < cx - 5 ? "end" : a.label.x > cx + 5 ? "start" : "middle";
        return (
          <g key={a.key}>
            <text
              x={a.label.x}
              y={a.label.y}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              fontSize="10"
              fontFamily="monospace"
              fill={isVetoedDim ? "#ef4444" : "#9ca3af"}
              fontWeight={isVetoedDim ? "bold" : "normal"}
            >
              {a.code}
            </text>
            <text
              x={a.label.x}
              y={a.label.y + 12}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              fontSize="9"
              fontFamily="monospace"
              fill={isVetoedDim ? "#ef4444" : "#6b7280"}
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* Centre score */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="28" fontWeight="bold" fill={isVetoed ? "#ef4444" : "#56A837"} fontFamily="monospace">
        {isVetoed ? "0" : Math.round(DIMS.reduce((s, d) => s + (inputs[d.key] ?? 0), 0) / DIMS.length)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#6b7280" fontFamily="monospace">
        {isVetoed ? "VETOED" : "avg input"}
      </text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VrlResults() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const ventureId = params.get("ventureId") ?? "ecoblend";
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "transparency" | "disputes">("overview");

  const { data: latest, isLoading } = trpc.vrl.getLatestAssessment.useQuery({ ventureId });
  const { data: history } = trpc.vrl.getHistory.useQuery({ ventureId, limit: 20 });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D1117]">
        <div className="text-gray-400 text-sm">Loading VRL assessment…</div>
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0D1117] gap-4">
        <div className="text-gray-400 text-sm">No VRL assessment found for this venture.</div>
        <Button onClick={() => navigate("/vrl-assessment")} style={{ background: "#56A837", color: "#fff" }}>
          Submit First Assessment <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    );
  }

  const bandColor = getBandColor(latest.globalVrlScore);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0D1117]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#56A83715", color: "#56A837" }}>
                VRL Results
              </span>
              <span className="text-xs text-gray-500 font-mono">{ventureId}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              VRL Assessment Dashboard
            </h1>
            <p className="text-sm text-gray-400">
              Weighted Gating Model · 10 readiness dimensions · 5 meta-domains
              {latest.mrlIsGoverned && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-indigo-900/50 text-indigo-300 border border-indigo-800">
                  Profile SV-01 — MRL: N/A (Governed)
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={() => navigate("/vrl-assessment")}
            size="sm"
            style={{ background: "#56A837", color: "#fff" }}
          >
            New Assessment
          </Button>
        </div>

        {/* Veto banner */}
        {latest.isVetoed && (
          <div className="mt-4 bg-red-950 border border-red-800 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-400 mb-1">Veto Gate Active — Global VRL Score = 0</div>
              <p className="text-xs text-red-300">
                One or more dimensions scored below the minimum threshold of 20. The venture cannot progress until all dimensions reach at least 20.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {(["overview", "history", "transparency", "disputes"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{
                background: activeTab === tab ? "#56A837" : "transparent",
                color: activeTab === tab ? "#fff" : "#9ca3af",
                border: activeTab === tab ? "none" : "1px solid #30363d",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview tab ─────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Radar + score */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">10-Axis Readiness Radar</div>
              <RadarChart inputs={latest.inputs as Record<string, number>} isVetoed={latest.isVetoed} />
            </div>

            {/* Global score card */}
            <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5 text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Global VRL Score</div>
              <div className="text-6xl font-bold font-mono mb-1" style={{ color: latest.isVetoed ? "#ef4444" : bandColor }}>
                {latest.globalVrlScore}
              </div>
              <div className="text-sm font-semibold mb-1" style={{ color: latest.isVetoed ? "#ef4444" : bandColor }}>
                {latest.bandLabel}
              </div>
              <div className="text-xs text-gray-500">Base average: {latest.baseAverage.toFixed(1)}</div>
              <div className="text-xs text-gray-600 mt-1 font-mono">
                {new Date(latest.createdAt).toLocaleDateString()} · {latest.submittedBy ?? "system"}
              </div>
              {/* D7 evidence status badge */}
              <div className="mt-3 flex justify-center">
                <EvidenceStatusBadge status={(latest as any).evidenceStatus ?? "unverified"} />
              </div>
            </div>

            {/* D7: Evidence Panel — show when any dimension is self-assessed */}
            {((latest as any).hasUnverifiedInputs || (latest as any).evidenceStatus !== "fully_verified") && (
              <VrlEvidencePanel
                assessmentId={latest.id}
                selfAssessedDimensions={(latest as any).selfAssessedDimensions ?? []}
                evidenceStatus={(latest as any).evidenceStatus ?? "unverified"}
                updatedAt={(latest as any).updatedAt}
                confirmedBy={(latest as any).evidenceConfirmedBy}
                confirmedAt={(latest as any).evidenceConfirmedAt}
                submittedEvidenceLinks={(latest as any).submittedEvidenceLinks ?? null}
                onConfirmed={() => { /* confirmations.refetch() via panel's own query */ }}
              />
            )}
          </div>

          {/* Meta-domain bars + raw scores */}
          <div className="xl:col-span-2 space-y-4">
            {/* Meta-domain bars */}
            <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Meta-Domain Scores</div>
              <div className="space-y-4">
                {META_DOMAINS.map(md => {
                  const score = (latest.metaDomains as Record<string, number>)[md.key] ?? 0;
                  return (
                    <div key={md.key}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div>
                          <span className="text-sm font-semibold text-white">{md.label}</span>
                          <span className="text-xs text-gray-500 ml-2 font-mono">{md.formula}</span>
                        </div>
                        <span className="text-lg font-bold font-mono" style={{ color: md.color }}>{score.toFixed(1)}</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${score}%`, background: md.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Raw 10-dimension scores — Gate 2 adds MVL */}
            <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Raw Dimension Scores</div>
              <div className="grid grid-cols-3 gap-3">
                {DIMS.map(d => {
                  const val = (latest.inputs as Record<string, number>)[d.key] ?? 0;
                  const isVetoedDim = val < 20;
                  return (
                    <div
                      key={d.key}
                      className="rounded-lg p-3 border text-center"
                      style={{ borderColor: isVetoedDim ? "#ef4444" : "#30363d", background: isVetoedDim ? "#1a0a0a" : "#0D1117" }}
                    >
                      <div className="text-xs font-mono font-bold mb-0.5" style={{ color: isVetoedDim ? "#ef4444" : d.color }}>
                        {d.code}
                      </div>
                      <div className="text-2xl font-bold font-mono" style={{ color: isVetoedDim ? "#ef4444" : "#fff" }}>
                        {val}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{d.label}</div>
                      {isVetoedDim && (
                        <div className="mt-1">
                          <AlertTriangle size={10} className="text-red-400 inline" />
                          <span className="text-xs text-red-400 ml-0.5">Veto</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── History tab ──────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="p-8">
          <div className="bg-[#161b22] rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-white">Assessment History</span>
              <Badge variant="outline" className="text-xs ml-auto">{history?.length ?? 0} records</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left text-gray-400 font-semibold">Date</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">Score</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">Band</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">Vetoed</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">TRL</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">MRL</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">BRL</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">ECO</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">PRL</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">IP</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">FRL</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">REG</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold">SRL</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-semibold">Submitted By</th>
                  </tr>
                </thead>
                <tbody>
                  {(history ?? []).map((row, idx) => {
                    const color = getBandColor(row.globalVrlScore);
                    return (
                      <tr key={row.id} className={`border-b border-gray-800 ${idx === 0 ? "bg-[#0D1117]" : ""}`}>
                        <td className="px-4 py-3 text-gray-400 font-mono whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center font-bold font-mono" style={{ color }}>
                          {row.globalVrlScore}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${color}20`, color }}>
                            {row.bandLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.isVetoed
                            ? <AlertTriangle size={12} className="text-red-400 inline" />
                            : <CheckCircle2 size={12} className="text-green-500 inline" />
                          }
                        </td>
                        {(["trlScore","mrlScore","brlScore","ecoScore","prlScore","ipScore","frlScore","regScore","srlScore"] as const).map(k => {
                          const v = (row.inputs as Record<string, number>)[k] ?? 0;
                          return (
                            <td key={k} className="px-4 py-3 text-center font-mono" style={{ color: v < 20 ? "#ef4444" : "#9ca3af" }}>
                              {v}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-gray-500">{row.submittedBy ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Disputes tab — Gate 3: Score Dispute & Escalation Log ──────────── */}
      {activeTab === "disputes" && (
        <div className="p-8">
          <div className="space-y-4">
            <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-sm font-semibold text-white">Dispute History & Escalation Log</span>
                <span className="text-xs text-gray-500 ml-1">Gate 3 — FHV-EB-AUD-001 §2</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Score disputes are raised when a reviewer disagrees with an assessment dimension. Each dispute requires a mandatory explanation and is resolved only by a <span className="text-indigo-300 font-semibold">SCORING_INTEGRITY_REVIEWER</span> or admin — never by the assessment submitter. Resolution does not overwrite scores; a <span className="text-amber-300 font-semibold">RESOLVED_OVERTURNED</span> outcome signals that a corrected assessment should be submitted.
              </p>
              <DisputeLog ventureId={ventureId} assessmentId={latest.id} />
            </div>

            <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
              <div className="text-sm font-semibold text-white mb-3">Raise a Score Dispute</div>
              <p className="text-xs text-gray-400 mb-4">
                If you believe a dimension score is inaccurate, flag it below. You must provide a minimum 10-character explanation. The score will enter <span className="text-amber-300 font-semibold">UNDER_DISPUTE</span> status and will be reviewed by an independent integrity reviewer.
              </p>
              <DisputeForm assessmentId={latest.id} ventureId={ventureId} />
            </div>
          </div>
        </div>
      )}

      {/* ── Transparency tab ─────────────────────────────────────────────────── */}
      {activeTab === "transparency" && (
        <div className="p-8 max-w-3xl">
          <div className="space-y-4">
            <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
              <div className="text-sm font-semibold text-white mb-4">Calculation Transparency — BEBUS-VRL-UPDATE-001</div>

              <div className="space-y-3 text-xs font-mono">
                <div className="text-gray-400 border-b border-gray-800 pb-2">Step 1: Raw Inputs</div>
                <div className="grid grid-cols-3 gap-2">
                  {DIMS.map(d => {
                    const v = (latest.inputs as Record<string, number>)[d.key] ?? 0;
                    return (
                      <div key={d.key} className="flex justify-between bg-[#0D1117] rounded px-2 py-1">
                        <span className="text-gray-500">{d.code}</span>
                        <span style={{ color: v < 20 ? "#ef4444" : "#9ca3af" }}>{v}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-gray-400 border-b border-gray-800 pb-2 pt-2">Step 2: Meta-Domain Computation</div>
                {META_DOMAINS.map(md => {
                  const score = (latest.metaDomains as Record<string, number>)[md.key] ?? 0;
                  return (
                    <div key={md.key} className="flex justify-between bg-[#0D1117] rounded px-2 py-1">
                      <span className="text-gray-500">{md.label} = {md.formula}</span>
                      <span style={{ color: md.color }}>{score.toFixed(2)}</span>
                    </div>
                  );
                })}

                <div className="text-gray-400 border-b border-gray-800 pb-2 pt-2">Step 3: Weighted Base Average (Gate 2)</div>
                <div className="bg-[#0D1117] rounded px-2 py-1 flex justify-between">
                  <span className="text-gray-500">Product×0.175 + Market×0.30 + Exec×0.175 + Struct×0.175 + Sustain×0.175</span>
                  <span className="text-white">{latest.baseAverage.toFixed(2)}</span>
                </div>

                <div className="text-gray-400 border-b border-gray-800 pb-2 pt-2">Step 4: Veto Gate</div>
                <div className="bg-[#0D1117] rounded px-2 py-1 flex justify-between">
                  <span className="text-gray-500">Any dimension &lt; 20?</span>
                  <span style={{ color: latest.isVetoed ? "#ef4444" : "#22c55e" }}>
                    {latest.isVetoed ? "YES — veto active" : "NO — all clear"}
                  </span>
                </div>

                <div className="text-gray-400 border-b border-gray-800 pb-2 pt-2">Step 5: Global VRL Score</div>
                <div className="bg-[#0D1117] rounded px-2 py-1 flex justify-between">
                  <span className="text-gray-500">
                    {latest.isVetoed ? "0 (vetoed)" : `round(${latest.baseAverage.toFixed(2)}) = ${latest.globalVrlScore}`}
                  </span>
                  <span style={{ color: getBandColor(latest.globalVrlScore) }}>{latest.globalVrlScore} — {latest.bandLabel}</span>
                </div>
              </div>
            </div>

            {/* Band reference */}
            <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
              <div className="text-sm font-semibold text-white mb-3">Band Reference Table</div>
              <div className="space-y-2">
                {[
                  { range: "0–19",   level: 0, label: "Pre-Readiness", color: "#6b7280" },
                  { range: "20–39",  level: 1, label: "Emerging",      color: "#f59e0b" },
                  { range: "40–54",  level: 2, label: "Developing",    color: "#f97316" },
                  { range: "55–69",  level: 3, label: "Established",   color: "#22c55e" },
                  { range: "70–84",  level: 4, label: "Advanced",      color: "#3b82f6" },
                  { range: "85–100", level: 5, label: "Exemplary",     color: "#7c3aed" },
                ].map(b => (
                  <div key={b.level} className="flex items-center gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: b.color }} />
                    <span className="font-mono text-gray-500 w-14">{b.range}</span>
                    <span className="font-semibold" style={{ color: b.color }}>VRL-{b.level}: {b.label}</span>
                    {latest.bandLabel === b.label && (
                      <Badge variant="outline" className="ml-auto text-xs" style={{ borderColor: b.color, color: b.color }}>
                        Current
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
