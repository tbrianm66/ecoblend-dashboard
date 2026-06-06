// ============================================================
// ECOBLEND — Brand Readiness Module
// DB-backed: trpc.marketingBrand.brandReadiness.*
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { CheckCircle2, Circle, Edit2, Save, X, Briefcase, ArrowRight, Rocket } from "lucide-react";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";


interface BrandDimension {
  key: string;
  label: string;
  description: string;
  b2bWeight: number;  // weight for B2B ventures
  d2cWeight: number;  // weight for D2C ventures
}

const DIMENSIONS: BrandDimension[] = [
  { key: "identity", label: "Visual Identity", description: "Logo, colour palette, typography, and design system consistency.", b2bWeight: 0.15, d2cWeight: 0.20 },
  { key: "messaging", label: "Brand Messaging", description: "Clear value proposition, tone of voice, and sustainability narrative.", b2bWeight: 0.20, d2cWeight: 0.20 },
  { key: "digital", label: "Digital Presence", description: "Website, SEO, social media, and digital content quality.", b2bWeight: 0.10, d2cWeight: 0.25 },
  { key: "oem", label: "OEM / Trade Readiness", description: "Technical datasheets, case studies, and partner-facing materials.", b2bWeight: 0.30, d2cWeight: 0.05 },
  { key: "consumer", label: "Consumer Readiness", description: "D2C packaging, product storytelling, and retail-ready materials.", b2bWeight: 0.05, d2cWeight: 0.20 },
  { key: "sustainability", label: "Sustainability Story", description: "Environmental credentials, B Corp alignment, and impact reporting.", b2bWeight: 0.20, d2cWeight: 0.10 },
];

interface VentureBrand {
  id: string;
  name: string;
  color: string;
  model: "B2B" | "D2C";
  vrlStage: number;
  scores: Record<string, number>;
  checklist: { label: string; completed: boolean }[];
}

const INITIAL_BRANDS: VentureBrand[] = [
  {
    id: "ecoblend",
    name: "EcoRace",
    color: "#22c55e",
    model: "B2B",
    vrlStage: 2,
    scores: { identity: 85, messaging: 90, digital: 60, oem: 88, consumer: 20, sustainability: 95 },
    checklist: [
      { label: "Brand guidelines document created", completed: true },
      { label: "Logo and colour system finalised", completed: true },
      { label: "Technical datasheet template produced", completed: true },
      { label: "Website live with sustainability narrative", completed: false },
      { label: "B Corp certification in progress", completed: false },
      { label: "Partner-facing pitch deck completed", completed: true },
    ],
  },
  {
    id: "bebus",
    name: "BEBUS",
    color: "#1d4ed8",
    model: "B2B",
    vrlStage: 2,
    scores: { identity: 72, messaging: 65, digital: 50, oem: 80, consumer: 15, sustainability: 88 },
    checklist: [
      { label: "Brand name and identity registered", completed: true },
      { label: "OEM pitch deck and technical materials", completed: true },
      { label: "Trade show presence planned", completed: false },
      { label: "Website with OEM case studies", completed: false },
      { label: "Sustainability credentials documented", completed: true },
      { label: "LinkedIn company page active", completed: false },
    ],
  },
  {
    id: "tone",
    name: "TONE",
    color: "#7c3aed",
    model: "D2C",
    vrlStage: 1,
    scores: { identity: 90, messaging: 85, digital: 75, oem: 10, consumer: 80, sustainability: 70 },
    checklist: [
      { label: "Brand identity and packaging designed", completed: true },
      { label: "D2C e-commerce store launched", completed: false },
      { label: "Social media channels active", completed: true },
      { label: "Product photography completed", completed: false },
      { label: "Consumer sustainability story published", completed: true },
      { label: "Influencer partnership programme started", completed: false },
    ],
  },
  {
    id: "real",
    name: "REAL",
    color: "#f59e0b",
    model: "D2C",
    vrlStage: 2,
    scores: { identity: 80, messaging: 75, digital: 68, oem: 12, consumer: 72, sustainability: 82 },
    checklist: [
      { label: "Brand identity and packaging designed", completed: true },
      { label: "D2C e-commerce store launched", completed: true },
      { label: "Social media channels active", completed: true },
      { label: "Athlete ambassador programme", completed: false },
      { label: "Consumer sustainability story published", completed: false },
      { label: "Retail buyer pitch deck completed", completed: false },
    ],
  },
];

