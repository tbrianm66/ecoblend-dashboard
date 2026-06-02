/**
 * IP Intelligence Module — UI Page
 * Sprint 71 — EcoBlend OS
 *
 * Tabs:
 *   1. New Analysis    — Input form → run Lightbringer engine → show IP Intelligence Card
 *   2. Analysis History — List of all past analyses with quick-view cards
 *   3. Portfolio IP    — IP score summary across all ventures
 *   4. VRL Feed        — IP → VRL contribution log per venture
 *   5. API Schema      — IP_OBJECT JSON schema viewer for integrations
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";

import {
  ShieldCheck, Lightbulb, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Trash2, Eye, FileJson, TrendingUp, Building2,
  Globe, Zap, ChevronRight, FlaskConical, Search,
} from "lucide-react";

// ─── Colour helpers ───────────────────────────────────────────────────────────
const BRAND = { green: "#51AF37", blue: "#3A97D3", amber: "#F49C13", red: "#EF4444", navy: "#1a2332" };

const riskColor = (v: string) =>
  v === "LOW" ? BRAND.green : v === "MED" ? BRAND.amber : BRAND.red;

const riskBg = (v: string) =>
  v === "LOW" ? "#51AF3715" : v === "MED" ? "#F49C1315" : "#EF444415";

const recColor = (v: string) =>
  v === "PROCEED" ? BRAND.green : v === "MODIFY" ? BRAND.amber : BRAND.red;

const recIcon = (v: string) => {
  if (v === "PROCEED") return <CheckCircle2 size={16} />;
  if (v === "MODIFY") return <AlertTriangle size={16} />;
  return <XCircle size={16} />;
};

// ─── Score Gauge ─────────────────────────────────────────────────────────────
function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const pct = Math.min(100, Math.max(0, score));
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="45" cy="45" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
        />
        <text x="45" y="49" textAnchor="middle" fontSize="18" fontWeight="700" fill={BRAND.navy} fontFamily="Prompt, sans-serif">
          {Math.round(score)}
        </text>
      </svg>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
function RiskBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
      <span
        className="text-sm font-bold px-3 py-1 rounded-full"
        style={{ background: riskBg(value), color: riskColor(value) }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── IP Intelligence Card ─────────────────────────────────────────────────────
type AnalysisDetail = {
  id: number;
  ideaName: string;
  industry: string;
  geography: string;
  noveltyScore: string;
  patentDensity: string;
  ftoRisk: string;
  recommendation: string;
  ipScore: string;
  status: string;
  notes?: string | null;
  createdAt: Date;
  entities: Array<{
    entityName: string;
    entityType: string;
    patentCount: number;
    relevanceScore: string;
    country?: string | null;
    threat: string;
  }>;
  whitespace: Array<{
    opportunity: string;
    category: string;
    potentialScore: string;
    actionable: boolean;
  }>;
};

function IpIntelligenceCard({ analysis, onDelete }: { analysis: AnalysisDetail; onDelete?: () => void }) {
  const rec = analysis.recommendation;
  const novelty = Number(analysis.noveltyScore);
  const ipScore = Number(analysis.ipScore);

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={18} style={{ color: BRAND.blue }} />
              <h2 className="text-lg font-bold" style={{ color: BRAND.navy, fontFamily: "'Prompt', sans-serif" }}>
                {analysis.ideaName}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Building2 size={11} />{analysis.industry}</span>
              <span className="flex items-center gap-1"><Globe size={11} />{analysis.geography}</span>
              <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg"
              style={{ background: `${recColor(rec)}15`, color: recColor(rec) }}
            >
              {recIcon(rec)}
              {rec}
            </div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} className="text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Score row */}
      <div className="px-6 py-5 grid grid-cols-4 gap-4 border-b" style={{ borderColor: "#e5e7eb" }}>
        <ScoreGauge score={novelty} label="Novelty" color={BRAND.blue} />
        <ScoreGauge score={ipScore} label="IP Score" color={BRAND.green} />
        <RiskBadge label="Patent Density" value={analysis.patentDensity} />
        <RiskBadge label="FTO Risk" value={analysis.ftoRisk} />
      </div>

      {/* Entities + Whitespace */}
      <div className="grid grid-cols-2 gap-0 divide-x" style={{ borderColor: "#e5e7eb" }}>
        {/* Top Entities */}
        <div className="px-5 py-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1">
            <Building2 size={11} /> Top Entities
          </h3>
          <div className="flex flex-col gap-2">
            {analysis.entities.slice(0, 5).map((e, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-gray-300 w-4">{i + 1}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-gray-700 truncate block">{e.entityName}</span>
                    <span className="text-xs text-gray-400">{e.country} · {e.patentCount.toLocaleString()} patents</span>
                  </div>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0"
                  style={{ background: riskBg(e.threat), color: riskColor(e.threat) }}
                >
                  {e.threat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Whitespace Opportunities */}
        <div className="px-5 py-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1">
            <Lightbulb size={11} /> White Space Opportunities
          </h3>
          <div className="flex flex-col gap-2">
            {analysis.whitespace.slice(0, 4).map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: w.actionable ? BRAND.green : "#d1d5db" }}
                />
                <div className="min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">{w.opportunity}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 capitalize">{w.category}</span>
                    <span className="text-xs font-semibold" style={{ color: BRAND.blue }}>
                      {Math.round(Number(w.potentialScore))}% potential
                    </span>
                    {w.actionable && (
                      <span className="text-xs font-semibold" style={{ color: BRAND.green }}>✓ Actionable</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VRL contribution footer */}
      <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <TrendingUp size={11} style={{ color: BRAND.green }} />
          VRL Contribution: <strong className="ml-1" style={{ color: BRAND.green }}>+{Math.round(ipScore * 0.15)}%</strong>
        </span>
        <span className="text-xs text-gray-400">
          Powered by Lightbringer Mock v1.0 · API-ready
        </span>
      </div>
    </div>
  );
}

// ─── Analysis Input Form ──────────────────────────────────────────────────────
const INDUSTRIES = [
  "Materials Science", "Clean Energy", "Sports", "Fashion", "Food & Beverage",
  "Pharmaceuticals", "Biotechnology", "Semiconductors", "Software", "Electronics",
  "Automotive", "Aerospace", "Medical Devices", "Agriculture", "Construction",
  "Chemicals", "Packaging", "Textiles", "Consumer Goods", "Industrial Equipment",
].sort();

const GEOGRAPHIES = [
  "United Kingdom", "European Union", "United States", "Global", "China",
  "Japan", "Germany", "France", "Canada", "Australia", "India",
  "South Korea", "Brazil", "Singapore", "Netherlands", "Switzerland",
].sort();

function NewAnalysisTab({ onSuccess }: { onSuccess: (id: number) => void }) {
  const [form, setForm] = useState({
    ideaName: "",
    description: "",
    keywords: "",
    industry: "Materials Science",
    geography: "United Kingdom",
    ventureId: "",
    notes: "",
  });

  const { data: ventures } = trpc.ventures.list.useQuery(undefined, { retry: false });

  const runMutation = trpc.ipIntelligence.analysis.run.useMutation({
    onSuccess: (data) => {
      toast.success(`Analysis complete — IP Score: ${data.ipScore} · ${data.recommendation}`);
      onSuccess(data.analysisId);
    },
    onError: (err) => toast.error(`Analysis failed: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ideaName.trim() || !form.description.trim() || !form.keywords.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    runMutation.mutate({
      ideaName:    form.ideaName,
      description: form.description,
      keywords:    form.keywords,
      industry:    form.industry,
      geography:   form.geography,
      ventureId:   form.ventureId || undefined,
      notes:       form.notes || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#3A97D315" }}>
            <FlaskConical size={16} style={{ color: BRAND.blue }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: BRAND.navy, fontFamily: "'Prompt', sans-serif" }}>
              New IP Intelligence Analysis
            </h2>
            <p className="text-xs text-gray-400">Powered by Lightbringer Mock Engine v1.0</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Idea Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Idea / Invention Name <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#e5e7eb", focusRingColor: BRAND.blue } as React.CSSProperties}
              placeholder="e.g. Bio-degradable racing tyre compound"
              value={form.ideaName}
              onChange={e => setForm(f => ({ ...f, ideaName: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
              style={{ borderColor: "#e5e7eb" }}
              rows={3}
              placeholder="Describe the core innovation, technology, or method..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Keywords <span className="text-red-400">*</span>
              <span className="font-normal text-gray-400 ml-1">(comma-separated)</span>
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: "#e5e7eb" }}
              placeholder="e.g. natural rubber, silica, bio-compound, circular economy"
              value={form.keywords}
              onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
              required
            />
          </div>

          {/* Industry + Geography */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Industry</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                style={{ borderColor: "#e5e7eb" }}
                value={form.industry}
                onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Geography</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                style={{ borderColor: "#e5e7eb" }}
                value={form.geography}
                onChange={e => setForm(f => ({ ...f, geography: e.target.value }))}
              >
                {GEOGRAPHIES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Venture Link (optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Link to Venture <span className="font-normal text-gray-400">(optional — feeds IP score to VRL)</span>
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
              style={{ borderColor: "#e5e7eb" }}
              value={form.ventureId}
              onChange={e => setForm(f => ({ ...f, ventureId: e.target.value }))}
            >
              <option value="">— No venture link —</option>
              {(ventures ?? []).map((v: { id: string; name: string }) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Notes <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: "#e5e7eb" }}
              placeholder="Any context or strategic notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <Button
            type="submit"
            disabled={runMutation.isPending}
            className="w-full gap-2 font-semibold"
            style={{ background: BRAND.blue, color: "white" }}
          >
            {runMutation.isPending ? (
              <><RefreshCw size={14} className="animate-spin" /> Analysing...</>
            ) : (
              <><Search size={14} /> Run IP Intelligence Analysis</>
            )}
          </Button>
        </form>
      </div>

      {/* API Integration note */}
      <div className="mt-4 rounded-xl border px-4 py-3 flex items-start gap-3" style={{ borderColor: "#3A97D330", background: "#3A97D308" }}>
        <Zap size={14} style={{ color: BRAND.blue, marginTop: 2 }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: BRAND.blue }}>API-Ready Architecture</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Currently using the Lightbringer Mock Engine. To enable live analysis, replace <code className="bg-gray-100 px-1 rounded text-xs">runLightbringerMock()</code> in <code className="bg-gray-100 px-1 rounded text-xs">ipIntelligence.router.ts</code> with a real HTTP call to the Lightbringer API. The IP_OBJECT schema is fully compatible.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({ onView }: { onView: (id: number) => void }) {
  const { data: analyses, refetch } = trpc.ipIntelligence.analysis.list.useQuery(undefined, { retry: false });
  const deleteMutation = trpc.ipIntelligence.analysis.delete.useMutation({
    onSuccess: () => { toast.success("Analysis deleted"); refetch(); },
  });

  if (!analyses?.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-semibold">No analyses yet</p>
        <p className="text-xs mt-1">Run your first IP Intelligence analysis to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {analyses.map(a => (
        <div
          key={a.id}
          className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: `${recColor(a.recommendation)}15`, color: recColor(a.recommendation) }}
            >
              {Math.round(Number(a.ipScore))}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: BRAND.navy }}>{a.ideaName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{a.industry}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">{a.geography}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: riskBg(a.ftoRisk), color: riskColor(a.ftoRisk) }}>
                FTO: {a.ftoRisk}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: riskBg(a.patentDensity), color: riskColor(a.patentDensity) }}>
                Density: {a.patentDensity}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${recColor(a.recommendation)}15`, color: recColor(a.recommendation) }}>
                {a.recommendation}
              </span>
            </div>
            <button
              onClick={() => onView(a.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
            >
              <Eye size={14} style={{ color: BRAND.blue }} />
            </button>
            <button
              onClick={() => deleteMutation.mutate({ id: a.id })}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Portfolio IP Tab ─────────────────────────────────────────────────────────
function PortfolioIpTab() {
  const { data: summary } = trpc.ipIntelligence.vrlFeed.portfolioSummary.useQuery(undefined, { retry: false });

  if (!summary?.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-semibold">No portfolio IP data yet</p>
        <p className="text-xs mt-1">Link analyses to ventures to see portfolio-level IP intelligence</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-4 mb-2">
        <div className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-2xl font-bold" style={{ color: BRAND.blue, fontFamily: "'Prompt', sans-serif" }}>
            {summary.filter(v => v.ipScore !== null).length}
          </div>
          <div className="text-xs text-gray-400 mt-1">Ventures Analysed</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-2xl font-bold" style={{ color: BRAND.green, fontFamily: "'Prompt', sans-serif" }}>
            {summary.reduce((s, v) => s + v.analysisCount, 0)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Total Analyses</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-2xl font-bold" style={{ color: BRAND.amber, fontFamily: "'Prompt', sans-serif" }}>
            {summary.filter(v => v.ipScore !== null).length > 0
              ? Math.round(summary.filter(v => v.ipScore !== null).reduce((s, v) => s + (v.ipScore ?? 0), 0) / summary.filter(v => v.ipScore !== null).length)
              : "—"}
          </div>
          <div className="text-xs text-gray-400 mt-1">Avg IP Score</div>
        </div>
      </div>

      {summary.map(v => (
        <div key={v.ventureId} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${v.ventureColor ?? BRAND.blue}` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold" style={{ color: BRAND.navy }}>{v.ventureName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {v.analysisCount} {v.analysisCount === 1 ? "analysis" : "analyses"}
                {v.lastAnalysedAt && ` · Last: ${new Date(v.lastAnalysedAt).toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {v.ipScore !== null ? (
                <>
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: BRAND.blue, fontFamily: "'Prompt', sans-serif" }}>
                      {Math.round(v.ipScore)}
                    </div>
                    <div className="text-xs text-gray-400">IP Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: BRAND.green, fontFamily: "'Prompt', sans-serif" }}>
                      +{Math.round(v.vrlContribution)}%
                    </div>
                    <div className="text-xs text-gray-400">VRL Contribution</div>
                  </div>
                </>
              ) : (
                <span className="text-xs text-gray-400 italic">No analysis yet</span>
              )}
            </div>
          </div>
          {v.ipScore !== null && (
            <div className="mt-3">
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${v.ipScore}%`, background: `linear-gradient(90deg, ${BRAND.blue}, ${BRAND.green})` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── JSON Schema Tab ──────────────────────────────────────────────────────────
function SchemaTab() {
  const { data: schema } = trpc.ipIntelligence.lightbringer.getSchema.useQuery(undefined, { retry: false });
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl border p-4 flex items-start justify-between" style={{ borderColor: "#e5e7eb" }}>
        <div>
          <h3 className="text-sm font-bold" style={{ color: BRAND.navy }}>IP_OBJECT JSON Schema v1.0</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Canonical schema for EcoBlend OS IP Intelligence objects. Lightbringer-compatible.
            Use this schema to integrate with external IP databases or build custom connectors.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="gap-1.5 text-xs shrink-0"
          style={{ borderColor: BRAND.blue, color: BRAND.blue }}
        >
          <FileJson size={12} />
          {copied ? "Copied!" : "Copy Schema"}
        </Button>
      </div>

      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono">ip_object.schema.json</span>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-60" />
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-60" />
          </div>
        </div>
        <pre className="text-xs text-green-400 p-4 overflow-auto max-h-96 font-mono leading-relaxed">
          {JSON.stringify(schema, null, 2)}
        </pre>
      </div>

      {/* API provider roadmap */}
      <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">API Integration Roadmap</h3>
        <div className="flex flex-col gap-2">
          {[
            { id: "lightbringer_mock", label: "Lightbringer Mock Engine v1.0", status: "active", note: "Deterministic scoring — production-ready for MVP" },
            { id: "lightbringer_live", label: "Lightbringer Live API", status: "coming_soon", note: "Drop-in replacement — swap runLightbringerMock() in router" },
            { id: "lens_api", label: "Lens.org Patent API", status: "coming_soon", note: "Free open patent database — 100M+ records" },
            { id: "epo_ops", label: "EPO Open Patent Services", status: "coming_soon", note: "European Patent Office — official patent data" },
          ].map(p => (
            <div key={p.id} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: "#f3f4f6" }}>
              <div
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ background: p.status === "active" ? BRAND.green : "#d1d5db" }}
              />
              <div>
                <p className="text-xs font-semibold text-gray-700">{p.label}</p>
                <p className="text-xs text-gray-400">{p.note}</p>
              </div>
              <Badge
                variant="outline"
                className="ml-auto shrink-0 text-xs"
                style={p.status === "active" ? { borderColor: BRAND.green, color: BRAND.green } : {}}
              >
                {p.status === "active" ? "Active" : "Coming Soon"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "new",       label: "New Analysis",    icon: <Search size={14} /> },
  { id: "history",   label: "Analysis History", icon: <ShieldCheck size={14} /> },
  { id: "portfolio", label: "Portfolio IP",     icon: <TrendingUp size={14} /> },
  { id: "schema",    label: "API Schema",       icon: <FileJson size={14} /> },
];

export default function IpIntelligence() {
  const [activeTab, setActiveTab] = useState("new");
  const [viewingId, setViewingId] = useState<number | null>(null);

  const { data: viewingAnalysis, isLoading: viewLoading } = trpc.ipIntelligence.analysis.get.useQuery(
    { id: viewingId! },
    { enabled: viewingId !== null, retry: false }
  );

  const deleteMutation = trpc.ipIntelligence.analysis.delete.useMutation({
    onSuccess: () => { toast.success("Analysis deleted"); setViewingId(null); },
  });

  const handleNewSuccess = (id: number) => {
    setViewingId(id);
    setActiveTab("history");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3A97D315", color: BRAND.blue }}>
                IP Intelligence
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">Lightbringer Engine v1.0</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              IP Intelligence Module
            </h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
            <p className="text-sm text-gray-500 max-w-xl mt-0.5">
              Novelty scoring, patent density analysis, FTO risk assessment, and white space opportunity mapping — integrated into VRL calculation.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id !== "history") setViewingId(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={activeTab === tab.id
                ? { background: BRAND.blue, color: "white" }
                : { color: "#6b7280" }
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Detail view overlay */}
        {viewingId !== null && activeTab === "history" && (
          <div className="mb-6">
            <button
              onClick={() => setViewingId(null)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4 transition-colors"
            >
              ← Back to history
            </button>
            {viewLoading ? (
              <div className="text-center py-8 text-gray-400">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading analysis...</p>
              </div>
            ) : viewingAnalysis ? (
              <IpIntelligenceCard
                analysis={viewingAnalysis as unknown as AnalysisDetail}
                onDelete={() => deleteMutation.mutate({ id: viewingId })}
              />
            ) : null}
          </div>
        )}

        {/* Tab content */}
        {!(viewingId !== null && activeTab === "history") && (
          <>
            {activeTab === "new"       && <NewAnalysisTab onSuccess={handleNewSuccess} />}
            {activeTab === "history"   && <HistoryTab onView={id => setViewingId(id)} />}
            {activeTab === "portfolio" && <PortfolioIpTab />}
            {activeTab === "schema"    && <SchemaTab />}
          </>
        )}
      </div>
    </div>
  );
}
