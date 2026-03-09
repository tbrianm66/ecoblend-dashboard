// ============================================================
// OPPORTUNITY PIPELINE
// Intake → Scoring → Approval → Conversion to Venture
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, ChevronRight, TrendingUp, Target, Leaf, Users,
  CheckCircle2, XCircle, ArrowRight, Lightbulb, BarChart3,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Identified: { label: "Identified", color: "#6b7280", bg: "#f3f4f6" },
  Scoring:    { label: "Scoring",    color: "#f59e0b", bg: "#fef3c7" },
  Approved:   { label: "Approved",   color: "#10b981", bg: "#d1fae5" },
  Rejected:   { label: "Rejected",   color: "#ef4444", bg: "#fee2e2" },
  Converted:  { label: "Converted",  color: "#3b82f6", bg: "#dbeafe" },
};

const STAGE_ORDER = ["Identified", "Scoring", "Approved", "Converted"];

function ScoreBar({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 flex items-center justify-center" style={{ color }}>
        <Icon size={14} />
      </div>
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(value / 10) * 100}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono font-semibold w-8 text-right" style={{ color }}>{value}/10</span>
    </div>
  );
}

function OpportunityCard({
  opp,
  onAdvance,
  onReject,
  onScore,
}: {
  opp: any;
  onAdvance: () => void;
  onReject: () => void;
  onScore: () => void;
}) {
  const cfg = STATUS_CONFIG[opp.status] ?? STATUS_CONFIG.Identified;
  const canAdvance = opp.status !== "Approved" && opp.status !== "Rejected" && opp.status !== "Converted";
  const canReject = opp.status !== "Rejected" && opp.status !== "Converted";

  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
            {opp.sector && (
              <span className="text-xs text-gray-400 font-mono">{opp.sector}</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">{opp.title}</h3>
          {opp.problemStatement && (
            <p className="text-xs text-gray-500 line-clamp-2">{opp.problemStatement}</p>
          )}
        </div>
        <div className="ml-4 text-right shrink-0">
          <div className="text-2xl font-bold" style={{ color: opp.totalScore >= 30 ? "#10b981" : opp.totalScore >= 20 ? "#f59e0b" : "#ef4444" }}>
            {opp.totalScore}
          </div>
          <div className="text-xs text-gray-400">/ 40</div>
        </div>
      </div>

      {opp.totalScore > 0 && (
        <div className="space-y-1.5 mb-4 p-3 rounded-lg bg-gray-50">
          <ScoreBar label="Market Size" value={opp.marketSizeScore} icon={TrendingUp} color="#3b82f6" />
          <ScoreBar label="Strategic Fit" value={opp.strategicFitScore} icon={Target} color="#8b5cf6" />
          <ScoreBar label="ESG Alignment" value={opp.esgAlignmentScore} icon={Leaf} color="#10b981" />
          <ScoreBar label="Founder Avail." value={opp.founderAvailScore} icon={Users} color="#f59e0b" />
        </div>
      )}

      {opp.notes && (
        <p className="text-xs text-gray-400 italic mb-3 line-clamp-2">{opp.notes}</p>
      )}

      <div className="flex items-center gap-2 mt-2">
        <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={onScore}>
          <BarChart3 size={11} /> Score
        </Button>
        {canAdvance && (
          <Button
            size="sm"
            className="gap-1 text-xs h-7"
            style={{ background: "#10b981", color: "white" }}
            onClick={onAdvance}
          >
            <ChevronRight size={11} />
            {opp.status === "Scoring" ? "Approve" : "Advance"}
          </Button>
        )}
        {canReject && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs h-7 text-red-500 border-red-200 hover:bg-red-50"
            onClick={onReject}
          >
            <XCircle size={11} /> Reject
          </Button>
        )}
        {opp.status === "Approved" && (
          <Button
            size="sm"
            className="gap-1 text-xs h-7 ml-auto"
            style={{ background: "#3b82f6", color: "white" }}
            onClick={onAdvance}
          >
            <ArrowRight size={11} /> Convert to Venture
          </Button>
        )}
      </div>
    </div>
  );
}

