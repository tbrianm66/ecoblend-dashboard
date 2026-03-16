// ============================================================
// PRODUCT OPPORTUNITY INTELLIGENCE (POI) MODULE
// Design: Precision Industrial — tabbed pipeline with scoring
// POS = (Cost + Performance + Quality + Sustainability) / 4
// ============================================================

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Package, TrendingUp, CheckCircle2, XCircle, Clock, Plus,
  ChevronRight, BarChart3, Leaf, Zap, DollarSign, Star,
  ArrowRight, AlertTriangle, RefreshCw, Eye, Trash2, FileCheck2,
  Target, FlaskConical, ShieldCheck, Layers, Rocket
} from "lucide-react";

// ── Colour helpers ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Identified":       { bg: "#3A97D315", text: "#3A97D3", border: "#3A97D340" },
  "Under Assessment": { bg: "#F49C1315", text: "#F49C13", border: "#F49C1340" },
  "Scored":           { bg: "#8b5cf615", text: "#8b5cf6", border: "#8b5cf640" },
  "Approved for VRL": { bg: "#51AF3715", text: "#51AF37", border: "#51AF3740" },
  "Rejected":         { bg: "#ef444415", text: "#ef4444", border: "#ef444440" },
  "On Hold":          { bg: "#6b728015", text: "#6b7280", border: "#6b728040" },
};

const POS_COLORS: Record<string, { color: string; bg: string }> = {
  "Exceptional Opportunity": { color: "#51AF37", bg: "#51AF3715" },
  "High Opportunity":        { color: "#3A97D3", bg: "#3A97D315" },
  "Moderate Opportunity":    { color: "#F49C13", bg: "#F49C1315" },
  "Low Opportunity":         { color: "#6b7280", bg: "#6b728015" },
};

const STAGE_COLORS: Record<string, string> = {
  Concept: "#8b5cf6", Prototype: "#3A97D3", Pilot: "#F49C13",
  Commercial: "#51AF37", Mature: "#6b7280",
};

