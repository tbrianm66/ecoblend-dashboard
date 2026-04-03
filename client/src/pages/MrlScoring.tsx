/**
 * MRL Scoring Page — BEBUS-MRL-SCORE-001
 * Tabs: Scorer | Examples | History | Formula Reference
 */
import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  FlaskConical, BookOpen, History, Calculator,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Zap, BarChart3, Shield, Leaf, Link2,
} from "lucide-react";

// ── CONSTANTS (mirrored from engine for UI display only) ──────────────────────

const CATEGORIES = [
  { key: "process",        label: "Process Readiness",      color: "#00E5C8", icon: <Zap size={14} />,        weight: 0.28, ids: ["p1","p2","p3","p4","p5","p6"] },
  { key: "supply_chain",   label: "Supply Chain Readiness", color: "#FF6B35", icon: <Link2 size={14} />,       weight: 0.22, ids: ["s1","s2","s3","s4","s5","s6"] },
  { key: "cost",           label: "Cost Readiness",         color: "#FBBF24", icon: <BarChart3 size={14} />,   weight: 0.20, ids: ["c1","c2","c3","c4","c5","c6"] },
  { key: "quality",        label: "Quality Readiness",      color: "#A855F7", icon: <Shield size={14} />,      weight: 0.18, ids: ["q1","q2","q3","q4","q5","q6"] },
  { key: "sustainability", label: "Sustainability",          color: "#4ADE80", icon: <Leaf size={14} />,        weight: 0.12, ids: ["e1","e2","e3","e4","e5","e6"] },
] as const;

const INDICATOR_LABELS: Record<string, string> = {
  p1: "Process route defined", p2: "Equipment identified", p3: "Cycle time validated",
  p4: "Yield rate measured",   p5: "Tooling lead time known", p6: "DFM review completed",
  s1: "Tier-1 suppliers identified", s2: "Dual-source available", s3: "MOQ acceptable",
  s4: "Lead time < target",    s5: "Supplier audit completed", s6: "Contract / NDA in place",
  c1: "BOM costed",            c2: "CapEx model validated",    c3: "Unit cost at target volume",
  c4: "Break-even volume known", c5: "GM% ≥ threshold",        c6: "FX / commodity hedged",
  q1: "QMS defined",           q2: "Key specs documented",     q3: "Test methods validated",
  q4: "First article plan exists", q5: "Compliance standards mapped", q6: "Defect rate target set",
  e1: "LCA scope defined",     e2: "Carbon intensity measured", e3: "Scope 3 mapped",
  e4: "Circular design features", e5: "Social risk assessed",  e6: "ESG reporting framework",
};

const CRITICAL_IDS = new Set(["p1","p2","p4","s1","s4","c1","c3","c5","q1","q2","q5"]);

const MATURITY_LABELS = ["Assumed","Estimated","Measured","Validated","Certified"];
const MATURITY_M      = [0.60, 0.80, 1.00, 1.10, 1.20];

const MRL_THRESHOLDS = [
  { level: 1, label: "Concept",      min: 0,   max: 11  },
  { level: 2, label: "Feasibility",  min: 11,  max: 22  },
  { level: 3, label: "Process Dev",  min: 22,  max: 33  },
  { level: 4, label: "Pilot Ready",  min: 33,  max: 44  },
  { level: 5, label: "Pilot Proven", min: 44,  max: 55  },
  { level: 6, label: "Pre-Series",   min: 55,  max: 66  },
  { level: 7, label: "Low-Rate",     min: 66,  max: 77  },
  { level: 8, label: "Scale-Up",     min: 77,  max: 88  },
  { level: 9, label: "Industrial",   min: 88,  max: 100 },
];

const LEVEL_ACCENTS = [
  "#94A3B8","#38BDF8","#2DD4BF","#4ADE80","#A3E635",
  "#FBBF24","#FF6B35","#F87171","#C084FC",
];

function levelColor(l: number) { return LEVEL_ACCENTS[(l - 1)] ?? "#94A3B8"; }