export default function OpportunityPipeline() {
  const utils = trpc.useUtils();
  const { data: opps = [], isLoading } = trpc.opportunities.list.useQuery();

  const [showAdd, setShowAdd] = useState(false);
  const [showScore, setShowScore] = useState<any | null>(null);
  const [form, setForm] = useState({ title: "", problemStatement: "", sector: "", submittedBy: "", notes: "" });
  const [scoreForm, setScoreForm] = useState({ marketSizeScore: 5, strategicFitScore: 5, esgAlignmentScore: 5, founderAvailScore: 5 });

  const addMutation = trpc.opportunities.add.useMutation({
    onSuccess: () => { utils.opportunities.list.invalidate(); setShowAdd(false); setForm({ title: "", problemStatement: "", sector: "", submittedBy: "", notes: "" }); toast.success("Opportunity added"); },
    onError: () => toast.error("Failed to add opportunity"),
  });

  const updateStatusMutation = trpc.opportunities.updateStatus.useMutation({
    onSuccess: () => { utils.opportunities.list.invalidate(); toast.success("Status updated"); },
    onError: () => toast.error("Failed to update status"),
  });

  const updateScoresMutation = trpc.opportunities.updateScores.useMutation({
    onSuccess: () => { utils.opportunities.list.invalidate(); setShowScore(null); toast.success("Scores saved"); },
    onError: () => toast.error("Failed to save scores"),
  });

  const handleAdvance = (opp: any) => {
    const nextStatus: Record<string, string> = {
      Identified: "Scoring",
      Scoring: "Approved",
      Approved: "Converted",
    };
    const next = nextStatus[opp.status];
    if (next) updateStatusMutation.mutate({ id: opp.id, status: next as any });
  };

  const handleReject = (opp: any) => {
    updateStatusMutation.mutate({ id: opp.id, status: "Rejected" });
  };

  const openScore = (opp: any) => {
    setShowScore(opp);
    setScoreForm({
      marketSizeScore: opp.marketSizeScore ?? 5,
      strategicFitScore: opp.strategicFitScore ?? 5,
      esgAlignmentScore: opp.esgAlignmentScore ?? 5,
      founderAvailScore: opp.founderAvailScore ?? 5,
    });
  };

  const stats = {
    total: opps.length,
    approved: opps.filter(o => o.status === "Approved").length,
    converted: opps.filter(o => o.status === "Converted").length,
    avgScore: opps.length > 0 ? Math.round(opps.reduce((s, o) => s + (o.totalScore ?? 0), 0) / opps.length) : 0,
  };

  const pipelineStages = STAGE_ORDER.map(s => ({
    status: s,
    items: opps.filter(o => o.status === s),
  }));
  const rejected = opps.filter(o => o.status === "Rejected");

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb size={16} style={{ color: "#7c3aed" }} />
              <span className="vos-badge" style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "0.65rem" }}>Pipeline</span>
            </div>
            <h1 className="vos-page-title mb-1">Venture Opportunity Pipeline</h1>
            <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              Identify, score, and advance new venture opportunities through the EcoRace Studio intake process.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            style={{ background: "#7c3aed", color: "white" }}
            onClick={() => setShowAdd(true)}
          >
            <Plus size={13} /> Add Opportunity
          </Button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          {[
            { label: "Total Opportunities", value: stats.total, sub: "in pipeline", color: "#7c3aed" },
            { label: "Approved", value: stats.approved, sub: "ready to launch", color: "#10b981" },
            { label: "Converted", value: stats.converted, sub: "to active venture", color: "#3b82f6" },
            { label: "Avg Score", value: `${stats.avgScore}/40`, sub: "scoring matrix", color: "#f59e0b" },
          ].map(k => (
            <div key={k.label} className="vos-metric">
              <span className="vos-metric-label">{k.label}</span>
              <span className="vos-metric-value" style={{ color: k.color }}>{k.value}</span>
              <span className="vos-metric-sub">{k.sub}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Pipeline columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {pipelineStages.map(({ status, items }) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span
                    className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="border-2 border-dashed rounded-xl p-6 text-center text-xs text-gray-300" style={{ borderColor: "#e5e7eb" }}>
                      No opportunities
                    </div>
                  ) : (
                    items.map(opp => (
                      <OpportunityCard
                        key={opp.id}
                        opp={opp}
                        onAdvance={() => handleAdvance(opp)}
                        onReject={() => handleReject(opp)}
                        onScore={() => openScore(opp)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rejected */}
        {rejected.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Rejected</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rejected.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opp={opp}
                  onAdvance={() => {}}
                  onReject={() => {}}
                  onScore={() => openScore(opp)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Opportunity Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb size={16} style={{ color: "#7c3aed" }} />
              Add New Opportunity
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Opportunity Title *</label>
              <Input
                placeholder="e.g. Sustainable Packaging for FMCG"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Problem Statement</label>
              <Textarea
                placeholder="What problem does this opportunity address?"
                value={form.problemStatement}
                onChange={e => setForm(f => ({ ...f, problemStatement: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Sector</label>
                <Input
                  placeholder="e.g. Materials / FMCG"
                  value={form.sector}
                  onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Submitted By</label>
                <Input
                  placeholder="Name or team"
                  value={form.submittedBy}
                  onChange={e => setForm(f => ({ ...f, submittedBy: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label>
              <Textarea
                placeholder="Any additional context or strategic notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button
                size="sm"
                style={{ background: "#7c3aed", color: "white" }}
                disabled={!form.title || addMutation.isPending}
                onClick={() => addMutation.mutate(form)}
              >
                {addMutation.isPending ? "Adding..." : "Add Opportunity"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Score Dialog */}
      {showScore && (
        <Dialog open={!!showScore} onOpenChange={() => setShowScore(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 size={16} style={{ color: "#7c3aed" }} />
                Score: {showScore.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <p className="text-xs text-gray-500">Score each dimension 0–10. Total score out of 40 determines pipeline priority.</p>
              {[
                { key: "marketSizeScore", label: "Market Size", icon: TrendingUp, color: "#3b82f6", hint: "How large is the addressable market?" },
                { key: "strategicFitScore", label: "Strategic Fit", icon: Target, color: "#8b5cf6", hint: "How well does this fit EcoRace Studio's portfolio?" },
                { key: "esgAlignmentScore", label: "ESG Alignment", icon: Leaf, color: "#10b981", hint: "How strongly does this align with ESG and B Corp values?" },
                { key: "founderAvailScore", label: "Founder Availability", icon: Users, color: "#f59e0b", hint: "Is a suitable founder available or identifiable?" },
              ].map(({ key, label, icon: Icon, color, hint }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                      <Icon size={12} style={{ color }} />
                      {label}
                    </label>
                    <span className="text-sm font-bold" style={{ color }}>{(scoreForm as any)[key]}/10</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{hint}</p>
                  <input
                    type="range" min={0} max={10} step={1}
                    value={(scoreForm as any)[key]}
                    onChange={e => setScoreForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
                    className="w-full accent-violet-600"
                  />
                </div>
              ))}
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#f5f3ff" }}>
                <span className="text-sm font-semibold text-gray-700">Total Score</span>
                <span className="text-xl font-bold" style={{ color: "#7c3aed" }}>
                  {scoreForm.marketSizeScore + scoreForm.strategicFitScore + scoreForm.esgAlignmentScore + scoreForm.founderAvailScore}/40
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowScore(null)}>Cancel</Button>
                <Button
                  size="sm"
                  style={{ background: "#7c3aed", color: "white" }}
                  disabled={updateScoresMutation.isPending}
                  onClick={() => updateScoresMutation.mutate({ id: showScore.id, ...scoreForm })}
                >
                  {updateScoresMutation.isPending ? "Saving..." : "Save Scores"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
