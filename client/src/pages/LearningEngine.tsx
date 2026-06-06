/**
 * Learning Engine Page
 * Sprint 69 — EcoBlend VBS Platform
 *
 * 5-panel intelligence dashboard:
 *   1. Problem Heatmap     — Frequency × Severity matrix across all ventures
 *   2. VRL Dashboard       — Scoring engine, history chart, scenario analysis
 *   3. Insight Feed        — Structured insights with AI processing
 *   4. Decision Panel      — Recommendations ranked by priority
 *   5. Knowledge Graph     — Node/edge visualisation
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Brain, Zap, TrendingUp, AlertTriangle, CheckCircle2,
  FileText, Network, BarChart3, Lightbulb, RefreshCw,
  ChevronRight, Clock, Target, Shield, FlaskConical,
  BookOpen, Users, ArrowUpRight, Loader2, Plus, X
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GREEN = "#56A837";
const BLUE = "#3B85BA";
const AMBER = "#F69111";
const RED = "#EF4444";
const PURPLE = "#8B5CF6";
const FONT = "'Prompt', sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function priorityColor(p: string) {
  if (p === "critical") return RED;
  if (p === "high") return AMBER;
  if (p === "medium") return BLUE;
  return "#6b7280";
}

function stageColor(s: string) {
  if (s === "investment_ready") return GREEN;
  if (s === "scale_ready") return BLUE;
  if (s === "mvp") return AMBER;
  if (s === "validation") return PURPLE;
  return "#6b7280";
}

function stageLabel(s: string) {
  return s?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—";
}

function sourceIcon(type: string) {
  if (type === "interview") return <Users size={12} />;
  if (type === "research") return <BookOpen size={12} />;
  if (type === "experiment") return <FlaskConical size={12} />;
  return <FileText size={12} />;
}

// ─── Problem Heatmap Panel ────────────────────────────────────────────────────
function ProblemHeatmapPanel() {
  const problemsQuery = trpc.learningEngine.structuring.listProblems.useQuery({});
  const problems = problemsQuery.data ?? [];

  const updateStatus = trpc.learningEngine.structuring.updateProblemStatus.useMutation({
    onSuccess: () => { toast.success("Problem status updated"); problemsQuery.refetch(); },
  });

  const sectors = useMemo(() => {
    const s = new Set(problems.map((p: any) => p.sector));
    return Array.from(s) as string[];
  }, [problems]);

  const heatmapData = useMemo(() => {
    const grid: Record<string, Record<string, number>> = {};
    for (let sev = 5; sev >= 1; sev--) {
      grid[sev] = {};
      for (let freq = 1; freq <= 5; freq++) {
        grid[sev][freq] = problems.filter(
          (p: any) => p.severityScore === sev && p.frequencyScore === freq
        ).length;
      }
    }
    return grid;
  }, [problems]);

  const maxCount = useMemo(() => {
    let max = 0;
    Object.values(heatmapData).forEach((row) => {
      Object.values(row).forEach((v) => { if (v > max) max = v; });
    });
    return max || 1;
  }, [heatmapData]);

  const statusColors: Record<string, string> = {
    active: BLUE, validated: GREEN, invalidated: "#6b7280", archived: "#374151",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Heatmap */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: FONT }}>Problem Frequency × Severity Heatmap</h3>
            <p className="text-xs text-gray-400 mt-0.5">{problems.length} problems mapped across {sectors.length} sectors</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => problemsQuery.refetch()} className="gap-1.5 text-xs">
            <RefreshCw size={12} /> Refresh
          </Button>
        </div>

        {problemsQuery.isLoading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin" style={{ color: BLUE }} /></div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              {/* Y-axis label */}
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center justify-center" style={{ width: 80, minHeight: 200 }}>
                  <span className="text-xs text-gray-400 font-semibold" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>SEVERITY →</span>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((sev) => (
                    <div key={sev} className="flex items-center gap-1 mb-1">
                      <span className="text-xs text-gray-400 w-4 text-right">{sev}</span>
                      {[1, 2, 3, 4, 5].map((freq) => {
                        const count = heatmapData[sev]?.[freq] ?? 0;
                        const intensity = count / maxCount;
                        const bg = count === 0 ? "#f9fafb" : `rgba(59, 133, 186, ${0.15 + intensity * 0.75})`;
                        return (
                          <div
                            key={freq}
                            className="flex items-center justify-center rounded text-xs font-bold cursor-default transition-all"
                            style={{ width: 52, height: 40, background: bg, color: count > 0 ? "#fff" : "#d1d5db", border: "1px solid #e5e7eb" }}
                            title={`Severity ${sev}, Frequency ${freq}: ${count} problems`}
                          >
                            {count > 0 ? count : ""}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="flex items-center gap-1 mt-1 ml-5">
                    {[1, 2, 3, 4, 5].map((f) => (
                      <div key={f} className="text-xs text-gray-400 text-center" style={{ width: 52 }}>{f}</div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 text-center mt-1 ml-5">FREQUENCY →</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Problem List */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: FONT }}>Problem Registry</h3>
        {problems.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No problems logged yet. Process inputs to populate the registry.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {problems.slice(0, 20).map((p: any) => (
              <div key={p.id} className="flex items-start justify-between p-4 rounded-lg border" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${BLUE}15`, color: BLUE }}>{p.sector}</span>
                    <span className="text-xs text-gray-400">{p.customerSegment}</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium leading-snug">{p.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">Severity: <strong style={{ color: p.severityScore >= 4 ? RED : p.severityScore >= 3 ? AMBER : GREEN }}>{p.severityScore}/5</strong></span>
                    <span className="text-xs text-gray-400">Frequency: <strong style={{ color: BLUE }}>{p.frequencyScore}/5</strong></span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${statusColors[p.status]}15`, color: statusColors[p.status] }}>
                    {p.status}
                  </span>
                  {p.status === "active" && (
                    <button
                      onClick={() => updateStatus.mutate({ id: p.id, status: "validated" })}
                      className="text-xs text-green-600 hover:underline"
                    >
                      Mark Validated
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VRL Dashboard Panel ──────────────────────────────────────────────────────
function VrlDashboardPanel() {
  const { ventures } = useVentures();
  const [selectedVenture, setSelectedVenture] = useState<string>(ventures[0]?.id ?? "");
  const [alpha, setAlpha] = useState(0.5);
  const [beta, setBeta] = useState(0.5);

  const portfolioQuery = trpc.learningEngine.vrlEngine.portfolioSummary.useQuery();
  const historyQuery = trpc.learningEngine.vrlEngine.history.useQuery(
    { ventureId: selectedVenture, limit: 10 },
    { enabled: !!selectedVenture }
  );
  const scenarioQuery = trpc.learningEngine.vrlEngine.scenarioAnalysis.useQuery(
    {
      ventureId: selectedVenture,
      scenarios: [
        { name: "Tech-Heavy (α=0.7)", alpha: 0.7, beta: 0.3 },
        { name: "Balanced (α=0.5)", alpha: 0.5, beta: 0.5 },
        { name: "Market-Heavy (α=0.3)", alpha: 0.3, beta: 0.7 },
      ],
    },
    { enabled: !!selectedVenture }
  );

  const calculateVrl = trpc.learningEngine.vrlEngine.calculate.useMutation({
    onSuccess: (data) => {
      toast.success(`VRL calculated: ${data.vrlScore} (${stageLabel(data.stage)})`);
      historyQuery.refetch();
      portfolioQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const portfolioData = portfolioQuery.data ?? [];
  const historyData = historyQuery.data && !Array.isArray(historyQuery.data) ? historyQuery.data : null;
  const history = historyData?.history ?? [];
  const trend = historyData?.trend ?? "stable";
  const scenarios = scenarioQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Portfolio Summary */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: FONT }}>Portfolio VRL Overview</h3>
        {portfolioQuery.isLoading ? (
          <div className="flex items-center justify-center h-20"><Loader2 className="animate-spin" style={{ color: BLUE }} /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {portfolioData.map((v: any) => (
              <button
                key={v.ventureId}
                onClick={() => setSelectedVenture(v.ventureId)}
                className="p-3 rounded-lg border text-left transition-all hover:shadow-md"
                style={{
                  borderColor: selectedVenture === v.ventureId ? BLUE : "#e5e7eb",
                  background: selectedVenture === v.ventureId ? `${BLUE}08` : "#fff",
                }}
              >
                <div className="text-xs font-semibold text-gray-500 truncate">{v.ventureName}</div>
                <div className="text-xl font-bold mt-1" style={{ color: v.vrlScore ? stageColor(v.stage) : "#9ca3af", fontFamily: FONT }}>
                  {v.vrlScore ? v.vrlScore.toFixed(1) : "—"}
                </div>
                <div className="text-xs mt-0.5" style={{ color: v.stage ? stageColor(v.stage) : "#9ca3af" }}>
                  {v.stage ? stageLabel(v.stage) : "Not calculated"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VRL Calculator */}
      {selectedVenture && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calculator */}
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: FONT }}>
              VRL Calculator — {ventures.find((v) => v.id === selectedVenture)?.name}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">α (TRL Weight): {alpha.toFixed(2)}</label>
                <input
                  type="range" min={0} max={1} step={0.05} value={alpha}
                  onChange={(e) => { const v = parseFloat(e.target.value); setAlpha(v); setBeta(parseFloat((1 - v).toFixed(2))); }}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">β (BRL Weight): {beta.toFixed(2)}</label>
                <input
                  type="range" min={0} max={1} step={0.05} value={beta}
                  onChange={(e) => { const v = parseFloat(e.target.value); setBeta(v); setAlpha(parseFloat((1 - v).toFixed(2))); }}
                  className="w-full accent-blue-500"
                />
              </div>
              <div className="p-3 rounded-lg text-xs text-gray-500" style={{ background: "#f9fafb" }}>
                <strong>Formula:</strong> VRL = (α×TRL + β×BRL) × (1 − Risk) × Confidence
              </div>
              <Button
                onClick={() => calculateVrl.mutate({ ventureId: selectedVenture, alpha, beta })}
                disabled={calculateVrl.isPending}
                className="gap-2 text-sm"
                style={{ background: GREEN, color: "#fff" }}
              >
                {calculateVrl.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                Calculate VRL
              </Button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: FONT }}>Calculation History</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                background: trend === "improving" ? `${GREEN}15` : trend === "declining" ? `${RED}15` : `${BLUE}15`,
                color: trend === "improving" ? GREEN : trend === "declining" ? RED : BLUE,
              }}>
                {trend === "improving" ? "↑ Improving" : trend === "declining" ? "↓ Declining" : "→ Stable"}
              </span>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">No calculations yet. Run the VRL Calculator.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((h: any, i: number) => (
                  <div key={h.id} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: "#f3f4f6" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">#{history.length - i}</span>
                      <span className="text-sm font-bold" style={{ color: stageColor(h.stage), fontFamily: FONT }}>
                        {Number(h.vrlScore).toFixed(2)}
                      </span>
                      <span className="text-xs" style={{ color: stageColor(h.stage) }}>{stageLabel(h.stage)}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(h.calculatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scenario Analysis */}
      {scenarios.length > 0 && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: FONT }}>Scenario Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {scenarios.map((s: any) => (
              <div key={s.name} className="p-4 rounded-lg border" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs font-semibold text-gray-500 mb-2">{s.name}</div>
                <div className="text-2xl font-bold" style={{ color: stageColor(s.stage), fontFamily: FONT }}>{s.vrlScore}</div>
                <div className="text-xs mt-1" style={{ color: stageColor(s.stage) }}>{stageLabel(s.stage)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">α={s.alpha}</span>
                  <span className="text-xs text-gray-400">β={s.beta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Insight Feed Panel ───────────────────────────────────────────────────────
function InsightFeedPanel() {
  const { ventures } = useVentures();
  const [selectedVenture, setSelectedVenture] = useState<string>(ventures[0]?.id ?? "");
  const [rawInput, setRawInput] = useState("");
  const [sourceType, setSourceType] = useState<"interview" | "research" | "experiment" | "market_data" | "book" | "expert_input">("interview");
  const [showForm, setShowForm] = useState(false);

  const insightsQuery = trpc.learningEngine.structuring.listInsights.useQuery(
    { ventureId: selectedVenture },
    { enabled: !!selectedVenture }
  );

  const processInput = trpc.learningEngine.structuring.processInput.useMutation({
    onSuccess: (data) => {
      toast.success(`Insight structured: "${data.structured.keyInsight?.slice(0, 60)}..."`);
      setRawInput("");
      setShowForm(false);
      insightsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const insights = insightsQuery.data ?? [];

  const sourceColors: Record<string, string> = {
    interview: BLUE, research: PURPLE, experiment: GREEN,
    market_data: AMBER, book: "#6b7280", expert_input: RED,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Venture selector + Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {ventures.slice(0, 6).map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVenture(v.id)}
              className="text-xs px-3 py-1.5 rounded-full border font-semibold transition-all"
              style={{
                borderColor: selectedVenture === v.id ? v.color : "#e5e7eb",
                background: selectedVenture === v.id ? `${v.color}15` : "#fff",
                color: selectedVenture === v.id ? v.color : "#6b7280",
              }}
            >
              {v.name}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 text-xs" style={{ background: GREEN, color: "#fff" }}>
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? "Cancel" : "Process Input"}
        </Button>
      </div>

      {/* Input form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: FONT }}>AI Structuring Agent — Process New Input</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Source Type</label>
              <div className="flex flex-wrap gap-2">
                {(["interview", "research", "experiment", "market_data", "book", "expert_input"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSourceType(t)}
                    className="text-xs px-3 py-1.5 rounded-full border font-semibold transition-all"
                    style={{
                      borderColor: sourceType === t ? sourceColors[t] : "#e5e7eb",
                      background: sourceType === t ? `${sourceColors[t]}15` : "#fff",
                      color: sourceType === t ? sourceColors[t] : "#6b7280",
                    }}
                  >
                    {t.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Raw Input (interview transcript, research note, etc.)</label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Paste interview transcript, research findings, experiment results, or any raw venture intelligence here..."
                className="w-full h-32 text-sm border rounded-lg p-3 resize-none focus:outline-none focus:ring-1"
                style={{ borderColor: "#e5e7eb", fontFamily: "inherit" }}
              />
            </div>
            <Button
              onClick={() => processInput.mutate({ rawInput, sourceType, ventureId: selectedVenture })}
              disabled={processInput.isPending || rawInput.length < 10}
              className="gap-2 text-sm self-start"
              style={{ background: BLUE, color: "#fff" }}
            >
              {processInput.isPending ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
              {processInput.isPending ? "Structuring..." : "Structure with AI"}
            </Button>
          </div>
        </div>
      )}

      {/* Insight Feed */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: FONT }}>
            Structured Insights — {ventures.find((v) => v.id === selectedVenture)?.name}
          </h3>
          <span className="text-xs text-gray-400">{insights.length} insights</span>
        </div>
        {insightsQuery.isLoading ? (
          <div className="flex items-center justify-center h-20"><Loader2 className="animate-spin" style={{ color: BLUE }} /></div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No insights yet. Use the AI Structuring Agent to process raw inputs.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {insights.map((ins: any) => {
              const tags: string[] = JSON.parse(ins.tags ?? "[]");
              return (
                <div key={ins.id} className="p-4 rounded-lg border" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: `${sourceColors[ins.sourceType]}15`, color: sourceColors[ins.sourceType] }}>
                          {sourceIcon(ins.sourceType)} {ins.sourceType?.replace(/_/g, " ")}
                        </span>
                        {ins.ipSensitive && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${RED}15`, color: RED }}>
                            IP Sensitive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 leading-snug">{ins.content}</p>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tags.slice(0, 6).map((t: string) => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#6b7280" }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < (ins.evidenceStrength ?? 0) ? GREEN : "#e5e7eb" }} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{new Date(ins.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Decision Panel ───────────────────────────────────────────────────────────
function DecisionPanel() {
  const { ventures } = useVentures();
  const [selectedVenture, setSelectedVenture] = useState<string>(ventures[0]?.id ?? "");

  const recsQuery = trpc.learningEngine.recommendations.list.useQuery(
    { ventureId: selectedVenture, status: "active" },
    { enabled: !!selectedVenture }
  );
  const predictQuery = trpc.learningEngine.patterns.predictSuccess.useQuery(
    { ventureId: selectedVenture },
    { enabled: !!selectedVenture }
  );

  const generateRecs = trpc.learningEngine.recommendations.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.recommendations.length} recommendations generated`);
      recsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.learningEngine.recommendations.updateStatus.useMutation({
    onSuccess: () => recsQuery.refetch(),
  });

  const recs = recsQuery.data ?? [];
  const prediction = predictQuery.data;

  const typeIcons: Record<string, React.ReactNode> = {
    next_interview: <Users size={14} />,
    missing_validation: <Target size={14} />,
    technical_risk: <Shield size={14} />,
    pivot_signal: <ArrowUpRight size={14} />,
    go_no_go: <CheckCircle2 size={14} />,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Venture selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {ventures.slice(0, 6).map((v) => (
          <button
            key={v.id}
            onClick={() => setSelectedVenture(v.id)}
            className="text-xs px-3 py-1.5 rounded-full border font-semibold transition-all"
            style={{
              borderColor: selectedVenture === v.id ? v.color : "#e5e7eb",
              background: selectedVenture === v.id ? `${v.color}15` : "#fff",
              color: selectedVenture === v.id ? v.color : "#6b7280",
            }}
          >
            {v.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Success Prediction */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: FONT }}>Success Prediction</h3>
          {prediction ? (
            <div className="flex flex-col gap-3">
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: prediction.successProbability > 0.6 ? GREEN : prediction.successProbability > 0.4 ? AMBER : RED, fontFamily: FONT }}>
                  {Math.round(prediction.successProbability * 100)}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Success Probability</div>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${prediction.successProbability * 100}%`, background: prediction.successProbability > 0.6 ? GREEN : prediction.successProbability > 0.4 ? AMBER : RED }} />
              </div>
              <div className="flex flex-col gap-2 text-xs text-gray-500">
                <div className="flex justify-between"><span>VRL Score</span><strong>{prediction.vrlScore}</strong></div>
                <div className="flex justify-between"><span>Evidence Quality</span><strong>{Math.round(prediction.evidenceQuality * 100)}%</strong></div>
                <div className="flex justify-between"><span>Risk Penalty</span><strong style={{ color: RED }}>{Math.round(prediction.riskPenalty * 100)}%</strong></div>
                <div className="flex justify-between"><span>Time to Market</span><strong>{prediction.timeToMarketMonths} months</strong></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-xs">Run VRL calculation first to enable prediction.</div>
          )}
        </div>

        {/* Recommendations */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: FONT }}>
              AI Recommendations ({recs.length})
            </h3>
            <Button
              size="sm"
              onClick={() => generateRecs.mutate({ ventureId: selectedVenture })}
              disabled={generateRecs.isPending}
              className="gap-1.5 text-xs"
              style={{ background: PURPLE, color: "#fff" }}
            >
              {generateRecs.isPending ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />}
              {generateRecs.isPending ? "Generating..." : "Generate"}
            </Button>
          </div>
          {recs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No active recommendations. Click Generate to run the AI Recommendation Engine.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {recs.map((r: any) => {
                const actionItems: string[] = JSON.parse(r.actionItems ?? "[]");
                return (
                  <div key={r.id} className="p-4 rounded-lg border" style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${priorityColor(r.priority)}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ color: priorityColor(r.priority) }}>{typeIcons[r.type]}</span>
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: priorityColor(r.priority) }}>{r.priority}</span>
                          <span className="text-xs text-gray-400">{r.type?.replace(/_/g, " ")}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{r.title}</p>
                        {r.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.description}</p>}
                        {actionItems.length > 0 && (
                          <ul className="mt-2 flex flex-col gap-1">
                            {actionItems.slice(0, 3).map((a: string, i: number) => (
                              <li key={i} className="text-xs text-gray-500 flex items-start gap-1">
                                <ChevronRight size={10} className="mt-0.5 shrink-0" style={{ color: BLUE }} />
                                {a}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => updateStatus.mutate({ id: r.id, status: "completed" })}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Done
                        </button>
                        <button
                          onClick={() => updateStatus.mutate({ id: r.id, status: "dismissed" })}
                          className="text-xs text-gray-400 hover:underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Knowledge Graph Panel ────────────────────────────────────────────────────
function KnowledgeGraphPanel() {
  const { ventures } = useVentures();
  const [selectedVenture, setSelectedVenture] = useState<string>(ventures[0]?.id ?? "");

  const statsQuery = trpc.learningEngine.knowledgeGraph.portfolioStats.useQuery();
  const graphQuery = trpc.learningEngine.knowledgeGraph.getGraph.useQuery(
    { ventureId: selectedVenture },
    { enabled: !!selectedVenture }
  );
  const patternsQuery = trpc.learningEngine.patterns.list.useQuery({ activeOnly: true });

  const buildGraph = trpc.learningEngine.knowledgeGraph.build.useMutation({
    onSuccess: (data) => {
      toast.success(`Graph built: ${data.totalNodes} nodes created`);
      graphQuery.refetch();
      statsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const detectPatterns = trpc.learningEngine.patterns.detect.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.patterns.length} patterns detected from ${data.analysedInsights} insights`);
      patternsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const stats = statsQuery.data;
  const graph = graphQuery.data ?? { nodes: [], edges: [] };
  const patterns = patternsQuery.data ?? [];

  const nodeTypeColors: Record<string, string> = {
    problem: RED, solution: GREEN, technology: BLUE,
    market: AMBER, person: PURPLE, organization: "#6b7280",
  };

  const patternTypeColors: Record<string, string> = {
    problem_cluster: RED, success_indicator: GREEN, failure_signal: AMBER,
    pivot_trigger: PURPLE, sector_trend: BLUE,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Portfolio Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Graph Nodes", value: stats.totalNodes, color: BLUE },
            { label: "Graph Edges", value: stats.totalEdges, color: GREEN },
            { label: "Problems Mapped", value: stats.totalProblems, color: RED },
            { label: "Structured Insights", value: stats.totalInsights, color: PURPLE },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">{kpi.label}</div>
              <div className="text-3xl font-bold mt-1" style={{ color: kpi.color, fontFamily: FONT }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph Viewer */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: FONT }}>Knowledge Graph</h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedVenture}
                onChange={(e) => setSelectedVenture(e.target.value)}
                className="text-xs border rounded px-2 py-1"
                style={{ borderColor: "#e5e7eb" }}
              >
                {ventures.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <Button
                size="sm"
                onClick={() => buildGraph.mutate({ ventureId: selectedVenture })}
                disabled={buildGraph.isPending}
                className="gap-1.5 text-xs"
                style={{ background: BLUE, color: "#fff" }}
              >
                {buildGraph.isPending ? <Loader2 size={12} className="animate-spin" /> : <Network size={12} />}
                Build
              </Button>
            </div>
          </div>

          {/* Node legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(nodeTypeColors).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
                {type}
              </span>
            ))}
          </div>

          {graph.nodes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No graph data. Click Build to generate the knowledge graph.</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {graph.nodes.map((n: any) => (
                <div key={n.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "#f9fafb" }}>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: nodeTypeColors[n.nodeType] ?? "#6b7280" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-700 truncate">{n.label}</div>
                    <div className="text-xs text-gray-400">{n.nodeType}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {graph.edges.length > 0 && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
              <div className="text-xs font-semibold text-gray-500 mb-2">{graph.edges.length} Relationships</div>
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                {graph.edges.slice(0, 8).map((e: any) => (
                  <div key={e.id} className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="font-mono">Node {e.fromNodeId}</span>
                    <ChevronRight size={10} />
                    <span className="font-semibold" style={{ color: BLUE }}>{e.relationship}</span>
                    <ChevronRight size={10} />
                    <span className="font-mono">Node {e.toNodeId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pattern Detection */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: FONT }}>Detected Patterns ({patterns.length})</h3>
            <Button
              size="sm"
              onClick={() => detectPatterns.mutate({})}
              disabled={detectPatterns.isPending}
              className="gap-1.5 text-xs"
              style={{ background: PURPLE, color: "#fff" }}
            >
              {detectPatterns.isPending ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
              {detectPatterns.isPending ? "Detecting..." : "Detect"}
            </Button>
          </div>

          {patterns.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No patterns detected yet. Process more insights then click Detect.</div>
          ) : (
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
              {patterns.map((p: any) => (
                <div key={p.id} className="p-3 rounded-lg border" style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${patternTypeColors[p.patternType] ?? "#6b7280"}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: patternTypeColors[p.patternType] ?? "#6b7280" }}>
                      {p.patternType?.replace(/_/g, " ")}
                    </span>
                    {p.sector && <span className="text-xs text-gray-400">{p.sector}</span>}
                    <span className="ml-auto text-xs font-mono text-gray-400">×{p.frequency}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{p.title}</p>
                  {p.description && <p className="text-xs text-gray-500 mt-1">{p.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Number(p.confidenceScore ?? 0) * 100}%`, background: patternTypeColors[p.patternType] ?? "#6b7280" }} />
                    </div>
                    <span className="text-xs text-gray-400">{Math.round(Number(p.confidenceScore ?? 0) * 100)}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LearningEngine() {
  const [activeTab, setActiveTab] = useState("vrl");

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: `${PURPLE}15`, color: PURPLE }}>
                Intelligence Layer
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">5-Layer Learning Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: FONT }}>
              EcoBlend Learning Engine
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl mt-1">
              AI-powered intelligence system — Structuring Agent processes raw inputs, VRL Scoring Engine calculates dual-readiness scores, Pattern Detection identifies signals, and the Recommendation Engine generates prioritised actions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 px-3 py-1.5 rounded-lg border" style={{ borderColor: "#e5e7eb" }}>
              <Brain size={12} style={{ color: PURPLE }} />
              <span>VRL = (α×TRL + β×BRL) × (1−Risk) × Confidence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="vrl" className="gap-1.5 text-xs">
              <BarChart3 size={13} /> VRL Dashboard
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5 text-xs">
              <Brain size={13} /> Insight Feed
            </TabsTrigger>
            <TabsTrigger value="problems" className="gap-1.5 text-xs">
              <AlertTriangle size={13} /> Problem Heatmap
            </TabsTrigger>
            <TabsTrigger value="decisions" className="gap-1.5 text-xs">
              <Lightbulb size={13} /> Decision Panel
            </TabsTrigger>
            <TabsTrigger value="graph" className="gap-1.5 text-xs">
              <Network size={13} /> Knowledge Graph
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vrl"><VrlDashboardPanel /></TabsContent>
          <TabsContent value="insights"><InsightFeedPanel /></TabsContent>
          <TabsContent value="problems"><ProblemHeatmapPanel /></TabsContent>
          <TabsContent value="decisions"><DecisionPanel /></TabsContent>
          <TabsContent value="graph"><KnowledgeGraphPanel /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
