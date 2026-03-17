// ============================================================
// OPPORTUNITY PIPELINE
// Intake → Scoring → Approval → Conversion to Venture
// + AI Research Report generation from Problem Statement
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";
import {
  Plus, ChevronRight, TrendingUp, Target, Leaf, Users,
  CheckCircle2, XCircle, ArrowRight, Lightbulb, BarChart3,
  Sparkles, FileText, Loader2, BookOpen, ExternalLink, Zap, AlertTriangle, Edit3,
  GitBranch, Rocket, RefreshCw, LayoutGrid, List,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Identified: { label: "Identified", color: "#6b7280", bg: "#f3f4f6" },
  Scoring:    { label: "Scoring",    color: "#f59e0b", bg: "#fef3c7" },
  Approved:   { label: "Approved",   color: "#10b981", bg: "#d1fae5" },
  Rejected:   { label: "Rejected",   color: "#ef4444", bg: "#fee2e2" },
  Converted:  { label: "Converted",  color: "#3b82f6", bg: "#dbeafe" },
};

const STAGE_ORDER = ["Identified", "Scoring", "Approved", "Converted"];

const RECOMMENDATION_COLORS: Record<string, string> = {
  "Pursue": "#10b981",
  "Investigate Further": "#f59e0b",
  "Park": "#6b7280",
  "Reject": "#ef4444",
};

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

// ── Disruption Radar ─────────────────────────────────────────────────────────
const RADAR_DIMS = [
  { key: "initialMarketSmallness", label: "Small Market", desc: "Targets a niche incumbents ignore" },
  { key: "nonConsumerTargeting",   label: "Non-Consumer", desc: "Serves people who couldn't use existing solutions" },
  { key: "simplicityScore",        label: "Simplicity",   desc: "Simpler/more convenient than incumbents" },
  { key: "lowMarginViability",     label: "Low Margin",   desc: "Can survive on margins incumbents would reject" },
  { key: "incumbentIgnoreScore",   label: "Ignored",      desc: "Rational for incumbents to ignore this" },
] as const;

