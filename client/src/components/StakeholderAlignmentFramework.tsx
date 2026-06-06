// ============================================================
// STAKEHOLDER ALIGNMENT FRAMEWORK
// Phase 5D — Mission Protection Framework
// Stakeholder mapping, scoring, and engagement tracking
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Users, Plus, Loader2, CheckCircle2, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Target, ChevronRight
} from "lucide-react";

const DEFAULT_VENTURE_ID = "bebus"; // BEBUS as default venture

const INFLUENCE_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: "High Influence", color: "#dc2626" },
  medium: { label: "Medium Influence", color: "#d97706" },
  low: { label: "Low Influence", color: "#6b7280" },
};

const ALIGNMENT_LABELS: Record<string, { label: string; color: string }> = {
  aligned: { label: "Aligned", color: "#16a34a" },
  neutral: { label: "Neutral", color: "#6b7280" },
  misaligned: { label: "Misaligned", color: "#dc2626" },
};

const ENGAGEMENT_LABELS: Record<string, { label: string; color: string }> = {
  advocate: { label: "Advocate", color: "#059669" },
  supporter: { label: "Supporter", color: "#16a34a" },
  neutral: { label: "Neutral", color: "#6b7280" },
  skeptic: { label: "Skeptic", color: "#d97706" },
  opponent: { label: "Opponent", color: "#dc2626" },
};

interface StakeholderFormData {
  name: string;
  category: string;
  influenceLevel: "high" | "medium" | "low";
  missionAlignment: "aligned" | "neutral" | "misaligned";
  engagementLevel: "advocate" | "supporter" | "neutral" | "skeptic" | "opponent";
  interests: string;
  concerns: string;
  engagementStrategy: string;
}

const EMPTY_STAKEHOLDER: StakeholderFormData = {
  name: "",
  category: "investor",
  influenceLevel: "medium",
  missionAlignment: "neutral",
  engagementLevel: "neutral",
  interests: "",
  concerns: "",
  engagementStrategy: "",
};

const CATEGORIES = [
  "investor", "board_member", "employee", "customer", "community",
  "regulator", "partner", "supplier", "media", "ngo",
];

