/**
 * VRL Assessment Form — BEBUS-VRL-UPDATE-001
 * Change 5: 9-dimension input form with veto warning and live preview
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ChevronRight, Info, Link, ChevronDown, ChevronUp } from "lucide-react";

// ── Dimension definitions ─────────────────────────────────────────────────────
const DIMENSIONS = [
  {
    key: "trlScore" as const,
    code: "TRL",
    label: "Technology Readiness",
    meta: "Product",
    metaColor: "#3b82f6",
    description: "Maturity of the core technology from concept to proven deployment",
    weight: "40% of Product",
  },
  {
    key: "mrlScore" as const,
    code: "MRL",
    label: "Manufacturing Readiness",
    meta: "Product / Execution",
    metaColor: "#3b82f6",
    description: "Ability to produce the product at target quality, cost, and volume",
    weight: "35% of Product · 40% of Execution",
  },
  {
    key: "brlScore" as const,
    code: "BRL",
    label: "Business Readiness",
    meta: "Product / Market",
    metaColor: "#22c55e",
    description: "Commercial model, revenue traction, and go-to-market capability",
    weight: "25% of Product · 50% of Market",
  },
  {
    key: "ecoScore" as const,
    code: "ECO",
    label: "Environmental Impact",
    meta: "Sustainability",
    metaColor: "#10b981",
    description: "LCA-backed environmental performance across the product lifecycle",
    weight: "60% of Sustainability",
  },
  {
    key: "prlScore" as const,
    code: "PRL",
    label: "People & Org Readiness",
    meta: "Market",
    metaColor: "#22c55e",
    description: "Team capability, organisational design, and talent pipeline",
    weight: "50% of Market",
  },
  {
    key: "ipScore" as const,
    code: "IP",
    label: "Intellectual Property",
    meta: "Structural",
    metaColor: "#f59e0b",
    description: "IP portfolio strength, freedom-to-operate, and protection strategy",
    weight: "50% of Structural",
  },
  {
    key: "frlScore" as const,
    code: "FRL",
    label: "Financial Readiness",
    meta: "Execution",
    metaColor: "#8b5cf6",
    description: "Runway, unit economics, funding strategy, and financial controls",
    weight: "60% of Execution",
  },
  {
    key: "regScore" as const,
    code: "REG",
    label: "Regulatory Readiness",
    meta: "Structural",
    metaColor: "#f59e0b",
    description: "Compliance status, regulatory pathway clarity, and certification progress",
    weight: "50% of Structural",
  },
  {
    key: "srlScore" as const,
    code: "SRL",
    label: "Sustainability Readiness",
    meta: "Sustainability",
    metaColor: "#10b981",
    description: "Governance, ESG reporting, CSRD alignment, and sustainability strategy",
    weight: "40% of Sustainability",
  },
  {
    key: "mvlScore" as const,
    code: "MVL",
    label: "Market Validation",
    meta: "Market",
    metaColor: "#22c55e",
    description: "Customer demand evidence, discovery interviews, pilot traction, and TAM/SAM/SOM validation. Environmental/ecological substance is assessed under SRL and ESG — not here.",
    weight: "50% of Market · 15% composite",
  },
] as const;

type ScoreKey = typeof DIMENSIONS[number]["key"];

const VETO_THRESHOLD = 20;

// ── Band helper ───────────────────────────────────────────────────────────────
function getBandColor(score: number): string {
  if (score < 20) return "#6b7280";
  if (score < 40) return "#f59e0b";
  if (score < 55) return "#f97316";
  if (score < 70) return "#22c55e";
  if (score < 85) return "#3b82f6";
  return "#7c3aed";
}
function getBandLabel(score: number): string {
  if (score < 20) return "Pre-Readiness";
  if (score < 40) return "Emerging";
  if (score < 55) return "Developing";
  if (score < 70) return "Established";
  if (score < 85) return "Advanced";
  return "Exemplary";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function VrlAssessmentForm() {
  const [, navigate] = useLocation();

  const [ventureId, setVentureId] = useState("ecoblend");
  // Gate 2 / Profile SV-01: software, social, and service ventures mark MRL as N/A (Governed)
  const [sv01Active, setSv01Active] = useState(false);

  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    trlScore: 50, mrlScore: 50, brlScore: 50,
    ecoScore: 50, prlScore: 50, ipScore: 50,
    frlScore: 50, regScore: 50, srlScore: 50,
    mvlScore: 50,
  });
  // D7: evidence links per dimension
  const [evidenceLinks, setEvidenceLinks] = useState<Record<string, string>>({});
  const [showEvidence, setShowEvidence] = useState(false);

  const submitMutation = trpc.vrl.submitAssessment.useMutation({
    onSuccess: (data) => {
      toast.success(`VRL Assessment submitted — Score: ${data.globalVrlScore} (${data.bandLabel})`);
      navigate(`/vrl-results?ventureId=${ventureId}`);
    },
    onError: (err) => toast.error(`Submission failed: ${err.message}`),
  });

  // Live preview calculations — Gate 2 formula (10 dimensions)
  const preview = useMemo(() => {
    const { trlScore, mrlScore, brlScore, ecoScore, prlScore, ipScore, frlScore, regScore, srlScore, mvlScore } = scores;
    // Profile SV-01: MRL excluded from Product and Execution
    const product        = sv01Active
      ? trlScore * (0.40 / 0.65) + brlScore * (0.25 / 0.65)
      : trlScore * 0.40 + mrlScore * 0.35 + brlScore * 0.25;
    // Market: BRL×0.25 + PRL×0.25 + MVL×0.50 → MVL canonical 15% composite
    const market         = brlScore * 0.25 + prlScore * 0.25 + mvlScore * 0.50;
    const execution      = sv01Active ? frlScore * 1.00 : frlScore * 0.60 + mrlScore * 0.40;
    const structural     = ipScore  * 0.50 + regScore * 0.50;
    const sustainability = ecoScore * 0.60 + srlScore * 0.40;
    // Weighted base average: product×0.175 + market×0.30 + execution×0.175 + structural×0.175 + sustainability×0.175
    const base = product * 0.175 + market * 0.30 + execution * 0.175 + structural * 0.175 + sustainability * 0.175;
    // Veto gate: SV-01 skips mrlScore check
    const vetoed = DIMENSIONS
      .filter(d => !(sv01Active && d.key === "mrlScore") && scores[d.key] < VETO_THRESHOLD)
      .map(d => d.code);
    const globalScore = vetoed.length > 0 ? 0 : Math.round(base);
    return { product, market, execution, structural, sustainability, base, vetoed, globalScore };
  }, [scores, sv01Active]);

  const handleSlider = (key: ScoreKey, val: number) => {
    setScores(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = () => {
    // Filter out blank evidence URLs before sending
    const cleanEvidence = Object.fromEntries(
      Object.entries(evidenceLinks).filter(([, v]) => v.trim() !== "")
    );
    submitMutation.mutate({
      ventureId,
      ...scores,
      profile: sv01Active ? "SV-01_SOCIAL_SOFTWARE" : "STANDARD",
      mrlIsUnscored: sv01Active,
      evidenceLinks: Object.keys(cleanEvidence).length > 0 ? cleanEvidence : undefined,
    });
  };

  const evidenceFilled = Object.values(evidenceLinks).filter(v => v.trim()).length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0D1117]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#56A83715", color: "#56A837" }}>
            VRL Weighted Gating Model
          </span>
          <span className="text-xs text-gray-500">BEBUS-VRL-UPDATE-001</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
          New VRL Assessment
        </h1>
        <p className="text-sm text-gray-400">
          Score all 10 readiness dimensions (0–100). Any scored dimension below 20 triggers a veto gate and sets the Global VRL Score to 0.
        </p>
      </div>

      <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Sliders */}
        <div className="xl:col-span-2 space-y-4">
          {/* Venture selector */}
          <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-2">Venture</label>
            <select
              value={ventureId}
              onChange={e => setVentureId(e.target.value)}
              className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#56A837]"
            >
              <option value="bebus">BEBUS</option>
              <option value="ecoblend">EcoComp</option>
              <option value="ecoblend-rd">EcoRace</option>
              <option value="pipe">PIPE</option>
              <option value="real">REAL</option>
              <option value="tone">TONE</option>
            </select>
          </div>

          {/* Profile SV-01 toggle */}
          <div className="bg-[#161b22] rounded-xl border border-gray-800 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sv01Active}
                onChange={e => setSv01Active(e.target.checked)}
                className="mt-0.5 shrink-0 accent-[#56A837]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Profile SV-01 — Social / Software / Service</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-800">Governed N/A</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  This venture does not manufacture a physical product. MRL will be marked as <strong className="text-gray-400">N/A (Governed)</strong> and excluded from the veto gate and composite formula. Applies to software, social enterprise, and pure-service ventures per FHV-EB-AUD-001 §2.2.
                </p>
              </div>
            </label>
          </div>

          {/* Score sliders */}
          {DIMENSIONS.map(dim => {
            const isMrlGoverned = sv01Active && dim.key === "mrlScore";
            const val = scores[dim.key];
            const isVetoed = !isMrlGoverned && val < VETO_THRESHOLD;
            const trackColor = isMrlGoverned ? "#6b7280" : isVetoed ? "#ef4444" : getBandColor(val);
            return (
              <div
                key={dim.key}
                className="bg-[#161b22] rounded-xl border p-5 transition-all"
                style={{ borderColor: isMrlGoverned ? "#374151" : isVetoed ? "#ef4444" : "#30363d" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded font-mono" style={{ background: `${trackColor}20`, color: trackColor }}>
                        {dim.code}
                      </span>
                      <span className="text-sm font-semibold text-white">{dim.label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${dim.metaColor}15`, color: dim.metaColor }}>
                        {dim.meta}
                      </span>
                      {isMrlGoverned && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">N/A · Governed (SV-01)</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{dim.description}</p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    {isMrlGoverned
                      ? <span className="text-sm font-bold font-mono text-gray-500">N/A</span>
                      : <span className="text-2xl font-bold font-mono" style={{ color: trackColor }}>{val}</span>
                    }
                    <div className="text-xs text-gray-500 mt-0.5">{isMrlGoverned ? "Excluded" : getBandLabel(val)}</div>
                  </div>
                </div>

                {isMrlGoverned ? (
                  <div className="w-full h-2 rounded-full bg-gray-800" />
                ) : (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={val}
                    onChange={e => handleSlider(dim.key, Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${trackColor} ${val}%, #30363d ${val}%)`,
                      accentColor: trackColor,
                    }}
                  />
                )}

                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>{isMrlGoverned ? "Governed N/A — excluded from veto and formula" : "0 — Pre-Readiness"}</span>
                  <span className="text-gray-500">{dim.weight}</span>
                  {!isMrlGoverned && <span>100 — Exemplary</span>}
                </div>

                {isVetoed && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                    <AlertTriangle size={12} />
                    Score below veto threshold (20) — will set Global VRL to 0
                  </div>
                )}
              </div>
            );
          })}

          {/* D7: Evidence Links (collapsible) */}
          <div className="bg-[#161b22] rounded-xl border border-gray-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowEvidence(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Link size={14} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-300">Evidence Links</span>
                <span className="text-xs text-gray-500">(optional — D7)</span>
                {evidenceFilled > 0 && (
                  <Badge variant="outline" className="text-xs border-green-800 text-green-400">
                    {evidenceFilled}/10 provided
                  </Badge>
                )}
              </div>
              {showEvidence ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
            </button>

            {showEvidence && (
              <div className="px-5 pb-5 space-y-2 border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-500 mb-3">
                  Provide a URL for each dimension to mark it as evidence-backed. Dimensions without a URL will be flagged as self-assessed after submission.
                </p>
                {DIMENSIONS.map(dim => (
                  <div key={dim.key} className="flex items-center gap-2">
                    <span
                      className="text-xs font-mono font-bold w-9 shrink-0"
                      style={{ color: dim.metaColor }}
                    >
                      {dim.code}
                    </span>
                    <input
                      type="url"
                      placeholder={`Evidence URL for ${dim.label}`}
                      value={evidenceLinks[dim.key] ?? ""}
                      onChange={e =>
                        setEvidenceLinks(prev => ({ ...prev, [dim.key]: e.target.value }))
                      }
                      className="flex-1 bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full h-12 text-base font-semibold"
            style={{ background: "#56A837", color: "#fff" }}
          >
            {submitMutation.isPending ? "Submitting…" : "Submit VRL Assessment"}
            <ChevronRight size={18} className="ml-1" />
          </Button>
        </div>

        {/* Right: Live preview */}
        <div className="space-y-4">
          {/* Veto alert */}
          {preview.vetoed.length > 0 && (
            <div className="bg-red-950 border border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-400" />
                <span className="text-sm font-semibold text-red-400">Veto Gate Active</span>
              </div>
              <p className="text-xs text-red-300 mb-2">
                The following dimensions are below the minimum threshold of 20:
              </p>
              <div className="flex flex-wrap gap-1">
                {preview.vetoed.map(code => (
                  <Badge key={code} variant="outline" className="text-xs border-red-700 text-red-400">
                    {code}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-red-400 mt-2 font-semibold">Global VRL Score = 0</p>
            </div>
          )}

          {/* Global VRL score */}
          <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5 text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Global VRL Score</div>
            <div
              className="text-6xl font-bold font-mono mb-1"
              style={{ color: preview.vetoed.length > 0 ? "#ef4444" : getBandColor(preview.globalScore) }}
            >
              {preview.globalScore}
            </div>
            <div className="text-sm font-semibold" style={{ color: preview.vetoed.length > 0 ? "#ef4444" : getBandColor(preview.globalScore) }}>
              {preview.vetoed.length > 0 ? "Vetoed — Pre-Readiness" : getBandLabel(preview.globalScore)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Base average: {preview.base.toFixed(1)}</div>
          </div>

          {/* Meta-domain breakdown */}
          <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Meta-Domain Scores</div>
            {[
              { label: "Product",        score: preview.product,        color: "#3b82f6", formula: "TRL×0.4 + MRL×0.35 + BRL×0.25" },
              { label: "Market",         score: preview.market,         color: "#22c55e", formula: sv01Active ? "BRL×0.25+PRL×0.25+MVL×0.50" : "BRL×0.25+PRL×0.25+MVL×0.50" },
              { label: "Execution",      score: preview.execution,      color: "#8b5cf6", formula: sv01Active ? "FRL×1.00 (SV-01)" : "FRL×0.6+MRL×0.4" },
              { label: "Structural",     score: preview.structural,     color: "#f59e0b", formula: "IP×0.5 + REG×0.5" },
              { label: "Sustainability", score: preview.sustainability,  color: "#10b981", formula: "ECO×0.6 + SRL×0.4" },
            ].map(({ label, score, color, formula }) => (
              <div key={label} className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-300">{label}</span>
                  <span className="text-xs font-mono font-bold" style={{ color }}>{score.toFixed(1)}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${score}%`, background: color }} />
                </div>
                <div className="text-xs text-gray-600 mt-0.5 font-mono">{formula}</div>
              </div>
            ))}
          </div>

          {/* Info panel */}
          <div className="bg-[#161b22] rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-400">Scoring Guide</span>
            </div>
            <div className="space-y-1">
              {[
                { range: "0–19",   label: "Pre-Readiness", color: "#6b7280" },
                { range: "20–39",  label: "Emerging",      color: "#f59e0b" },
                { range: "40–54",  label: "Developing",    color: "#f97316" },
                { range: "55–69",  label: "Established",   color: "#22c55e" },
                { range: "70–84",  label: "Advanced",      color: "#3b82f6" },
                { range: "85–100", label: "Exemplary",     color: "#7c3aed" },
              ].map(b => (
                <div key={b.range} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: b.color }} />
                  <span className="text-xs font-mono text-gray-500">{b.range}</span>
                  <span className="text-xs text-gray-400">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