function scoreColor(s: number) {
  if (s >= 8) return "#4ADE80";
  if (s >= 6) return "#00E5C8";
  if (s >= 4) return "#FBBF24";
  if (s >= 2) return "#FF6B35";
  return "#FF3355";
}

// ── DEFAULT SCORES ────────────────────────────────────────────────────────────

type CatScores = Record<string, number> & { maturity: number };
type AllScores = Record<string, CatScores>;

function defaultScores(): AllScores {
  const out: AllScores = {};
  for (const cat of CATEGORIES) {
    const entry: CatScores = { maturity: 2 };
    for (const id of cat.ids) entry[id] = 5;
    out[cat.key] = entry;
  }
  return out;
}

// ── SPARK BAR ─────────────────────────────────────────────────────────────────

function SparkBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ height: 6, background: "#0D1520", borderRadius: 3, overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: 3 }} />
    </div>
  );
}

// ── SCORER TAB ────────────────────────────────────────────────────────────────

function ScorerTab() {
  const [scores, setScores] = useState<AllScores>(defaultScores);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ process: true });
  const [ventureName, setVentureName] = useState("");

  const { data: result, refetch } = trpc.mrlScoring.computeAdHoc.useQuery(
    scores as any,
    { refetchOnWindowFocus: false }
  );

  const saveMutation = trpc.mrlScoring.computeAndSave.useMutation({
    onSuccess: (data) => {
      toast.success(`Session saved — MRL ${data.mrl_level}: ${data.mrl_label} (${data.mrl_score})`);
    },
    onError: () => toast.error("Failed to save session"),
  });

  const setScore = useCallback((cat: string, id: string, val: number) => {
    setScores(prev => ({
      ...prev,
      [cat]: { ...prev[cat], [id]: val },
    }));
  }, []);

  const setMaturity = useCallback((cat: string, val: number) => {
    setScores(prev => ({
      ...prev,
      [cat]: { ...prev[cat], maturity: val },
    }));
  }, []);

  const handleSave = () => {
    saveMutation.mutate({ ...scores, venture_name: ventureName || undefined } as any);
  };

  const handleLoadDataset = (ds: any) => {
    const newScores = defaultScores();
    for (const cat of CATEGORIES) {
      newScores[cat.key].maturity = (ds.maturityScores as any)[cat.key] ?? 2;
      for (const id of cat.ids) {
        newScores[cat.key][id] = (ds.indicatorScores as any)[id] ?? 5;
      }
    }
    setScores(newScores);
    toast.success(`Loaded: ${ds.name}`);
  };

  const { data: datasets } = trpc.mrlScoring.getDatasets.useQuery();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* Left: input panel */}
      <div className="xl:col-span-3 flex flex-col gap-4">
        {/* Quick-load datasets */}
        <div className="rounded-xl border p-4" style={{ borderColor: "#1E2A3A", background: "#0D1520" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#64748B" }}>
            Quick-load example dataset
          </p>
          <div className="flex flex-wrap gap-2">
            {datasets?.map(ds => (
              <button
                key={ds.datasetId}
                onClick={() => handleLoadDataset(ds)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{ background: "#1E2A3A", color: "#94A3B8" }}
              >
                {ds.name} <span style={{ color: "#64748B" }}>({ds.sector})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category inputs */}
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="rounded-xl border overflow-hidden" style={{ borderColor: "#1E2A3A", background: "#0D1520" }}>
            <button
              className="w-full flex items-center justify-between px-5 py-3"
              onClick={() => setExpanded(e => ({ ...e, [cat.key]: !e[cat.key] }))}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: cat.color }}>{cat.icon}</span>
                <span className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>{cat.label}</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: "#1E2A3A", color: "#64748B" }}>
                  w={cat.weight}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Maturity selector */}
                <select
                  value={scores[cat.key].maturity}
                  onChange={e => setMaturity(cat.key, Number(e.target.value))}
                  onClick={e => e.stopPropagation()}
                  className="text-xs rounded px-2 py-1"
                  style={{ background: "#1E2A3A", color: "#94A3B8", border: "1px solid #2D3A4A" }}
                >
                  {MATURITY_LABELS.map((l, i) => (
                    <option key={i} value={i}>{l} (M={MATURITY_M[i]})</option>
                  ))}
                </select>
                {expanded[cat.key] ? <ChevronUp size={14} style={{ color: "#64748B" }} /> : <ChevronDown size={14} style={{ color: "#64748B" }} />}
              </div>
            </button>

            {expanded[cat.key] && (
              <div className="px-5 pb-4 flex flex-col gap-2">
                {cat.ids.map(id => {
                  const val = scores[cat.key][id] ?? 5;
                  const isCritical = CRITICAL_IDS.has(id);
                  return (
                    <div key={id} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-52 shrink-0">
                        {isCritical && <span style={{ color: "#FF6B35", fontSize: 10 }}>★</span>}
                        <span className="text-xs" style={{ color: isCritical ? "#E2E8F0" : "#94A3B8" }}>
                          {INDICATOR_LABELS[id]}
                        </span>
                      </div>
                      <input
                        type="range" min={0} max={10} step={0.5}
                        value={val}
                        onChange={e => setScore(cat.key, id, Number(e.target.value))}
                        className="flex-1"
                        style={{ accentColor: cat.color }}
                      />
                      <span className="text-xs font-mono w-8 text-right" style={{ color: scoreColor(val) }}>
                        {val.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right: results panel */}
      <div className="xl:col-span-2 flex flex-col gap-4">
        {result && (
          <>
            {/* Main score */}
            <div className="rounded-xl border p-5" style={{ borderColor: "#1E2A3A", background: "#0D1520" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#64748B" }}>MRL Score</span>
                {result.gate_locked && (
                  <Badge variant="outline" className="text-xs gap-1" style={{ borderColor: "#FF6B35", color: "#FF6B35" }}>
                    <AlertTriangle size={10} /> Gate Locked
                  </Badge>
                )}
              </div>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-5xl font-bold font-mono" style={{ color: levelColor(result.mrl_level) }}>
                  {result.mrl_score}
                </span>
                <div className="pb-1">
                  <div className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>
                    MRL {result.mrl_level} — {result.mrl_label}
                  </div>
                  <div className="text-xs" style={{ color: "#64748B" }}>
                    ±{result.confidence_band} confidence band
                  </div>
                </div>
              </div>
              {/* Level bar */}
              <div className="flex gap-0.5 mt-3">
                {MRL_THRESHOLDS.map(t => (
                  <div
                    key={t.level}
                    className="flex-1 rounded-sm"
                    style={{
                      height: 8,
                      background: t.level <= result.mrl_level ? levelColor(t.level) : "#1E2A3A",
                    }}
                    title={`MRL ${t.level}: ${t.label}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: "#64748B" }}>
                <span>MRL 1</span><span>MRL 9</span>
              </div>
              {result.gate_locked && result.gate_reason && (
                <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "#FF6B3515", color: "#FF6B35", border: "1px solid #FF6B3530" }}>
                  <strong>Gate reason:</strong> {result.gate_reason}
                </div>
              )}
              {result.mrl_score_raw !== result.mrl_score && (
                <div className="mt-2 text-xs" style={{ color: "#64748B" }}>
                  Raw score (pre-lock): {result.mrl_score_raw}
                </div>
              )}
            </div>

            {/* Category breakdown */}
            <div className="rounded-xl border p-5" style={{ borderColor: "#1E2A3A", background: "#0D1520" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#64748B" }}>
                Category Breakdown
              </p>
              <div className="flex flex-col gap-3">
                {CATEGORIES.map(cat => {
                  const cr = (result.categories as any)[cat.key];
                  if (!cr) return null;
                  return (
                    <div key={cat.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: cat.color }}>{cat.icon}</span>
                          <span className="text-xs" style={{ color: "#94A3B8" }}>{cat.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span style={{ color: "#64748B" }}>S={cr.score_S?.toFixed ? cr.score_S.toFixed(2) : cr.score_S}</span>
                          <span style={{ color: "#64748B" }}>M={cr.maturity_M}</span>
                          <span style={{ color: cat.color }}>+{cr.contribution?.toFixed ? cr.contribution.toFixed(3) : cr.contribution}</span>
                        </div>
                      </div>
                      <SparkBar value={Number(cr.score_S)} color={cat.color} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VRL feed */}
            <div className="rounded-xl border p-4" style={{ borderColor: "#1E2A3A", background: "#0D1520" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#64748B" }}>
                VRL Feed (§6)
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Normalised", value: result.vrl_feed.mrl_score_normalised?.toFixed(3) },
                  { label: "VRL Weight", value: "0.30" },
                  { label: "Contribution", value: result.vrl_feed.vrl_mrl_contribution?.toFixed(4) },
                ].map(item => (
                  <div key={item.label} className="rounded-lg p-2" style={{ background: "#1E2A3A" }}>
                    <div className="text-xs font-mono" style={{ color: "#4ADE80" }}>{item.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Venture name (optional)"
                value={ventureName}
                onChange={e => setVentureName(e.target.value)}
                className="text-sm rounded-lg px-3 py-2"
                style={{ background: "#0D1520", border: "1px solid #1E2A3A", color: "#E2E8F0" }}
              />
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full"
                style={{ background: "#00E5C8", color: "#0D1117" }}
              >
                {saveMutation.isPending ? "Saving…" : "Save to Audit Log"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── EXAMPLES TAB ──────────────────────────────────────────────────────────────

function ExamplesTab() {
  const { data: datasets, isLoading } = trpc.mrlScoring.getDatasets.useQuery();
  const [selected, setSelected] = useState<string | null>(null);

  if (isLoading) return <div className="text-sm" style={{ color: "#64748B" }}>Loading datasets…</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {datasets?.map(ds => {
        // Compute result client-side for display
        const isOpen = selected === ds.datasetId;
        return (
          <div
            key={ds.datasetId}
            className="rounded-xl border cursor-pointer"
            style={{ borderColor: isOpen ? "#00E5C8" : "#1E2A3A", background: "#0D1520" }}
            onClick={() => setSelected(isOpen ? null : ds.datasetId)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-bold" style={{ color: "#E2E8F0" }}>{ds.name}</div>
                  <div className="text-xs" style={{ color: "#64748B" }}>{ds.sector}</div>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: ds.expectedGateLocked ? "#FF6B35" : "#4ADE80",
                    color: ds.expectedGateLocked ? "#FF6B35" : "#4ADE80",
                  }}
                >
                  {ds.expectedGateLocked ? "Gate Locked" : "Pass"}
                </Badge>
              </div>
              <div className="text-xs mb-3" style={{ color: "#94A3B8" }}>{ds.description}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#64748B" }}>Expected MRL:</span>
                <span
                  className="text-sm font-bold font-mono"
                  style={{ color: levelColor(ds.expectedMrlLevel ?? 1) }}
                >
                  {ds.expectedMrlLevel}
                </span>
              </div>
            </div>
            {isOpen && (
              <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "#1E2A3A" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#64748B" }}>Indicator Scores</p>
                <div className="grid grid-cols-3 gap-1">
                  {Object.entries(ds.indicatorScores as Record<string, number>).sort().map(([id, val]) => (
                    <div key={id} className="flex items-center gap-1">
                      <span className="text-xs font-mono w-5" style={{ color: CRITICAL_IDS.has(id) ? "#FF6B35" : "#64748B" }}>{id}</span>
                      <SparkBar value={val} color={scoreColor(val)} />
                      <span className="text-xs font-mono w-5 text-right" style={{ color: scoreColor(val) }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── HISTORY TAB ───────────────────────────────────────────────────────────────

function HistoryTab() {
  const { data: sessions, isLoading } = trpc.mrlScoring.getSessions.useQuery();
  const { data: stats } = trpc.mrlScoring.getPortfolioStats.useQuery();

  if (isLoading) return <div className="text-sm" style={{ color: "#64748B" }}>Loading sessions…</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sessions", value: stats.totalSessions, color: "#00E5C8" },
            { label: "Avg MRL Score",  value: stats.avgMrlScore,   color: "#FBBF24" },
            { label: "Avg MRL Level",  value: stats.avgMrlLevel,   color: "#4ADE80" },
            { label: "Gate Locked",    value: stats.gateLockedCount, color: "#FF6B35" },
          ].map(item => (
            <div key={item.label} className="rounded-xl border p-4" style={{ borderColor: "#1E2A3A", background: "#0D1520" }}>
              <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "#64748B" }}>{item.label}</div>
              <div className="text-2xl font-bold font-mono" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sessions table */}
      {!sessions?.length ? (
        <div className="text-sm text-center py-12" style={{ color: "#64748B" }}>
          No sessions saved yet. Use the Scorer tab to compute and save your first assessment.
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#1E2A3A" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#0D1520", borderBottom: "1px solid #1E2A3A" }}>
                {["Venture","MRL Score","Level","Gate","CB","Saved"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#64748B" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={s.sessionId} style={{ background: i % 2 === 0 ? "#0A1018" : "#0D1520", borderBottom: "1px solid #1E2A3A" }}>
                  <td className="px-4 py-3" style={{ color: "#E2E8F0" }}>{s.ventureName ?? "—"}</td>
                  <td className="px-4 py-3 font-mono font-bold" style={{ color: levelColor(s.mrlLevel) }}>{Number(s.mrlScore).toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs" style={{ borderColor: levelColor(s.mrlLevel), color: levelColor(s.mrlLevel) }}>
                      MRL {s.mrlLevel} — {s.mrlLabel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {s.gateLocked
                      ? <span className="text-xs flex items-center gap-1" style={{ color: "#FF6B35" }}><AlertTriangle size={10} /> Locked</span>
                      : <span className="text-xs flex items-center gap-1" style={{ color: "#4ADE80" }}><CheckCircle2 size={10} /> Clear</span>
                    }
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "#64748B" }}>±{Number(s.confidenceBand).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── FORMULA TAB ───────────────────────────────────────────────────────────────

function FormulaTab() {
  const formulas = [
    {
      id: "F1", title: "Master Formula",
      formula: "MRL_score = [ Σ(w_i × S_i × M_i) / Σw_i ] × 10",
      desc: "Weighted sum of category contributions, normalised by total weight, scaled to [0–100]. Gate lock may cap the final score at 44.",
    },
    {
      id: "F2", title: "Category Weights",
      formula: "Σ w_i = 1.0  (Process 0.28 · Supply 0.22 · Cost 0.20 · Quality 0.18 · Sustainability 0.12)",
      desc: "Weights reflect the relative importance of each readiness dimension. They are fixed constants, not configurable.",
    },
    {
      id: "F3", title: "Category Score S_i",
      formula: "S_i = (Σ sub-indicator scores) / n_indicators  ∈ [0, 10]",
      desc: "Simple arithmetic mean of the 6 sub-indicator scores within each category. No rounding at this stage.",
    },
    {
      id: "F4", title: "Maturity Multiplier M_i",
      formula: "M_i ∈ { 0.60, 0.80, 1.00, 1.10, 1.20 }  (Assumed → Certified)",
      desc: "Evidence quality bonus. A category scored at M=1.20 (Certified) contributes 2× more than the same category at M=0.60 (Assumed).",
    },
    {
      id: "F5", title: "Gate Lock",
      formula: "If any critical indicator < floor_threshold → MRL_score = min(raw_score, 44)",
      desc: "11 critical indicators have floor thresholds. Any single breach caps the final MRL score at 44 (top of MRL 4). The raw score is preserved for diagnostic purposes.",
    },
    {
      id: "F6", title: "Confidence Band",
      formula: "CB = ± ( σ_evidence × 100 ) / ( √n_indicators × 10 )",
      desc: "Population standard deviation of all 30 sub-indicator scores, scaled to ±points. Higher variance in scores → wider confidence band → lower reliability of the MRL estimate.",
    },
    {
      id: "F7", title: "MRL Level Lookup",
      formula: "Level = threshold_lookup(MRL_score_effective)  → MRL 1–9",
      desc: "Each 11-point band maps to one MRL level (1=Concept through 9=Industrial). Lookup always uses the effective score (after gate lock), never the raw score.",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border p-5" style={{ borderColor: "#1E2A3A", background: "#0D1520" }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#64748B" }}>Reference</p>
        <p className="text-sm" style={{ color: "#94A3B8" }}>
          BEBUS-MRL-SCORE-001 · Quantitative MRL Scoring System · Schema v1.0.0
        </p>
      </div>
      {formulas.map(f => (
        <div key={f.id} className="rounded-xl border p-5" style={{ borderColor: "#1E2A3A", background: "#0D1520" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#1E2A3A", color: "#00E5C8" }}>{f.id}</span>
            <span className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>{f.title}</span>
          </div>
          <div className="rounded-lg px-4 py-3 mb-3 font-mono text-sm" style={{ background: "#0A1018", color: "#00E5C8", border: "1px solid #1E2A3A" }}>
            {f.formula}
          </div>
          <p className="text-sm" style={{ color: "#94A3B8" }}>{f.desc}</p>
        </div>
      ))}

      {/* MRL threshold table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#1E2A3A" }}>
        <div className="px-5 py-3" style={{ background: "#0D1520", borderBottom: "1px solid #1E2A3A" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#64748B" }}>MRL Level Thresholds (F7)</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#0A1018", borderBottom: "1px solid #1E2A3A" }}>
              {["Level","Label","Score Range","TRL Alignment"].map(h => (
                <th key={h} className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#64748B" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MRL_THRESHOLDS.map((t, i) => (
              <tr key={t.level} style={{ background: i % 2 === 0 ? "#0A1018" : "#0D1520", borderBottom: "1px solid #1E2A3A" }}>
                <td className="px-4 py-2 font-mono font-bold" style={{ color: levelColor(t.level) }}>MRL {t.level}</td>
                <td className="px-4 py-2" style={{ color: "#E2E8F0" }}>{t.label}</td>
                <td className="px-4 py-2 font-mono text-xs" style={{ color: "#94A3B8" }}>{t.min}–{t.max}</td>
                <td className="px-4 py-2 text-xs" style={{ color: "#64748B" }}>
                  {["TRL 1–2","TRL 2–3","TRL 3–4","TRL 4–5","TRL 5–6","TRL 6–7","TRL 7–8","TRL 8–9","TRL 9"][i]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function MrlScoring() {
  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#0A1018" }}>
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#1E2A3A", background: "#0D1520" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#00E5C815", color: "#00E5C8" }}>
                BEBUS-MRL-SCORE-001
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#E2E8F0", fontFamily: "'Prompt', sans-serif" }}>
              MRL Scoring System
            </h1>
            <p className="text-sm max-w-xl" style={{ color: "#64748B" }}>
              Quantitative Manufacturing Readiness Level scoring across 5 weighted categories, 30 sub-indicators, and 4 maturity multiplier levels.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#64748B" }}>
            <span>★ = Critical indicator</span>
            <span>·</span>
            <span>Gate lock caps at MRL 4 (score 44)</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        <Tabs defaultValue="scorer">
          <TabsList className="mb-6" style={{ background: "#0D1520", border: "1px solid #1E2A3A" }}>
            <TabsTrigger value="scorer" className="gap-1.5 text-xs">
              <FlaskConical size={13} /> Scorer
            </TabsTrigger>
            <TabsTrigger value="examples" className="gap-1.5 text-xs">
              <BookOpen size={13} /> Examples
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs">
              <History size={13} /> History
            </TabsTrigger>
            <TabsTrigger value="formula" className="gap-1.5 text-xs">
              <Calculator size={13} /> Formula Reference
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scorer"><ScorerTab /></TabsContent>
          <TabsContent value="examples"><ExamplesTab /></TabsContent>
          <TabsContent value="history"><HistoryTab /></TabsContent>
          <TabsContent value="formula"><FormulaTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