const DIMENSION_CONFIG = [
  { key: "cost",           label: "Cost",           icon: DollarSign, color: "#3A97D3",  scoreKey: "costScore" },
  { key: "performance",    label: "Performance",    icon: Zap,        color: "#F49C13",  scoreKey: "performanceScore" },
  { key: "quality",        label: "Quality",        icon: Star,       color: "#8b5cf6",  scoreKey: "qualityScore" },
  { key: "sustainability", label: "Sustainability", icon: Leaf,       color: "#51AF37",  scoreKey: "sustainabilityScore" },
];

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ value, max = 5, color = "#3A97D3" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${(value / max) * 100}%`, background: color }}
      />
    </div>
  );
}

// ── POS Gauge ─────────────────────────────────────────────────────────────────
function PosGauge({ score, classification }: { score: number; classification: string }) {
  const c = POS_COLORS[classification] ?? POS_COLORS["Low Opportunity"];
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl"
        style={{ background: c.bg, border: `2px solid ${c.color}`, color: c.color, fontFamily: "'Prompt', sans-serif" }}
      >
        {score.toFixed(1)}
      </div>
      <span className="text-xs font-semibold text-center" style={{ color: c.color }}>{classification}</span>
    </div>
  );
}

// ── Opportunity Card ──────────────────────────────────────────────────────────
function OpportunityCard({
  opp,
  onSelect,
  onDelete,
}: {
  opp: any;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const status = STATUS_COLORS[opp.status] ?? STATUS_COLORS["Identified"];
  const stageColor = STAGE_COLORS[opp.productStage ?? "Concept"] ?? "#6b7280";
  const pos = opp.pos;

  return (
    <div
      className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition-all duration-200 group"
      style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${stageColor}` }}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-base font-bold text-gray-900 truncate" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {opp.name}
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}
            >
              {opp.status}
            </span>
          </div>
          {opp.sector && <p className="text-xs text-gray-400 mb-1">{opp.sector}</p>}
          {opp.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{opp.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pos && <PosGauge score={pos.posScore} classification={pos.posClassification} />}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
          >
            <Trash2 size={13} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* POS dimension bars */}
      {pos && (
        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-50">
          {DIMENSION_CONFIG.map(d => (
            <div key={d.key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">{d.label}</span>
                <span className="text-xs font-mono text-gray-500">{(pos[d.scoreKey] ?? 0).toFixed(1)}</span>
              </div>
              <ScoreBar value={pos[d.scoreKey] ?? 0} color={d.color} />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${stageColor}15`, color: stageColor }}
          >
            {opp.productStage ?? "Concept"}
          </span>
          {opp.targetMarket && (
            <span className="text-xs text-gray-400">→ {opp.targetMarket}</span>
          )}
        </div>
        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          Open <ChevronRight size={11} />
        </span>
      </div>
    </div>
  );
}

// ── Score Slider (1–5) ────────────────────────────────────────────────────────
function ScoreInput({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  const labels = ["", "Very Poor", "Poor", "Average", "Good", "Excellent"];
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{labels[value]}</span>
          <span
            className="text-sm font-bold px-2 py-0.5 rounded-md"
            style={{ background: `${color}15`, color }}
          >
            {value}/5
          </span>
        </div>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className="flex-1 h-8 rounded-md text-xs font-semibold transition-all duration-150"
            style={{
              background: v <= value ? color : "#f3f4f6",
              color: v <= value ? "white" : "#9ca3af",
              border: `1px solid ${v <= value ? color : "#e5e7eb"}`,
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <ScoreBar value={value} color={color} />
    </div>
  );
}

// ── Assessment Panel ──────────────────────────────────────────────────────────
function AssessmentPanel({ opportunityId, dimension, onSaved }: {
  opportunityId: number;
  dimension: typeof DIMENSION_CONFIG[number];
  onSaved: () => void;
}) {
  const utils = trpc.useUtils();

  // Fetch existing assessment
  const { data: existing } = dimension.key === "cost"
    ? trpc.poi.getCostAssessment.useQuery({ opportunityId })
    : dimension.key === "performance"
    ? trpc.poi.getPerformanceAssessment.useQuery({ opportunityId })
    : dimension.key === "quality"
    ? trpc.poi.getQualityAssessment.useQuery({ opportunityId })
    : trpc.poi.getSustainabilityAssessment.useQuery({ opportunityId });

  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [assessedBy, setAssessedBy] = useState("");

  // Populate from existing when loaded
  const existingRef = existing as any;

  const getScore = (key: string) => scores[key] ?? existingRef?.[key] ?? 1;
  const setScore = (key: string, v: number) => setScores(prev => ({ ...prev, [key]: v }));

  const costMutation = trpc.poi.upsertCostAssessment.useMutation({ onSuccess: () => { utils.poi.getOpportunity.invalidate({ id: opportunityId }); onSaved(); toast.success("Cost assessment saved"); } });
  const perfMutation = trpc.poi.upsertPerformanceAssessment.useMutation({ onSuccess: () => { utils.poi.getOpportunity.invalidate({ id: opportunityId }); onSaved(); toast.success("Performance assessment saved"); } });
  const qualMutation = trpc.poi.upsertQualityAssessment.useMutation({ onSuccess: () => { utils.poi.getOpportunity.invalidate({ id: opportunityId }); onSaved(); toast.success("Quality assessment saved"); } });
  const sustMutation = trpc.poi.upsertSustainabilityAssessment.useMutation({ onSuccess: () => { utils.poi.getOpportunity.invalidate({ id: opportunityId }); onSaved(); toast.success("Sustainability assessment saved"); } });

  const handleSave = () => {
    const base = { productOpportunityId: opportunityId, assessedBy: assessedBy || undefined, notes: notes || undefined };
    if (dimension.key === "cost") {
      costMutation.mutate({ ...base, manufacturingCostScore: getScore("manufacturingCostScore"), supplyChainCostScore: getScore("supplyChainCostScore"), lifecycleCostScore: getScore("lifecycleCostScore") });
    } else if (dimension.key === "performance") {
      perfMutation.mutate({ ...base, technicalCapabilityScore: getScore("technicalCapabilityScore"), efficiencyScore: getScore("efficiencyScore"), functionalityScore: getScore("functionalityScore") });
    } else if (dimension.key === "quality") {
      qualMutation.mutate({ ...base, reliabilityScore: getScore("reliabilityScore"), durabilityScore: getScore("durabilityScore"), userExperienceScore: getScore("userExperienceScore") });
    } else {
      sustMutation.mutate({ ...base, carbonFootprintScore: getScore("carbonFootprintScore"), esgComplianceScore: getScore("esgComplianceScore"), circularityScore: getScore("circularityScore") });
    }
  };

  const isSaving = costMutation.isPending || perfMutation.isPending || qualMutation.isPending || sustMutation.isPending;

  const FIELDS: Record<string, { key: string; label: string }[]> = {
    cost: [
      { key: "manufacturingCostScore", label: "Manufacturing Cost Gap" },
      { key: "supplyChainCostScore", label: "Supply Chain Cost Gap" },
      { key: "lifecycleCostScore", label: "Lifecycle Cost Gap" },
    ],
    performance: [
      { key: "technicalCapabilityScore", label: "Technical Capability" },
      { key: "efficiencyScore", label: "Efficiency Rating" },
      { key: "functionalityScore", label: "Functionality" },
    ],
    quality: [
      { key: "reliabilityScore", label: "Reliability" },
      { key: "durabilityScore", label: "Durability" },
      { key: "userExperienceScore", label: "User Experience" },
    ],
    sustainability: [
      { key: "carbonFootprintScore", label: "Carbon Footprint Reduction" },
      { key: "esgComplianceScore", label: "ESG Compliance Level" },
      { key: "circularityScore", label: "Circularity Potential" },
    ],
  };

  const fields = FIELDS[dimension.key] ?? [];
  const avgScore = fields.reduce((sum, f) => sum + getScore(f.key), 0) / fields.length;

  return (
    <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${dimension.color}15` }}>
            <dimension.icon size={16} style={{ color: dimension.color }} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {dimension.label} Assessment
            </h3>
            <p className="text-xs text-gray-400">Score each sub-dimension 1 (worst) to 5 (best)</p>
          </div>
        </div>
        <div
          className="text-2xl font-bold px-3 py-1 rounded-lg"
          style={{ background: `${dimension.color}15`, color: dimension.color, fontFamily: "'Prompt', sans-serif" }}
        >
          {avgScore.toFixed(1)}
        </div>
      </div>

      {fields.map(f => (
        <ScoreInput
          key={f.key}
          label={f.label}
          value={getScore(f.key)}
          onChange={v => setScore(f.key, v)}
          color={dimension.color}
        />
      ))}

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Assessed By</Label>
          <Input
            placeholder="Name / role"
            value={assessedBy}
            onChange={e => setAssessedBy(e.target.value)}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Notes</Label>
          <Input
            placeholder="Optional notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="text-sm"
          />
        </div>
      </div>

      <Button
        className="w-full mt-4 text-white"
        style={{ background: dimension.color }}
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? <RefreshCw size={14} className="animate-spin mr-2" /> : <FileCheck2 size={14} className="mr-2" />}
        Save {dimension.label} Assessment
      </Button>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function OpportunityDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const { data, isLoading, refetch } = trpc.poi.getOpportunity.useQuery({ id });
  const [activeTab, setActiveTab] = useState<"overview" | "assess" | "review">("overview");
  const [activeDimension, setActiveDimension] = useState(0);

  // Review form
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerRole, setReviewerRole] = useState("");
  const [decision, setDecision] = useState<string>("");
  const [rationale, setRationale] = useState("");

  // Approve for VRL modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveReviewerName, setApproveReviewerName] = useState("");
  const [approveReviewerRole, setApproveReviewerRole] = useState("");
  const [approveRationale, setApproveRationale] = useState("");

  const approveForVrl = trpc.poi.approveForVrl.useMutation({
    onSuccess: (result) => {
      utils.poi.listOpportunities.invalidate();
      refetch();
      if (result.alreadyConverted) {
        toast.info("This opportunity has already been converted to a venture.", {
          description: "Redirecting to the Founder Onboarding wizard...",
        });
      } else {
        toast.success("Opportunity approved! New venture created.", {
          description: "Redirecting to Founder Onboarding wizard...",
        });
      }
      setShowApproveModal(false);
      // Navigate to onboarding with the new venture ID as a query param
      setTimeout(() => navigate(`/onboarding?ventureId=${result.ventureId}`), 800);
    },
    onError: (err) => {
      toast.error("Approval failed", { description: err.message });
    },
  });

  const addReview = trpc.poi.addReview.useMutation({
    onSuccess: () => {
      utils.poi.listOpportunities.invalidate();
      refetch();
      toast.success("Review submitted");
      setReviewerName(""); setReviewerRole(""); setDecision(""); setRationale("");
    },
  });

  const updateStatus = trpc.poi.updateOpportunity.useMutation({
    onSuccess: () => { utils.poi.listOpportunities.invalidate(); refetch(); toast.success("Status updated"); },
  });

  if (isLoading || !data?.opp) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const { opp, pos, reviews } = data;
  const status = STATUS_COLORS[opp?.status ?? "Identified"] ?? STATUS_COLORS["Identified"];

  const TABS = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "assess",   label: "Assess",   icon: BarChart3 },
    { id: "review",   label: "Review",   icon: ShieldCheck },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
              ← Back to pipeline
            </button>
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {opp.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}
              >
                {opp.status}
              </span>
              {opp.sector && <span className="text-xs text-gray-400">{opp.sector}</span>}
              {opp.targetMarket && <span className="text-xs text-gray-400">→ {opp.targetMarket}</span>}
            </div>
          </div>
          {pos && (
            <div className="flex items-center gap-4">
              <PosGauge score={pos.posScore ?? 0} classification={pos.posClassification ?? "Low Opportunity"} />
              <div className="grid grid-cols-2 gap-2">
                {DIMENSION_CONFIG.map(d => (
                  <div key={d.key} className="text-center">
                    <div className="text-xs text-gray-400 mb-0.5">{d.label}</div>
                    <div className="text-sm font-bold" style={{ color: d.color }}>
                      {(pos[d.scoreKey as keyof typeof pos] as number ?? 0).toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: activeTab === t.id ? "#51AF3715" : "transparent",
                color: activeTab === t.id ? "#51AF37" : "#6b7280",
                borderBottom: activeTab === t.id ? "2px solid #51AF37" : "2px solid transparent",
              }}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Description */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Product Overview</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">Description</span>
                  <p className="text-sm text-gray-700">{opp.description || "No description provided."}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Stage</span>
                    <span className="text-sm font-medium" style={{ color: STAGE_COLORS[opp.productStage ?? "Concept"] }}>
                      {opp.productStage ?? "Concept"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Submitted By</span>
                    <span className="text-sm text-gray-700">{opp.submittedBy || "—"}</span>
                  </div>
                </div>
                {opp.notes && (
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Notes</span>
                    <p className="text-sm text-gray-600 italic">{opp.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status management */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Pipeline Status</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {(["Identified", "Under Assessment", "Scored", "Approved for VRL", "On Hold", "Rejected"] as const).map(s => {
                    const sc = STATUS_COLORS[s];
                    const isActive = opp.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus.mutate({ id: opp.id, status: s })}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all duration-150"
                        style={{
                          background: isActive ? sc.bg : "#f9fafb",
                          color: isActive ? sc.text : "#6b7280",
                          border: `1px solid ${isActive ? sc.border : "#e5e7eb"}`,
                          fontWeight: isActive ? 700 : 500,
                        }}
                      >
                        {isActive && "✓ "}{s}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* POS breakdown */}
            {pos && (
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-sm">POS Score Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {DIMENSION_CONFIG.map(d => {
                      const score = pos[d.scoreKey as keyof typeof pos] as number ?? 0;
                      return (
                        <div key={d.key} className="text-center">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                            style={{ background: `${d.color}15`, border: `2px solid ${d.color}` }}>
                            <d.icon size={16} style={{ color: d.color }} />
                          </div>
                          <div className="text-lg font-bold" style={{ color: d.color, fontFamily: "'Prompt', sans-serif" }}>
                            {score.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">{d.label}</div>
                          <ScoreBar value={score} color={d.color} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">Overall POS</span>
                    <div className="flex items-center gap-3">
                      <div className="w-48 h-3 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${((pos.posScore ?? 0) / 5) * 100}%`,
                            background: POS_COLORS[pos.posClassification ?? "Low Opportunity"]?.color ?? "#6b7280",
                          }}
                        />
                      </div>
                      <span className="text-lg font-bold" style={{ color: POS_COLORS[pos.posClassification ?? "Low Opportunity"]?.color ?? "#6b7280", fontFamily: "'Prompt', sans-serif" }}>
                        {(pos.posScore ?? 0).toFixed(2)} / 5.00
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "assess" && (
          <div>
            {/* Dimension selector */}
            <div className="flex gap-2 mb-6">
              {DIMENSION_CONFIG.map((d, i) => (
                <button
                  key={d.key}
                  onClick={() => setActiveDimension(i)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    background: activeDimension === i ? `${d.color}15` : "#f9fafb",
                    color: activeDimension === i ? d.color : "#6b7280",
                    border: `1px solid ${activeDimension === i ? d.color : "#e5e7eb"}`,
                  }}
                >
                  <d.icon size={13} />
                  {d.label}
                </button>
              ))}
            </div>
            <AssessmentPanel
              opportunityId={id}
              dimension={DIMENSION_CONFIG[activeDimension]}
              onSaved={() => refetch()}
            />
          </div>
        )}

        {activeTab === "review" && (
          <div className="space-y-6">

            {/* ── Approve for VRL CTA ── */}
            {opp.status !== "Approved for VRL" && opp.status !== "Rejected" && (
              <div
                className="rounded-xl border-2 p-5 flex items-center justify-between"
                style={{ borderColor: "#51AF3740", background: "#51AF3708" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#51AF3715" }}>
                    <Rocket size={20} style={{ color: "#51AF37" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Ready to enter the VRL pipeline?</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Approving this opportunity will create a new venture record pre-populated with this opportunity's data
                      and open the Founder Onboarding wizard to complete the setup.
                    </p>
                  </div>
                </div>
                <Button
                  className="ml-4 flex-shrink-0 text-white font-semibold"
                  style={{ background: "#51AF37" }}
                  onClick={() => setShowApproveModal(true)}
                >
                  <Rocket size={14} className="mr-2" />
                  Approve for VRL
                </Button>
              </div>
            )}

            {/* Already converted banner */}
            {opp.convertedToVentureId && (
              <div
                className="rounded-xl border p-4 flex items-center gap-3"
                style={{ borderColor: "#51AF3740", background: "#51AF3710" }}
              >
                <CheckCircle2 size={18} style={{ color: "#51AF37" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#51AF37" }}>Converted to venture</p>
                  <p className="text-xs text-gray-500">Venture ID: {opp.convertedToVentureId}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add review */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Submit Panel Review</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Reviewer Name *</Label>
                      <Input value={reviewerName} onChange={e => setReviewerName(e.target.value)} placeholder="Full name" className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Role</Label>
                      <Input value={reviewerRole} onChange={e => setReviewerRole(e.target.value)} placeholder="e.g. Investment Director" className="text-sm" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Decision *</Label>
                    <Select value={decision} onValueChange={setDecision}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Approve for VRL">✅ Approve for VRL</SelectItem>
                        <SelectItem value="Defer">⏸ Defer</SelectItem>
                        <SelectItem value="Request More Data">📋 Request More Data</SelectItem>
                        <SelectItem value="Reject">❌ Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Rationale</Label>
                    <Textarea value={rationale} onChange={e => setRationale(e.target.value)} placeholder="Explain the decision..." rows={3} className="text-sm" />
                  </div>
                  <Button
                    className="w-full text-white"
                    style={{ background: "#51AF37" }}
                    disabled={!reviewerName || !decision || addReview.isPending}
                    onClick={() => addReview.mutate({
                      productOpportunityId: id,
                      reviewerName,
                      reviewerRole: reviewerRole || undefined,
                      decision: decision as any,
                      rationale: rationale || undefined,
                    })}
                  >
                    {addReview.isPending ? <RefreshCw size={14} className="animate-spin mr-2" /> : <FileCheck2 size={14} className="mr-2" />}
                    Submit Review
                  </Button>
                </CardContent>
              </Card>

              {/* Review history */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Review History</CardTitle></CardHeader>
                <CardContent>
                  {!reviews || reviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <ShieldCheck size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((r: any) => {
                        const decisionColors: Record<string, string> = {
                          "Approve for VRL": "#51AF37",
                          "Reject": "#ef4444",
                          "Defer": "#F49C13",
                          "Request More Data": "#3A97D3",
                        };
                        const color = decisionColors[r.decision] ?? "#6b7280";
                        return (
                          <div key={r.id} className="rounded-lg border p-3" style={{ borderColor: `${color}30`, background: `${color}08` }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-gray-800">{r.reviewerName}</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                                {r.decision}
                              </span>
                            </div>
                            {r.reviewerRole && <p className="text-xs text-gray-400 mb-1">{r.reviewerRole}</p>}
                            {r.rationale && <p className="text-xs text-gray-600">{r.rationale}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* ── Approve for VRL Confirmation Modal ── */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket size={18} style={{ color: "#51AF37" }} />
              Approve for VRL Pipeline
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div
              className="rounded-lg p-3 text-sm"
              style={{ background: "#51AF3710", border: "1px solid #51AF3730", color: "#1a2332" }}
            >
              <p className="font-semibold mb-1">What happens next:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600">
                <li>A new venture record is created pre-populated with this opportunity's data</li>
                <li>This opportunity is marked as <strong>Approved for VRL</strong></li>
                <li>You are redirected to the Founder Onboarding wizard to complete the setup</li>
              </ol>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Your Name *</Label>
                <Input
                  value={approveReviewerName}
                  onChange={e => setApproveReviewerName(e.target.value)}
                  placeholder="Full name"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Your Role</Label>
                <Input
                  value={approveReviewerRole}
                  onChange={e => setApproveReviewerRole(e.target.value)}
                  placeholder="e.g. Investment Director"
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Approval Rationale</Label>
              <Textarea
                value={approveRationale}
                onChange={e => setApproveRationale(e.target.value)}
                placeholder="Why is this opportunity ready for the VRL pipeline?"
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowApproveModal(false)} disabled={approveForVrl.isPending}>
              Cancel
            </Button>
            <Button
              className="text-white"
              style={{ background: "#51AF37" }}
              disabled={!approveReviewerName || approveForVrl.isPending}
              onClick={() => approveForVrl.mutate({
                opportunityId: id,
                reviewerName: approveReviewerName,
                reviewerRole: approveReviewerRole || undefined,
                rationale: approveRationale || undefined,
              })}
            >
              {approveForVrl.isPending
                ? <><RefreshCw size={14} className="animate-spin mr-2" /> Creating venture...</>
                : <><Rocket size={14} className="mr-2" /> Confirm Approval</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Add Opportunity Dialog ────────────────────────────────────────────────────
function AddOpportunityDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sector, setSector] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [productStage, setProductStage] = useState<string>("Concept");
  const [submittedBy, setSubmittedBy] = useState("");

  const addMutation = trpc.poi.addOpportunity.useMutation({
    onSuccess: () => {
      utils.poi.listOpportunities.invalidate();
      toast.success("Opportunity added to pipeline");
      onClose();
      setName(""); setDescription(""); setSector(""); setTargetMarket(""); setProductStage("Concept"); setSubmittedBy("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Product Opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Product / Technology Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bio-based Packaging Film" />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the opportunity..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Sector</Label>
              <Input value={sector} onChange={e => setSector(e.target.value)} placeholder="e.g. Food & Beverage" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Target Market</Label>
              <Input value={targetMarket} onChange={e => setTargetMarket(e.target.value)} placeholder="e.g. UK Retail" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Product Stage</Label>
              <Select value={productStage} onValueChange={setProductStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Concept", "Prototype", "Pilot", "Commercial", "Mature"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Submitted By</Label>
              <Input value={submittedBy} onChange={e => setSubmittedBy(e.target.value)} placeholder="Name" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="text-white"
            style={{ background: "#51AF37" }}
            disabled={!name || addMutation.isPending}
            onClick={() => addMutation.mutate({ name, description: description || undefined, sector: sector || undefined, targetMarket: targetMarket || undefined, productStage: productStage as any, submittedBy: submittedBy || undefined })}
          >
            {addMutation.isPending ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Plus size={14} className="mr-2" />}
            Add Opportunity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductOpportunityIntelligence() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: opportunities = [], isLoading } = trpc.poi.listOpportunities.useQuery();
  const deleteMutation = trpc.poi.deleteOpportunity.useMutation({
    onSuccess: () => { utils.poi.listOpportunities.invalidate(); toast.success("Opportunity removed"); },
  });

  // KPI summary
  const total = opportunities.length;
  const approved = opportunities.filter(o => o.status === "Approved for VRL").length;
  const scored = opportunities.filter(o => o.pos !== null).length;
  const avgPos = scored > 0
    ? opportunities.filter(o => o.pos).reduce((sum, o) => sum + (o.pos?.posScore ?? 0), 0) / scored
    : 0;

  const filtered = opportunities.filter(o => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || (o.sector ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (selectedId !== null) {
    return (
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <OpportunityDetail id={selectedId} onClose={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-7 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#51AF3715", color: "#51AF37" }}>
                POI Module
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">POS = (Cost + Performance + Quality + Sustainability) / 4</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Product Opportunity Intelligence
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Evaluate and score product opportunities before entry into the VRL pipeline.
            </p>
          </div>
          <Button
            className="text-white gap-1.5"
            style={{ background: "#51AF37" }}
            onClick={() => setAddOpen(true)}
          >
            <Plus size={14} /> Add Opportunity
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { label: "Total Opportunities", value: total, color: "#1a2332", sub: "in pipeline" },
            { label: "Scored",              value: scored, color: "#8b5cf6", sub: "with POS score" },
            { label: "Approved for VRL",    value: approved, color: "#51AF37", sub: "ready to enter VRL" },
            { label: "Avg POS Score",       value: avgPos.toFixed(2), color: "#3A97D3", sub: "out of 5.00" },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1">{k.label}</span>
              <span className="text-3xl font-bold block" style={{ color: k.color, fontFamily: "'Prompt', sans-serif" }}>{k.value}</span>
              <span className="text-xs text-gray-400">{k.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b bg-white flex items-center gap-3" style={{ borderColor: "#e5e7eb" }}>
        <Input
          placeholder="Search opportunities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs text-sm"
        />
        <div className="flex gap-1">
          {["all", "Identified", "Under Assessment", "Scored", "Approved for VRL", "On Hold", "Rejected"].map(s => {
            const sc = s === "all" ? null : STATUS_COLORS[s];
            const isActive = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: isActive ? (sc?.bg ?? "#1a233215") : "#f9fafb",
                  color: isActive ? (sc?.text ?? "#1a2332") : "#6b7280",
                  border: `1px solid ${isActive ? (sc?.border ?? "#1a233230") : "#e5e7eb"}`,
                }}
              >
                {s === "all" ? "All" : s}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Pipeline list */}
      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">No opportunities found</p>
            <p className="text-gray-300 text-sm mt-1">
              {search || filterStatus !== "all" ? "Try adjusting your filters" : "Add your first product opportunity to get started"}
            </p>
            {!search && filterStatus === "all" && (
              <Button
                className="mt-4 text-white"
                style={{ background: "#51AF37" }}
                onClick={() => setAddOpen(true)}
              >
                <Plus size={14} className="mr-2" /> Add First Opportunity
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filtered.map(opp => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                onSelect={() => setSelectedId(opp.id)}
                onDelete={() => {
                  if (confirm(`Remove "${opp.name}" from the pipeline?`)) {
                    deleteMutation.mutate({ id: opp.id });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <AddOpportunityDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