export default function StakeholderAlignmentFramework() {
  const [selectedVenture, setSelectedVenture] = useState(DEFAULT_VENTURE_ID);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StakeholderFormData>(EMPTY_STAKEHOLDER);
  const [activeView, setActiveView] = useState<"map" | "list" | "framework">("map");

  const { data: stakeholders, isLoading, refetch } = trpc.stakeholderAlignment.list.useQuery({ ventureId: selectedVenture });
  const { data: framework } = trpc.stakeholderAlignment.getFramework.useQuery();

  const upsertMutation = trpc.stakeholderAlignment.upsert.useMutation({
    onSuccess: () => {
      toast.success(editingId ? "Stakeholder updated" : "Stakeholder added");
      setShowAddForm(false);
      setEditingId(null);
      setFormData(EMPTY_STAKEHOLDER);
      refetch();
    },
    onError: () => toast.error("Failed to save stakeholder"),
  });

  const deleteMutation = trpc.stakeholderAlignment.delete.useMutation({
    onSuccess: () => {
      toast.success("Stakeholder removed");
      refetch();
    },
    onError: () => toast.error("Failed to remove stakeholder"),
  });

  const handleSubmit = () => {
    upsertMutation.mutate({
      id: editingId || undefined,
      ventureId: selectedVenture,
      ...formData,
    });
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setFormData({
      name: s.name,
      category: s.category,
      influenceLevel: s.influenceLevel,
      missionAlignment: s.missionAlignment,
      engagementLevel: s.engagementLevel,
      interests: s.interests || "",
      concerns: s.concerns || "",
      engagementStrategy: s.engagementStrategy || "",
    });
    setShowAddForm(true);
  };

  // Compute alignment stats
  const stats = stakeholders ? {
    total: stakeholders.length,
    aligned: stakeholders.filter((s: any) => s.missionAlignment === "aligned").length,
    misaligned: stakeholders.filter((s: any) => s.missionAlignment === "misaligned").length,
    highInfluence: stakeholders.filter((s: any) => s.influenceLevel === "high").length,
    advocates: stakeholders.filter((s: any) => s.engagementLevel === "advocate").length,
    opponents: stakeholders.filter((s: any) => s.engagementLevel === "opponent").length,
  } : null;

  const alignmentScore = stats && stats.total > 0
    ? Math.round(((stats.aligned * 2 + (stats.total - stats.aligned - stats.misaligned)) / (stats.total * 2)) * 100)
    : 0;

  // Load live ventures from database
  const { data: ventureList } = trpc.ventures.list.useQuery();
  const VENTURES = (ventureList || []).filter((v: any) => !v.isInternalLab).map((v: any) => ({
    id: v.id,
    name: v.name,
    color: v.color || "#51AF37",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} style={{ color: "#7c3aed" }} />
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Stakeholder Alignment Framework
              </h2>
            </div>
            <p className="text-xs text-gray-500 max-w-xl">
              Map, score, and track stakeholder alignment with your mission. Identify high-influence misaligned stakeholders before they become a threat.
            </p>
          </div>
          {stats && (
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">Alignment Score</div>
              <div className="text-2xl font-bold font-mono" style={{ color: alignmentScore >= 70 ? "#16a34a" : alignmentScore >= 40 ? "#d97706" : "#dc2626" }}>
                {alignmentScore}%
              </div>
            </div>
          )}
        </div>

        {/* Venture selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Venture:</span>
            <div className="flex gap-1">
              {VENTURES.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVenture(v.id)}
                  className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: selectedVenture === v.id ? `${v.color}15` : "transparent",
                    color: selectedVenture === v.id ? v.color : "#6b7280",
                    border: `1px solid ${selectedVenture === v.id ? v.color : "#e5e7eb"}`,
                  }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          <Button
            size="sm"
            className="gap-2 text-xs"
            style={{ background: "#7c3aed" }}
            onClick={() => { setShowAddForm(true); setEditingId(null); setFormData(EMPTY_STAKEHOLDER); }}
          >
            <Plus size={12} /> Add Stakeholder
          </Button>
        </div>
      </div>

      {/* Stats row */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Stakeholders", value: stats.total, sub: `${stats.highInfluence} high influence`, color: "#7c3aed" },
            { label: "Mission Aligned", value: `${stats.aligned}/${stats.total}`, sub: `${stats.misaligned} misaligned`, color: "#16a34a" },
            { label: "Advocates", value: stats.advocates, sub: `${stats.opponents} opponents`, color: "#0891b2" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
              <div className="text-[10px] text-gray-400">{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* View tabs */}
      <div className="flex gap-1">
        {[
          { key: "map", label: "Stakeholder Map" },
          { key: "list", label: "Stakeholder List" },
          { key: "framework", label: "Alignment Framework" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveView(key as any)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeView === key ? "white" : "transparent",
              color: activeView === key ? "#1a2332" : "#6b7280",
              boxShadow: activeView === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-semibold text-gray-900 mb-4">{editingId ? "Edit Stakeholder" : "Add Stakeholder"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Name</label>
              <input
                type="text" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Stakeholder name or organisation"
                className="w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-purple-400"
                style={{ borderColor: "#e5e7eb" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs border rounded-lg p-2"
                style={{ borderColor: "#e5e7eb" }}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Influence Level</label>
              <select
                value={formData.influenceLevel}
                onChange={(e) => setFormData({ ...formData, influenceLevel: e.target.value as any })}
                className="w-full text-xs border rounded-lg p-2"
                style={{ borderColor: "#e5e7eb" }}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Mission Alignment</label>
              <select
                value={formData.missionAlignment}
                onChange={(e) => setFormData({ ...formData, missionAlignment: e.target.value as any })}
                className="w-full text-xs border rounded-lg p-2"
                style={{ borderColor: "#e5e7eb" }}
              >
                <option value="aligned">Aligned</option>
                <option value="neutral">Neutral</option>
                <option value="misaligned">Misaligned</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Engagement Level</label>
              <select
                value={formData.engagementLevel}
                onChange={(e) => setFormData({ ...formData, engagementLevel: e.target.value as any })}
                className="w-full text-xs border rounded-lg p-2"
                style={{ borderColor: "#e5e7eb" }}
              >
                <option value="advocate">Advocate</option>
                <option value="supporter">Supporter</option>
                <option value="neutral">Neutral</option>
                <option value="skeptic">Skeptic</option>
                <option value="opponent">Opponent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Interests</label>
              <input
                type="text" value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                placeholder="What do they care about?"
                className="w-full text-xs border rounded-lg p-2"
                style={{ borderColor: "#e5e7eb" }}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-700 block mb-1">Concerns</label>
              <input
                type="text" value={formData.concerns}
                onChange={(e) => setFormData({ ...formData, concerns: e.target.value })}
                placeholder="What are their concerns or objections?"
                className="w-full text-xs border rounded-lg p-2"
                style={{ borderColor: "#e5e7eb" }}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-700 block mb-1">Engagement Strategy</label>
              <textarea
                value={formData.engagementStrategy}
                onChange={(e) => setFormData({ ...formData, engagementStrategy: e.target.value })}
                placeholder="How will you engage this stakeholder to maintain or improve alignment?"
                className="w-full text-xs border rounded-lg p-2 resize-none"
                style={{ borderColor: "#e5e7eb" }}
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm" className="gap-2" style={{ background: "#7c3aed" }}
              onClick={handleSubmit} disabled={upsertMutation.isPending || !formData.name}
            >
              {upsertMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              {editingId ? "Update" : "Add"} Stakeholder
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowAddForm(false); setEditingId(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Stakeholder Map View */}
      {activeView === "map" && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-semibold text-gray-900 mb-4">Influence vs. Alignment Matrix</h3>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 h-40 justify-center">
              <Loader2 size={14} className="animate-spin" /> Loading stakeholders...
            </div>
          ) : !stakeholders || stakeholders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Users size={24} className="mb-2" />
              <p className="text-sm">No stakeholders mapped yet</p>
              <p className="text-xs mt-1">Add your first stakeholder to begin mapping</p>
            </div>
          ) : (
            <div className="relative border rounded-xl overflow-hidden" style={{ borderColor: "#e5e7eb", height: "320px" }}>
              {/* Quadrant labels */}
              <div className="absolute top-2 left-2 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">High Influence / Misaligned — CRITICAL</div>
              <div className="absolute top-2 right-2 text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">High Influence / Aligned — CHAMPIONS</div>
              <div className="absolute bottom-2 left-2 text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded">Low Influence / Misaligned — MONITOR</div>
              <div className="absolute bottom-2 right-2 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Low Influence / Aligned — SUPPORTERS</div>

              {/* Axes */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200" />

              {/* Stakeholder dots */}
              {stakeholders.map((s: any) => {
                const x = s.missionAlignment === "aligned" ? 65 + Math.random() * 25
                  : s.missionAlignment === "misaligned" ? 10 + Math.random() * 25
                  : 40 + Math.random() * 20;
                const y = s.influenceLevel === "high" ? 10 + Math.random() * 30
                  : s.influenceLevel === "low" ? 60 + Math.random() * 30
                  : 35 + Math.random() * 20;
                const color = ALIGNMENT_LABELS[s.missionAlignment]?.color || "#6b7280";
                return (
                  <div
                    key={s.id}
                    className="absolute flex items-center justify-center cursor-pointer group"
                    style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                    title={`${s.name} — ${s.missionAlignment} / ${s.influenceLevel} influence`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                      style={{ background: color }}
                    >
                      {s.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {s.name} ({s.category})
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stakeholder List View */}
      {activeView === "list" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between" style={{ borderColor: "#f3f4f6" }}>
            <span className="text-xs font-semibold text-gray-600">
              {stakeholders?.length || 0} stakeholders mapped
            </span>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 p-6 justify-center">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </div>
          ) : !stakeholders || stakeholders.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No stakeholders yet. Add your first stakeholder above.</div>
          ) : (
            stakeholders.map((s: any) => {
              const influence = INFLUENCE_LABELS[s.influenceLevel];
              const alignment = ALIGNMENT_LABELS[s.missionAlignment];
              const engagement = ENGAGEMENT_LABELS[s.engagementLevel];
              return (
                <div key={s.id} className="flex items-start gap-4 px-4 py-4 border-b last:border-b-0" style={{ borderColor: "#f3f4f6" }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: alignment?.color || "#6b7280" }}
                  >
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                      <span className="text-[10px] text-gray-400">{s.category.replace("_", " ")}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Badge className="text-[10px]" style={{ background: `${influence?.color}15`, color: influence?.color, border: "none" }}>
                        {influence?.label}
                      </Badge>
                      <Badge className="text-[10px]" style={{ background: `${alignment?.color}15`, color: alignment?.color, border: "none" }}>
                        {alignment?.label}
                      </Badge>
                      <Badge className="text-[10px]" style={{ background: `${engagement?.color}15`, color: engagement?.color, border: "none" }}>
                        {engagement?.label}
                      </Badge>
                    </div>
                    {s.interests && <p className="text-[10px] text-gray-500 mt-1">Interests: {s.interests}</p>}
                    {s.engagementStrategy && <p className="text-[10px] text-gray-400 mt-0.5">Strategy: {s.engagementStrategy}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(s)} className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-1 rounded">Edit</button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: s.id })}
                      className="text-[10px] text-red-400 hover:text-red-600 px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Framework View */}
      {activeView === "framework" && framework && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="font-semibold text-gray-900 mb-1">{framework.title}</h3>
            <p className="text-xs text-gray-500 mb-4">{framework.description}</p>
            <div className="grid grid-cols-2 gap-4">
              {framework.quadrants.map((q: any) => (
                <div key={q.name} className="border rounded-xl p-4" style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${q.color}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: q.color }} />
                    <span className="text-xs font-semibold text-gray-900">{q.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{q.description}</p>
                  <div className="space-y-1">
                    {q.strategies.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                        <ChevronRight size={9} className="mt-0.5 flex-shrink-0" style={{ color: q.color }} />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="font-semibold text-gray-900 mb-3">Engagement Principles</h3>
            <div className="space-y-3">
              {framework.engagementPrinciples.map((p: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#7c3aed" }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900 mb-0.5">{p.principle}</div>
                    <div className="text-[10px] text-gray-500">{p.rationale}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="font-semibold text-gray-900 mb-3">Risk Signals</h3>
            <div className="space-y-2">
              {framework.riskSignals.map((signal: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 rounded-lg p-2">
                  <AlertTriangle size={11} className="mt-0.5 text-amber-600 flex-shrink-0" />
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