function weightedScore(scores: Record<string, number>, model: "B2B" | "D2C") {
  return Math.round(
    DIMENSIONS.reduce((acc, d) => {
      const weight = model === "B2B" ? d.b2bWeight : d.d2cWeight;
      return acc + (scores[d.key] ?? 0) * weight;
    }, 0)
  );
}

function BrlBadge({ stage }: { stage: number }) {
  const labels = ["", "Fundamentals", "Kickoff", "Go-to-Market", "Scaling"];
  const colors = ["", "#9ca3af", "#f59e0b", "#1d4ed8", "#22c55e"];
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${colors[stage]}15`, color: colors[stage] }}>
      VRL {stage} — {labels[stage]}
    </span>
  );
}

export default function BrandReadiness() {
  const [brands, setBrands] = useState<VentureBrand[]>(INITIAL_BRANDS);
  const [selected, setSelected] = useState<string>("ecoblend");
  const [editingScore, setEditingScore] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const utils = trpc.useUtils();

  // DB-backed score upsert (persists on save)
  const upsertScore = trpc.marketingBrand.brandReadiness.upsertScore.useMutation({
    onSuccess: () => utils.marketingBrand.brandReadiness.getScores.invalidate({ ventureId: selected }),
    onError: (e) => toast.error(e.message),
  });

  // DB-backed checklist toggle (persists immediately)
  const toggleItem = trpc.marketingBrand.brandReadiness.toggleChecklistItem.useMutation({
    onError: (e) => toast.error(e.message),
  });

  // Load DB scores for selected venture (merge with local state for display)
  const { data: dbScores = [] } = trpc.marketingBrand.brandReadiness.getScores.useQuery({ ventureId: selected });
  const { data: dbChecklist = [] } = trpc.marketingBrand.brandReadiness.getChecklist.useQuery({ ventureId: selected });

  const brand = brands.find(b => b.id === selected)!;

  // Merge DB scores into local state for display (DB takes precedence when available)
  const mergedScores = useMemo(() => {
    const merged = { ...brand.scores };
    for (const s of dbScores) {
      const dim = DIMENSIONS.find(d => d.label === s.dimension);
      if (dim) merged[dim.key] = s.score ?? merged[dim.key];
    }
    return merged;
  }, [brand.scores, dbScores]);

  // Merge DB checklist into local state for display
  const mergedChecklist = useMemo(() => {
    if (dbChecklist.length === 0) return brand.checklist;
    return brand.checklist.map((item, i) => {
      const dbItem = dbChecklist.find(d => d.item === item.label);
      return dbItem ? { ...item, completed: dbItem.completed === 1 } : item;
    });
  }, [brand.checklist, dbChecklist]);

  const overall = weightedScore(mergedScores, brand.model);

  const radarData = DIMENSIONS.map(d => ({
    subject: d.label,
    score: mergedScores[d.key] ?? 0,
    fullMark: 100,
  }));

  const allBrandsBar = brands.map(b => ({
    name: b.name,
    Score: weightedScore(b.id === selected ? mergedScores : b.scores, b.model),
    color: b.color,
  }));

  const handleToggleChecklist = (brandId: string, index: number) => {
    setBrands(prev => prev.map(b => {
      if (b.id !== brandId) return b;
      const checklist = b.checklist.map((item, i) => i === index ? { ...item, completed: !item.completed } : item);
      return { ...b, checklist };
    }));
    // Persist to DB: find or create the checklist item
    const item = brand.checklist[index];
    const dbItem = dbChecklist.find(d => d.item === item.label);
    if (dbItem) {
      toggleItem.mutate({ id: dbItem.id, completed: !item.completed });
    } else {
      // Create new DB item then toggle it
      utils.client.marketingBrand.brandReadiness.upsertChecklistItem.mutate({
        ventureId: brandId,
        category: "General",
        item: item.label,
        completed: !item.completed,
      }).then(() => utils.marketingBrand.brandReadiness.getChecklist.invalidate({ ventureId: brandId })).catch(() => {});
    }
    toast.success("Brand readiness checklist updated");
  };

  const handleStartEdit = (key: string, current: number) => {
    setEditingScore(key);
    setEditValue(current);
  };

  const handleSaveEdit = (brandId: string, key: string) => {
    const clamped = Math.max(0, Math.min(100, editValue));
    setBrands(prev => prev.map(b => {
      if (b.id !== brandId) return b;
      return { ...b, scores: { ...b.scores, [key]: clamped } };
    }));
    // Persist to DB
    const dim = DIMENSIONS.find(d => d.key === key);
    if (dim) {
      const existing = dbScores.find(s => s.dimension === dim.label);
      upsertScore.mutate({ id: existing?.id, ventureId: brandId, dimension: dim.label, score: clamped });
    }
    setEditingScore(null);
    toast.success("Brand score updated");
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return { label: "Brand Ready", color: "#22c55e" };
    if (score >= 60) return { label: "Developing", color: "#f59e0b" };
    if (score >= 40) return { label: "Early Stage", color: "#1d4ed8" };
    return { label: "Pre-Brand", color: "#9ca3af" };
  };

  const readiness = getReadinessLabel(overall);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#7c3aed15", color: "#7c3aed" }}>
            Brand
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">Brand Readiness Level (BRL)</span>
        </div>
        <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Brand Readiness
        </h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
        <p className="text-sm text-gray-500 max-w-xl">
          Multi-dimension brand maturity scoring across visual identity, messaging, digital presence, OEM readiness, consumer readiness, and sustainability story. Scores are weighted differently for B2B and D2C ventures.
        </p>
      </div>

      <div className="p-8 space-y-8">

        {/* Portfolio overview bar */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Portfolio Brand Readiness Scores</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={allBrandsBar} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, "Brand Readiness Score"]} />
              <Bar dataKey="Score" radius={[6, 6, 0, 0]}>
                {allBrandsBar.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {brands.map(b => {
              const s = weightedScore(b.scores, b.model);
              const r = getReadinessLabel(s);
              return (
                <button
                  key={b.id}
                  onClick={() => setSelected(b.id)}
                  className="rounded-lg p-3 text-center transition-all border"
                  style={{
                    background: selected === b.id ? `${b.color}10` : "#f9fafb",
                    borderColor: selected === b.id ? b.color : "#e5e7eb",
                  }}
                >
                  <div className="text-2xl font-bold font-mono" style={{ color: b.color }}>{s}%</div>
                  <div className="text-xs font-semibold text-gray-700 mt-0.5">{b.name}</div>
                  <div className="text-xs mt-1" style={{ color: r.color }}>{r.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Venture detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar */}
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{brand.name} — Brand Radar</h2>
              <BrlBadge stage={brand.vrlStage} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">{brand.model}</span>
              <span className="text-xs text-gray-400">Weighted score:</span>
              <span className="text-sm font-bold font-mono" style={{ color: brand.color }}>{overall}%</span>
              <span className="text-xs font-semibold" style={{ color: readiness.color }}>— {readiness.label}</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <Radar name={brand.name} dataKey="score" stroke={brand.color} fill={brand.color} fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Dimension scores editable */}
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Dimension Scores</h2>
            <div className="space-y-3">
              {DIMENSIONS.map(d => {
                const score = brand.scores[d.key] ?? 0;
                const weight = brand.model === "B2B" ? d.b2bWeight : d.d2cWeight;
                const isEditing = editingScore === d.key;
                return (
                  <div key={d.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-700">{d.label}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{(weight * 100).toFixed(0)}% weight</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={editValue}
                              onChange={e => setEditValue(Number(e.target.value))}
                              className="w-14 text-xs border rounded px-1.5 py-0.5 font-mono text-center"
                              style={{ borderColor: brand.color }}
                              autoFocus
                            />
                            <button onClick={() => handleSaveEdit(brand.id, d.key)} className="text-green-500 hover:text-green-700"><Save size={12} /></button>
                            <button onClick={() => setEditingScore(null)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-bold font-mono" style={{ color: brand.color }}>{score}%</span>
                            <button onClick={() => handleStartEdit(d.key, score)} className="text-gray-300 hover:text-gray-500 transition-colors"><Edit2 size={11} /></button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: brand.color }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{d.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Brand readiness checklist */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {brand.name} — Brand Readiness Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {brand.checklist.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 cursor-pointer group rounded-lg px-3 py-2 transition-colors hover:bg-gray-50"
                onClick={() => handleToggleChecklist(brand.id, i)}
              >
                <span style={{ color: item.completed ? brand.color : "#d1d5db" }} className="flex-shrink-0">
                  {item.completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                </span>
                <span className="text-sm" style={{ color: item.completed ? "#9ca3af" : "#374151", textDecoration: item.completed ? "line-through" : "none" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "#f3f4f6" }}>
            <span className="text-xs text-gray-400">
              {brand.checklist.filter(i => i.completed).length}/{brand.checklist.length} items completed
            </span>
            <div className="w-32 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(brand.checklist.filter(i => i.completed).length / brand.checklist.length) * 100}%`, background: brand.color }}
              />
            </div>
          </div>
        </div>

        {/* Weighting explanation */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>Brand Readiness Scoring Methodology</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th className="text-left py-2 px-3 font-bold uppercase tracking-widest text-gray-400">Dimension</th>
                  <th className="text-center py-2 px-3 font-bold uppercase tracking-widest text-gray-400">B2B Weight</th>
                  <th className="text-center py-2 px-3 font-bold uppercase tracking-widest text-gray-400">D2C Weight</th>
                  <th className="text-left py-2 px-3 font-bold uppercase tracking-widest text-gray-400">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {DIMENSIONS.map(d => (
                  <tr key={d.key} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td className="py-2 px-3 font-semibold text-gray-700">{d.label}</td>
                    <td className="py-2 px-3 text-center font-mono" style={{ color: "#1d4ed8" }}>{(d.b2bWeight * 100).toFixed(0)}%</td>
                    <td className="py-2 px-3 text-center font-mono" style={{ color: "#7c3aed" }}>{(d.d2cWeight * 100).toFixed(0)}%</td>
                    <td className="py-2 px-3 text-gray-500">{d.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── BRL Link Panel ── */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb", borderTop: "3px solid #8B5CF6" }}>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase size={16} style={{ color: "#8B5CF6" }} />
            <h2 className="font-bold text-gray-900">Business Readiness Level (BRL)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#8B5CF620", color: "#8B5CF6" }}>100 Tasks</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Brand Readiness is one dimension of the full Business Readiness Level framework. The BRL 100-task register covers all four VRL stages — from legal entity formation to go-to-market execution. Tasks 76–100 (Go-to-Market and Scaling) are managed in the Brand Execution Platform.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg p-4 border" style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Stages 1–2</div>
              <div className="text-sm font-semibold text-gray-700">Fundamentals</div>
              <div className="text-xs text-gray-500 mt-1">Tasks 1–50 · Managed here</div>
            </div>
            <div className="rounded-lg p-4 border" style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Stage 3</div>
              <div className="text-sm font-semibold text-gray-700">Kick-off</div>
              <div className="text-xs text-gray-500 mt-1">Tasks 51–75 · Managed here</div>
            </div>
            <div className="rounded-lg p-4 border" style={{ borderColor: "#8B5CF620", background: "#8B5CF605" }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#8B5CF6" }}>Stage 4</div>
              <div className="text-sm font-semibold" style={{ color: "#8B5CF6" }}>Execution Platform</div>
              <div className="text-xs mt-1" style={{ color: "#8B5CF6" }}>Tasks 76–100 · Brand platform</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/brl"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ background: "#8B5CF6", color: "white" }}
            >
              <Briefcase size={14} /> Open BRL Analytics <ArrowRight size={14} />
            </a>
            <div className="flex items-center gap-1.5 text-sm text-gray-400 px-4 py-2 rounded-lg border cursor-default" style={{ borderColor: "#e5e7eb" }}>
              <Rocket size={14} style={{ color: "#8B5CF6" }} />
              Brand Execution Platform — coming soon
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
