/**
 * Advanced Stakeholder Management Tools
 * Phase 5 Long-Term — Engagement tracking, influence mapping, communication logs
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users, Plus, MessageSquare, TrendingUp, TrendingDown,
  Minus, AlertTriangle, Calendar, X, Save, Edit3, Trash2,
} from "lucide-react";

const INFLUENCE_COLORS: Record<string, string> = {
  critical: "#e53e3e",
  high: "#F49C13",
  medium: "#3A97D3",
  low: "#6b7280",
};

const ALIGNMENT_COLORS: Record<string, string> = {
  champion: "#51AF37",
  aligned: "#38a169",
  neutral: "#6b7280",
  skeptical: "#F49C13",
  opposed: "#e53e3e",
};

const SENTIMENT_ICONS: Record<string, React.ReactNode> = {
  "Very Positive": <TrendingUp size={13} style={{ color: "#51AF37" }} />,
  "Positive": <TrendingUp size={13} style={{ color: "#38a169" }} />,
  "Neutral": <Minus size={13} style={{ color: "#6b7280" }} />,
  "Negative": <TrendingDown size={13} style={{ color: "#F49C13" }} />,
  "Very Negative": <TrendingDown size={13} style={{ color: "#e53e3e" }} />,
};

const CATEGORIES = ["Investor", "Board Member", "Employee", "Customer", "Community", "Regulator", "Partner", "Media"] as const;
const INTERACTION_TYPES = ["Meeting", "Email", "Call", "Board Meeting", "Public Event", "Report", "Negotiation"] as const;

interface StakeholderForm {
  id?: number;
  ventureId: string;
  name: string;
  category: string;
  organization: string;
  influenceLevel: string;
  missionAlignment: string;
  engagementLevel: string;
  interests: string;
  concerns: string;
  engagementStrategy: string;
}

const EMPTY_STAKEHOLDER: StakeholderForm = {
  ventureId: "portfolio",
  name: "",
  category: "Investor",
  organization: "",
  influenceLevel: "medium",
  missionAlignment: "neutral",
  engagementLevel: "neutral",
  interests: "",
  concerns: "",
  engagementStrategy: "",
};

interface InteractionForm {
  stakeholderId: number;
  ventureId: string;
  interactionType: string;
  date: string;
  summary: string;
  sentiment: string;
  commitments: string;
  followUpActions: string;
  followUpDue: string;
  missionAlignmentImpact: string;
}

export default function AdvancedStakeholderManagement({ ventureId }: { ventureId?: string }) {
  const [view, setView] = useState<"map"|"list"|"interactions"|"add-stakeholder"|"add-interaction">("map");
  const [selectedStakeholder, setSelectedStakeholder] = useState<any>(null);
  const [stakeholderForm, setStakeholderForm] = useState<StakeholderForm>(EMPTY_STAKEHOLDER);
  const [interactionForm, setInteractionForm] = useState<InteractionForm>({
    stakeholderId: 0,
    ventureId: ventureId ?? "portfolio",
    interactionType: "Meeting",
    date: new Date().toISOString().split("T")[0],
    summary: "",
    sentiment: "Neutral",
    commitments: "",
    followUpActions: "",
    followUpDue: "",
    missionAlignmentImpact: "Neutral",
  });

  const matrixQuery = trpc.advancedStakeholder.getInfluenceMatrix.useQuery({ ventureId });
  const followUpsQuery = trpc.advancedStakeholder.getFollowUps.useQuery();
  const alignmentQuery = trpc.advancedStakeholder.getMissionAlignmentTrend.useQuery({ ventureId });
  const interactionsQuery = trpc.advancedStakeholder.getInteractions.useQuery(
    { stakeholderId: selectedStakeholder?.id },
    { enabled: !!selectedStakeholder?.id }
  );

  const utils = trpc.useUtils();
  const upsertMutation = trpc.advancedStakeholder.upsert.useMutation({
    onSuccess: () => {
      utils.advancedStakeholder.getInfluenceMatrix.invalidate();
      utils.advancedStakeholder.getMissionAlignmentTrend.invalidate();
      toast.success("Stakeholder profile saved");
      setView("map");
      setStakeholderForm(EMPTY_STAKEHOLDER);
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.advancedStakeholder.delete.useMutation({
    onSuccess: () => {
      utils.advancedStakeholder.getInfluenceMatrix.invalidate();
      toast.success("Stakeholder removed");
      setSelectedStakeholder(null);
    },
  });
  const logInteractionMutation = trpc.advancedStakeholder.logInteraction.useMutation({
    onSuccess: () => {
      utils.advancedStakeholder.getInteractions.invalidate();
      utils.advancedStakeholder.getFollowUps.invalidate();
      utils.advancedStakeholder.getMissionAlignmentTrend.invalidate();
      toast.success("Interaction logged");
      setView("interactions");
    },
    onError: (e) => toast.error(e.message),
  });

  const stakeholders = matrixQuery.data ?? [];
  const followUps = followUpsQuery.data ?? [];
  const alignment = alignmentQuery.data;
  const interactions = interactionsQuery.data ?? [];

  const criticalRisk = stakeholders.filter((s: any) =>
    (s.influenceLevel === "critical" || s.influenceLevel === "high") &&
    (s.missionAlignment === "opposed" || s.missionAlignment === "skeptical")
  );

  const handleEditStakeholder = (s: any) => {
    setStakeholderForm({
      id: s.id,
      ventureId: s.ventureId ?? "portfolio",
      name: s.name,
      category: s.category,
      organization: s.organization ?? "",
      influenceLevel: s.influenceLevel,
      missionAlignment: s.missionAlignment,
      engagementLevel: s.engagementLevel,
      interests: s.interests ?? "",
      concerns: s.concerns ?? "",
      engagementStrategy: s.engagementStrategy ?? "",
    });
    setView("add-stakeholder");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Advanced Stakeholder Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Map influence, track alignment, and manage engagement across all stakeholder groups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setView("add-stakeholder")}>
            <Plus size={11} /> Add Stakeholder
          </Button>
        </div>
      </div>

      {/* Mission Alignment Summary */}
      {alignment && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Strengthened", value: alignment.strengthened, color: "#51AF37" },
            { label: "Neutral Impact", value: alignment.neutral, color: "#6b7280" },
            { label: "Weakened", value: alignment.weakened, color: "#e53e3e" },
            { label: "Net Score", value: `${alignment.netScore > 0 ? "+" : ""}${alignment.netScore}`, color: alignment.netScore > 0 ? "#51AF37" : alignment.netScore < 0 ? "#e53e3e" : "#6b7280" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border p-4 text-center shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-2xl font-bold" style={{ color, fontFamily: "'Prompt', sans-serif" }}>{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Critical Risk Alert */}
      {criticalRisk.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "#e53e3e08", borderColor: "#e53e3e30" }}>
          <AlertTriangle size={16} style={{ color: "#e53e3e", marginTop: 1 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#e53e3e" }}>
              {criticalRisk.length} High-Risk Stakeholder{criticalRisk.length > 1 ? "s" : ""} Detected
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {criticalRisk.map((s: any) => s.name).join(", ")} — high influence but misaligned with mission. Immediate engagement recommended.
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b" style={{ borderColor: "#e5e7eb" }}>
        {[
          { id: "map", label: "Influence Map" },
          { id: "list", label: "Stakeholder List" },
          { id: "interactions", label: "Interaction Log" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setView(id as any)}
            className="px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap"
            style={{
              borderColor: view === id ? "#51AF37" : "transparent",
              color: view === id ? "#51AF37" : "#6b7280",
            }}
          >
            {label}
          </button>
        ))}
        {followUps.length > 0 && (
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: "#F49C1320", color: "#F49C13" }}>
            {followUps.length} follow-ups due
          </span>
        )}
      </div>

      {/* Influence Map */}
      {view === "map" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
            <span className="font-semibold">Mission Alignment →</span>
            {["champion", "aligned", "neutral", "skeptical", "opposed"].map(a => (
              <span key={a} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: ALIGNMENT_COLORS[a] }} />
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </span>
            ))}
          </div>
          {stakeholders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users size={36} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No stakeholders mapped yet</p>
              <Button size="sm" className="mt-3 gap-1" onClick={() => setView("add-stakeholder")} style={{ background: "#51AF37" }}>
                <Plus size={11} /> Add First Stakeholder
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stakeholders.map((s: any) => {
                const infColor = INFLUENCE_COLORS[s.influenceLevel] ?? "#6b7280";
                const alignColor = ALIGNMENT_COLORS[s.missionAlignment] ?? "#6b7280";
                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all group"
                    style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${alignColor}` }}
                    onClick={() => { setSelectedStakeholder(s); setView("interactions"); }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.category}{s.organization ? ` · ${s.organization}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleEditStakeholder(s); }} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100">
                          <Edit3 size={11} className="text-gray-400" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if (confirm("Remove this stakeholder?")) deleteMutation.mutate({ id: s.id }); }} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50">
                          <Trash2 size={11} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${infColor}15`, color: infColor }}>
                        {s.influenceLevel} influence
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${alignColor}15`, color: alignColor }}>
                        {s.missionAlignment}
                      </span>
                    </div>
                    {s.interaction_count > 0 && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        <MessageSquare size={10} className="inline mr-1" />
                        {s.interaction_count} interaction{s.interaction_count > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stakeholder List */}
      {view === "list" && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Stakeholder</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Influence</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Alignment</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Engagement</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Interactions</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {stakeholders.map((s: any, i: number) => {
                const infColor = INFLUENCE_COLORS[s.influenceLevel] ?? "#6b7280";
                const alignColor = ALIGNMENT_COLORS[s.missionAlignment] ?? "#6b7280";
                return (
                  <tr key={s.id} style={{ borderBottom: i < stakeholders.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      {s.organization && <p className="text-gray-400">{s.organization}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.category}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full" style={{ background: `${infColor}15`, color: infColor }}>
                        {s.influenceLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full" style={{ background: `${alignColor}15`, color: alignColor }}>
                        {s.missionAlignment}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.engagementLevel}</td>
                    <td className="px-4 py-3 text-gray-600">{s.interaction_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-6 px-2 gap-1"
                        onClick={() => { setSelectedStakeholder(s); setView("interactions"); }}
                      >
                        <MessageSquare size={10} /> Log
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {stakeholders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No stakeholders added yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Interactions View */}
      {view === "interactions" && (
        <div className="flex flex-col gap-4">
          {selectedStakeholder && (
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div>
                <p className="text-sm font-bold text-gray-900">{selectedStakeholder.name}</p>
                <p className="text-xs text-gray-500">{selectedStakeholder.category}{selectedStakeholder.organization ? ` · ${selectedStakeholder.organization}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => {
                    setInteractionForm(prev => ({ ...prev, stakeholderId: selectedStakeholder.id }));
                    setView("add-interaction");
                  }}
                  style={{ background: "#51AF37" }}
                >
                  <Plus size={11} /> Log Interaction
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedStakeholder(null)}>
                  All Stakeholders
                </Button>
              </div>
            </div>
          )}

          {!selectedStakeholder && (
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">All Recent Interactions</p>
              <p className="text-xs text-gray-400">Select a stakeholder to log a new interaction</p>
            </div>
          )}

          {interactionsQuery.isLoading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading interactions...</div>
          ) : interactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare size={36} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No interactions logged yet</p>
              {selectedStakeholder && (
                <Button size="sm" className="mt-3 gap-1" onClick={() => setView("add-interaction")} style={{ background: "#51AF37" }}>
                  <Plus size={11} /> Log First Interaction
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {interactions.map((interaction: any) => (
                <div key={interaction.id} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {interaction.interaction_type}
                      </span>
                      {SENTIMENT_ICONS[interaction.sentiment]}
                      <span className="text-xs text-gray-500">{interaction.sentiment}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={11} />
                      {new Date(interaction.date).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mb-2">{interaction.summary}</p>
                  {interaction.commitments && (
                    <p className="text-xs text-green-700 mb-1">
                      <strong>Commitments:</strong> {interaction.commitments}
                    </p>
                  )}
                  {interaction.follow_up_actions && (
                    <p className="text-xs text-amber-700">
                      <strong>Follow-up:</strong> {interaction.follow_up_actions}
                      {interaction.follow_up_due && ` (due ${new Date(interaction.follow_up_due).toLocaleDateString()})`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Stakeholder Form */}
      {view === "add-stakeholder" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">{stakeholderForm.id ? "Edit Stakeholder" : "Add Stakeholder"}</h3>
            <button onClick={() => { setView("map"); setStakeholderForm(EMPTY_STAKEHOLDER); }}>
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Name *", key: "name", placeholder: "e.g., Jane Smith" },
              { label: "Organisation", key: "organization", placeholder: "e.g., Impact Capital Partners" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: "#e5e7eb" }}
                  placeholder={placeholder}
                  value={(stakeholderForm as any)[key]}
                  onChange={(e) => setStakeholderForm(prev => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
            {[
              { label: "Category", key: "category", options: CATEGORIES },
              { label: "Influence Level", key: "influenceLevel", options: ["critical", "high", "medium", "low"] },
              { label: "Mission Alignment", key: "missionAlignment", options: ["champion", "aligned", "neutral", "skeptical", "opposed"] },
              { label: "Engagement Level", key: "engagementLevel", options: ["active", "engaged", "neutral", "passive", "disengaged"] },
            ].map(({ label, key, options }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: "#e5e7eb" }}
                  value={(stakeholderForm as any)[key]}
                  onChange={(e) => setStakeholderForm(prev => ({ ...prev, [key]: e.target.value }))}
                >
                  {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                </select>
              </div>
            ))}
            {[
              { label: "Interests", key: "interests", placeholder: "What does this stakeholder care about?" },
              { label: "Concerns", key: "concerns", placeholder: "What are their concerns about the mission?" },
              { label: "Engagement Strategy", key: "engagementStrategy", placeholder: "How should we engage with them?" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ borderColor: "#e5e7eb" }}
                  rows={2}
                  placeholder={placeholder}
                  value={(stakeholderForm as any)[key]}
                  onChange={(e) => setStakeholderForm(prev => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => { setView("map"); setStakeholderForm(EMPTY_STAKEHOLDER); }}>Cancel</Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if (!stakeholderForm.name.trim()) { toast.error("Name is required"); return; }
                upsertMutation.mutate(stakeholderForm);
              }}
              disabled={upsertMutation.isPending}
              style={{ background: "#51AF37" }}
            >
              <Save size={12} /> {upsertMutation.isPending ? "Saving..." : "Save Stakeholder"}
            </Button>
          </div>
        </div>
      )}

      {/* Add Interaction Form */}
      {view === "add-interaction" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Log Interaction — {selectedStakeholder?.name}</h3>
            <button onClick={() => setView("interactions")}>
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Interaction Type</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#e5e7eb" }}
                value={interactionForm.interactionType}
                onChange={(e) => setInteractionForm(prev => ({ ...prev, interactionType: e.target.value }))}
              >
                {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Date</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#e5e7eb" }}
                value={interactionForm.date}
                onChange={(e) => setInteractionForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Sentiment</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#e5e7eb" }}
                value={interactionForm.sentiment}
                onChange={(e) => setInteractionForm(prev => ({ ...prev, sentiment: e.target.value }))}
              >
                {["Very Positive", "Positive", "Neutral", "Negative", "Very Negative"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Mission Alignment Impact</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#e5e7eb" }}
                value={interactionForm.missionAlignmentImpact}
                onChange={(e) => setInteractionForm(prev => ({ ...prev, missionAlignmentImpact: e.target.value }))}
              >
                {["Strengthened", "Neutral", "Weakened"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Summary *</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ borderColor: "#e5e7eb" }}
                rows={3}
                placeholder="What was discussed? What was the outcome?"
                value={interactionForm.summary}
                onChange={(e) => setInteractionForm(prev => ({ ...prev, summary: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Commitments Made</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ borderColor: "#e5e7eb" }}
                rows={2}
                placeholder="Any commitments made by either party"
                value={interactionForm.commitments}
                onChange={(e) => setInteractionForm(prev => ({ ...prev, commitments: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Follow-up Actions</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ borderColor: "#e5e7eb" }}
                rows={2}
                placeholder="Actions to take after this interaction"
                value={interactionForm.followUpActions}
                onChange={(e) => setInteractionForm(prev => ({ ...prev, followUpActions: e.target.value }))}
              />
            </div>
            {interactionForm.followUpActions && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Follow-up Due Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: "#e5e7eb" }}
                  value={interactionForm.followUpDue}
                  onChange={(e) => setInteractionForm(prev => ({ ...prev, followUpDue: e.target.value }))}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => setView("interactions")}>Cancel</Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if (!interactionForm.summary.trim()) { toast.error("Summary is required"); return; }
                logInteractionMutation.mutate({
                  stakeholderId: selectedStakeholder?.id ?? interactionForm.stakeholderId,
                  ventureId: ventureId ?? "portfolio",
                  interactionType: interactionForm.interactionType,
                  date: new Date(interactionForm.date).getTime(),
                  summary: interactionForm.summary,
                  sentiment: interactionForm.sentiment,
                  commitments: interactionForm.commitments,
                  followUpActions: interactionForm.followUpActions,
                  followUpDue: interactionForm.followUpDue ? new Date(interactionForm.followUpDue).getTime() : undefined,
                  missionAlignmentImpact: interactionForm.missionAlignmentImpact,
                });
              }}
              disabled={logInteractionMutation.isPending}
              style={{ background: "#51AF37" }}
            >
              <Save size={12} /> {logInteractionMutation.isPending ? "Saving..." : "Log Interaction"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