function DisruptionRadar({ opportunityId }: { opportunityId: number }) {
  const utils = trpc.useUtils();
  const { data: score } = trpc.disruptionScoring.get.useQuery({ opportunityId });
  const upsertMutation = trpc.disruptionScoring.upsert.useMutation({
    onSuccess: () => {
      utils.disruptionScoring.get.invalidate({ opportunityId });
      setEditing(false);
      toast.success("Disruption scores saved");
    },
    onError: () => toast.error("Failed to save"),
  });
  const [editing, setEditing] = useState(false);
  const defaultScores = { initialMarketSmallness: 5, nonConsumerTargeting: 5, simplicityScore: 5, lowMarginViability: 5, incumbentIgnoreScore: 5 };
  const [form, setForm] = useState(defaultScores);

  const hasScore = score && score.disruptionPotentialScore !== null;
  const totalScore = score?.disruptionPotentialScore ?? 0;
  const disruptionLevel = totalScore >= 40 ? "High" : totalScore >= 25 ? "Medium" : "Low";
  const levelColors: Record<string, string> = { High: "#ef4444", Medium: "#f59e0b", Low: "#9ca3af" };
  const levelBg: Record<string, string> = { High: "#fef2f2", Medium: "#fffbeb", Low: "#f9fafb" };

  const radarData = RADAR_DIMS.map(d => ({
    dim: d.label,
    value: score ? (score as any)[d.key] ?? 0 : 0,
    fullMark: 10,
  }));

  if (!hasScore && !editing) {
    return (
      <div className="mt-3 p-3 rounded-lg border border-dashed flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-gray-300" />
          <span className="text-xs text-gray-400">No disruption assessment yet</span>
        </div>
        <Button size="sm" variant="outline" className="gap-1 text-xs h-6" onClick={() => { setForm(defaultScores); setEditing(true); }}>
          <Edit3 size={10} /> Assess
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between" style={{ background: levelBg[disruptionLevel] }}>
        <div className="flex items-center gap-2">
          <Zap size={12} style={{ color: levelColors[disruptionLevel] }} />
          <span className="text-xs font-semibold" style={{ color: levelColors[disruptionLevel] }}>
            Disruption Potential: {disruptionLevel}
          </span>
          <span className="text-xs font-mono text-gray-400">{totalScore}/50</span>
          {score?.autonomousTeamFlagged && (
            <span className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: "#fef3dc", color: "#b45309" }}>
              <AlertTriangle size={9} /> Needs autonomous team
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" className="gap-1 text-xs h-6" onClick={() => {
          setForm({
            initialMarketSmallness: score?.initialMarketSmallness ?? 5,
            nonConsumerTargeting: score?.nonConsumerTargeting ?? 5,
            simplicityScore: score?.simplicityScore ?? 5,
            lowMarginViability: score?.lowMarginViability ?? 5,
            incumbentIgnoreScore: score?.incumbentIgnoreScore ?? 5,
          });
          setEditing(!editing);
        }}>
          <Edit3 size={10} /> {editing ? "Cancel" : "Edit"}
        </Button>
      </div>

      {/* Radar chart */}
      {!editing && (
        <div className="px-3 py-2">
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={radarData} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
              <PolarGrid stroke="#f3f4f6" />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9, fill: "#6b7280" }} />
              <Radar
                name="Disruption"
                dataKey="value"
                stroke={levelColors[disruptionLevel]}
                fill={levelColors[disruptionLevel]}
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-5 gap-1 mt-1">
            {RADAR_DIMS.map(d => (
              <div key={d.key} className="text-center">
                <div className="text-xs font-mono font-bold" style={{ color: levelColors[disruptionLevel] }}>
                  {(score as any)?.[d.key] ?? 0}
                </div>
                <div className="text-gray-400" style={{ fontSize: "0.6rem" }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="px-3 py-3 space-y-2">
          {RADAR_DIMS.map(d => (
            <div key={d.key} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-28 shrink-0">{d.label}</span>
              <input
                type="range" min={0} max={10} step={1}
                value={(form as any)[d.key]}
                onChange={e => setForm(f => ({ ...f, [d.key]: Number(e.target.value) }))}
                className="flex-1 h-1.5 accent-orange-400"
              />
              <span className="text-xs font-mono w-6 text-right text-gray-500">{(form as any)[d.key]}</span>
            </div>
          ))}
          <div className="pt-1 flex gap-2">
            <Button
              size="sm" className="flex-1 h-7 text-xs"
              style={{ background: "#f59e0b", color: "white" }}
              disabled={upsertMutation.isPending}
              onClick={() => upsertMutation.mutate({ opportunityId, ...form })}
            >
              {upsertMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
              Save Assessment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Report Viewer Dialog ──────────────────────────────────────────────────────
function ReportViewerDialog({ report, open, onClose }: { report: any; open: boolean; onClose: () => void }) {
  if (!report) return null;
  const recColor = RECOMMENDATION_COLORS[report.recommendedAction] || "#6b7280";
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText size={16} style={{ color: "#7c3aed" }} />
            {report.title}
          </DialogTitle>
          <div className="flex items-center gap-3 mt-2">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: `${recColor}15`, color: recColor }}
            >
              Recommendation: {report.recommendedAction}
            </span>
            <span className="text-xs text-gray-400">
              Confidence: {report.confidenceScore}/10
            </span>
            <span className="text-xs text-gray-400">
              Generated: {new Date(report.generatedAt).toLocaleDateString("en-GB")}
            </span>
          </div>
        </DialogHeader>
        <div className="mt-4 prose prose-sm max-w-none">
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 mb-4 border-l-4" style={{ borderColor: "#7c3aed" }}>
            <strong className="text-gray-700">Problem Statement:</strong> {report.problemStatement}
          </div>
          <Streamdown>{report.reportContent || "No report content available."}</Streamdown>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Opportunity Card ──────────────────────────────────────────────────────────
function OpportunityCard({
  opp,
  onAdvance,
  onReject,
  onScore,
  onViewReports,
  onGenerateReport,
  reportCount,
  isGenerating,
}: {
  opp: any;
  onAdvance: () => void;
  onReject: () => void;
  onScore: () => void;
  onViewReports: () => void;
  onGenerateReport: () => void;
  reportCount: number;
  isGenerating: boolean;
}) {
  const cfg = STATUS_CONFIG[opp.status] ?? STATUS_CONFIG.Identified;
  const canAdvance = opp.status !== "Approved" && opp.status !== "Rejected" && opp.status !== "Converted";
  const canReject = opp.status !== "Rejected" && opp.status !== "Converted";
  const hasProblemStatement = opp.problemStatement && opp.problemStatement.trim().length > 0;

  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
            {opp.sector && (
              <span className="text-xs text-gray-400 font-mono">{opp.sector}</span>
            )}
            {reportCount > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:opacity-80"
                style={{ background: "#ede9fe", color: "#7c3aed" }}
                onClick={onViewReports}
              >
                <FileText size={9} /> {reportCount} report{reportCount > 1 ? "s" : ""}
              </span>
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

      {/* Disruption Radar — Innovator's Dilemma assessment */}
      <DisruptionRadar opportunityId={opp.id} />

      {opp.notes && (
        <p className="text-xs text-gray-400 italic mb-3 line-clamp-2">{opp.notes}</p>
      )}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={onScore}>
          <BarChart3 size={11} /> Score
        </Button>

        {/* AI Research Report button — only if problem statement exists */}
        {hasProblemStatement && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs h-7"
            style={{ borderColor: "#7c3aed", color: "#7c3aed" }}
            onClick={isGenerating ? undefined : onGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><Loader2 size={11} className="animate-spin" /> Researching...</>
            ) : (
              <><Sparkles size={11} /> AI Research</>
            )}
          </Button>
        )}

        {reportCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs h-7"
            style={{ borderColor: "#6b7280", color: "#6b7280" }}
            onClick={onViewReports}
          >
            <BookOpen size={11} /> View Reports
          </Button>
        )}

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

// ── Reports Panel Dialog ──────────────────────────────────────────────────────
function ReportsPanelDialog({ opp, open, onClose }: { opp: any; open: boolean; onClose: () => void }) {
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const { data: reports = [], isLoading } = trpc.opportunityReports.listForOpportunity.useQuery(
    { opportunityId: opp?.id },
    { enabled: !!opp?.id }
  );
  const utils = trpc.useUtils();
  const deleteReport = trpc.opportunityReports.delete.useMutation({
    onSuccess: () => { utils.opportunityReports.listForOpportunity.invalidate({ opportunityId: opp.id }); toast.success("Report deleted"); },
  });

  if (!opp) return null;
  return (
    <>
      <Dialog open={open && !selectedReport} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen size={16} style={{ color: "#7c3aed" }} />
              Research Reports — {opp.title}
            </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="py-8 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              <FileText size={32} className="mx-auto mb-2 text-gray-200" />
              No reports yet. Click "AI Research" on the opportunity card to generate one.
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {reports.map((r: any) => {
                const recColor = RECOMMENDATION_COLORS[r.recommendedAction] || "#6b7280";
                return (
                  <div key={r.id} className="border rounded-xl p-4 bg-gray-50" style={{ borderColor: "#e5e7eb" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 mb-1">{r.title}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${recColor}15`, color: recColor }}>
                            {r.recommendedAction}
                          </span>
                          <span className="text-xs text-gray-400">Confidence: {r.confidenceScore}/10</span>
                          <span className="text-xs text-gray-400">{new Date(r.generatedAt).toLocaleDateString("en-GB")}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteReport.mutate({ id: r.id })}
                        className="text-gray-300 hover:text-red-400 transition-colors ml-2 p-1"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                    {r.keyInsights && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{r.keyInsights.replace(/^#+\s*/gm, "").slice(0, 200)}...</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-7"
                      onClick={() => setSelectedReport(r)}
                    >
                      <ExternalLink size={11} /> Read Full Report
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedReport && (
        <ReportViewerDialog
          report={selectedReport}
          open={!!selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </>
  );
}

// ── Pipeline Kanban Stage config ─────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: "Identified",          label: "Identified",          icon: Lightbulb,     color: "#6b7280", bg: "#6b728010", desc: "Opportunity logged, no matches yet" },
  { key: "Matched",             label: "Matched",             icon: Users,         color: "#3A97D3", bg: "#3A97D310", desc: "Founders matched to this opportunity" },
  { key: "Spin-Off Configured", label: "Spin-Off Configured", icon: GitBranch,     color: "#F49C13", bg: "#F49C1310", desc: "Spin-Off OS configuration created" },
  { key: "Approved",            label: "Approved",            icon: CheckCircle2,  color: "#8b5cf6", bg: "#8b5cf610", desc: "Configuration approved by VBS team" },
  { key: "Launched",            label: "Launched",            icon: Rocket,        color: "#51AF37", bg: "#51AF3710", desc: "Live venture created in portfolio" },
] as const;

type PipelineStageKey = typeof PIPELINE_STAGES[number]["key"];

type PipelineKanbanItem = {
  id: number;
  name: string;
  sector: string;
  status: string;
  description: string;
  matchCount: number;
  spinoffConfigId: number | null;
  spinoffStatus: string | null;
  convertedToVentureId: string | null;
  stage: PipelineStageKey;
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OpportunityPipeline() {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const { data: opps = [], isLoading } = trpc.opportunities.list.useQuery();
  const [viewMode, setViewMode] = useState<"intake" | "pipeline">("intake");
  const pipelineQuery = trpc.matching.getPipelineView.useQuery(undefined, { enabled: viewMode === "pipeline" });

  const [showAdd, setShowAdd] = useState(false);
  const [showScore, setShowScore] = useState<any | null>(null);
  const [showReports, setShowReports] = useState<any | null>(null);
  const [generatingReportFor, setGeneratingReportFor] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", problemStatement: "", sector: "", submittedBy: "", notes: "" });
  const [scoreForm, setScoreForm] = useState({ marketSizeScore: 5, strategicFitScore: 5, esgAlignmentScore: 5, founderAvailScore: 5 });

  const addMutation = trpc.opportunities.add.useMutation({
    onSuccess: () => {
      utils.opportunities.list.invalidate();
      setShowAdd(false);
      setForm({ title: "", problemStatement: "", sector: "", submittedBy: "", notes: "" });
      toast.success("Opportunity added");
    },
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

  const generateReportMutation = trpc.opportunityReports.generate.useMutation({
    onSuccess: (res) => {
      setGeneratingReportFor(null);
      toast.success("AI research report generated successfully");
      utils.opportunityReports.listForOpportunity.invalidate();
    },
    onError: () => {
      setGeneratingReportFor(null);
      toast.error("Report generation failed — please try again");
    },
  });

  // Fetch report counts for all opportunities
  const { data: allReportCounts = {} } = trpc.opportunityReports.listForOpportunity.useQuery(
    { opportunityId: -1 },
    { enabled: false }
  );

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

  const handleGenerateReport = (opp: any) => {
    if (!opp.problemStatement || opp.problemStatement.trim().length < 20) {
      toast.error("Please add a problem statement of at least 20 characters to generate a report");
      return;
    }
    setGeneratingReportFor(opp.id);
    generateReportMutation.mutate({
      opportunityId: opp.id,
      title: opp.title,
      problemStatement: opp.problemStatement,
      sector: opp.sector || undefined,
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
              Add a problem statement to unlock AI-powered commercial research reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors"
                style={viewMode === "intake" ? { background: "#7c3aed", color: "white" } : { background: "white", color: "#6b7280" }}
                onClick={() => setViewMode("intake")}
              >
                <List size={12} /> Intake
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors"
                style={viewMode === "pipeline" ? { background: "#51AF37", color: "white" } : { background: "white", color: "#6b7280" }}
                onClick={() => setViewMode("pipeline")}
              >
                <LayoutGrid size={12} /> Pipeline Map
              </button>
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
        {/* ── Pipeline Map (Kanban) view ── */}
        {viewMode === "pipeline" && (
          <div>
            {/* Progress bar */}
            <div className="mb-6 bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pipeline Flow</span>
                <Button
                  size="sm" variant="outline" className="ml-auto gap-1 text-xs h-6"
                  style={{ borderColor: "#3A97D3", color: "#3A97D3" }}
                  onClick={() => pipelineQuery.refetch()}
                  disabled={pipelineQuery.isFetching}
                >
                  <RefreshCw size={11} className={pipelineQuery.isFetching ? "animate-spin" : ""} /> Refresh
                </Button>
              </div>
              {pipelineQuery.data && (() => {
                const total = pipelineQuery.data.columns.reduce((s, c) => s + c.items.length, 0);
                return (
                  <>
                    <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                      {PIPELINE_STAGES.map(stage => {
                        const col = pipelineQuery.data!.columns.find(c => c.stage === stage.key);
                        const count = col?.items.length ?? 0;
                        const width = total > 0 ? (count / total) * 100 : 0;
                        return width > 0 ? (
                          <div key={stage.key} className="h-full" style={{ width: `${width}%`, background: stage.color, minWidth: 4 }}
                            title={`${stage.label}: ${count}`} />
                        ) : null;
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {PIPELINE_STAGES.map(stage => {
                        const col = pipelineQuery.data!.columns.find(c => c.stage === stage.key);
                        const count = col?.items.length ?? 0;
                        const Icon = stage.icon;
                        return (
                          <span key={stage.key} className="flex items-center gap-1 text-xs text-gray-500">
                            <Icon size={10} style={{ color: stage.color }} />
                            {stage.label}: <strong>{count}</strong>
                          </span>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
            {/* Kanban columns */}
            {pipelineQuery.isLoading ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm"><Loader2 size={16} className="animate-spin mr-2" /> Loading pipeline…</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4" style={{ alignItems: "flex-start" }}>
                {PIPELINE_STAGES.map(stage => {
                  const col = pipelineQuery.data?.columns.find(c => c.stage === stage.key);
                  const items = (col?.items ?? []) as PipelineKanbanItem[];
                  const Icon = stage.icon;
                  return (
                    <div key={stage.key} className="flex flex-col" style={{ minWidth: 220, maxWidth: 280, flex: "1 1 220px" }}>
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
                        style={{ background: stage.bg, border: `1px solid ${stage.color}25` }}>
                        <Icon size={14} style={{ color: stage.color }} />
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: stage.color }}>{stage.label}</span>
                        <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: stage.color, color: "#fff" }}>{items.length}</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {items.length === 0 ? (
                          <div className="rounded-xl border-2 border-dashed p-4 text-center" style={{ borderColor: `${stage.color}30` }}>
                            <p className="text-xs text-gray-400">{stage.desc}</p>
                          </div>
                        ) : items.map(item => (
                          <div key={item.id}
                            className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
                            style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${stage.color}` }}
                            onClick={() => {
                              if (item.convertedToVentureId) navigate(`/venture/${item.convertedToVentureId}`);
                              else if (item.spinoffConfigId) navigate(`/spinoff?configId=${item.spinoffConfigId}`);
                              else if (item.matchCount > 0) navigate(`/matching?oppId=${item.id}`);
                              else navigate(`/poi?id=${item.id}`);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-sm font-bold text-gray-900 leading-tight" style={{ fontFamily: "'Prompt', sans-serif" }}>{item.name}</h4>
                              <ExternalLink size={12} className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5" />
                            </div>
                            {item.sector && (
                              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2"
                                style={{ background: `${stage.color}15`, color: stage.color }}>{item.sector}</span>
                            )}
                            {item.description && (
                              <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.matchCount > 0 && (
                                <span className="flex items-center gap-1 text-xs text-gray-500"><Users size={10} /> {item.matchCount} match{item.matchCount !== 1 ? "es" : ""}</span>
                              )}
                              {item.spinoffConfigId && (
                                <span className="flex items-center gap-1 text-xs text-gray-500"><GitBranch size={10} /> Config #{item.spinoffConfigId}</span>
                              )}
                              {item.convertedToVentureId && (
                                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#51AF37" }}><Rocket size={10} /> {item.convertedToVentureId}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Intake view (original) ── */}
        {viewMode === "intake" && <>
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
                      <OppCardWithReports
                        key={opp.id}
                        opp={opp}
                        onAdvance={() => handleAdvance(opp)}
                        onReject={() => handleReject(opp)}
                        onScore={() => openScore(opp)}
                        onGenerateReport={() => handleGenerateReport(opp)}
                        onViewReports={() => setShowReports(opp)}
                        isGenerating={generatingReportFor === opp.id}
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
                <OppCardWithReports
                  key={opp.id}
                  opp={opp}
                  onAdvance={() => {}}
                  onReject={() => {}}
                  onScore={() => openScore(opp)}
                  onGenerateReport={() => handleGenerateReport(opp)}
                  onViewReports={() => setShowReports(opp)}
                  isGenerating={generatingReportFor === opp.id}
                />
              ))}
            </div>
          </div>
        )}
        </> /* end intake view */}
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
              <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1.5">
                Problem Statement
                <span className="text-xs font-normal text-gray-400 flex items-center gap-1">
                  <Sparkles size={10} style={{ color: "#7c3aed" }} />
                  Required for AI research report
                </span>
              </label>
              <Textarea
                placeholder="Describe the problem this opportunity addresses in detail. Include the target market, scale of the problem, current solutions and their shortcomings, and why now is the right time. The more detail you provide, the richer the AI research report will be."
                value={form.problemStatement}
                onChange={e => setForm(f => ({ ...f, problemStatement: e.target.value }))}
                rows={5}
              />
              {form.problemStatement.length > 0 && form.problemStatement.length < 20 && (
                <p className="text-xs text-amber-500 mt-1">Add at least 20 characters to enable AI research</p>
              )}
              {form.problemStatement.length >= 20 && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={10} /> AI research report will be available after saving
                </p>
              )}
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

      {/* Reports Panel Dialog */}
      {showReports && (
        <ReportsPanelDialog
          opp={showReports}
          open={!!showReports}
          onClose={() => setShowReports(null)}
        />
      )}
    </div>
  );
}

// ── Wrapper to fetch report count per opportunity ─────────────────────────────
function OppCardWithReports({
  opp,
  onAdvance,
  onReject,
  onScore,
  onGenerateReport,
  onViewReports,
  isGenerating,
}: {
  opp: any;
  onAdvance: () => void;
  onReject: () => void;
  onScore: () => void;
  onGenerateReport: () => void;
  onViewReports: () => void;
  isGenerating: boolean;
}) {
  const { data: reports = [] } = trpc.opportunityReports.listForOpportunity.useQuery(
    { opportunityId: opp.id },
    { staleTime: 30_000 }
  );
  return (
    <OpportunityCard
      opp={opp}
      onAdvance={onAdvance}
      onReject={onReject}
      onScore={onScore}
      onGenerateReport={onGenerateReport}
      onViewReports={onViewReports}
      reportCount={reports.length}
      isGenerating={isGenerating}
    />
  );
}
