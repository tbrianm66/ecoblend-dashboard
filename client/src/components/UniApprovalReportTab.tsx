// ============================================================
// UNIVERSITY APPROVAL REPORT TAB
// Sprint 62 — H4 Lean Methodology Dual-Risk Model
// Formal approval documents for university/lecturer sign-off
// Linked to offerings, portfolios, research, and validation evidence
// ============================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  FileText, Plus, Sparkles, CheckCircle2, Clock, AlertCircle,
  XCircle, RotateCcw, Eye, Pencil, Trash2, ChevronRight,
  GraduationCap, BookOpen, Building2, BarChart3, Shield, Lightbulb,
  ArrowRight,
} from "lucide-react";

type VentureId = string;

// ── Status helpers ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    draft:              { bg: "bg-gray-100", text: "text-gray-600", icon: <Clock size={11} /> },
    under_review:       { bg: "bg-blue-100", text: "text-blue-700", icon: <Clock size={11} /> },
    approved:           { bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle2 size={11} /> },
    rejected:           { bg: "bg-red-100", text: "text-red-700", icon: <XCircle size={11} /> },
    revision_requested: { bg: "bg-orange-100", text: "text-orange-700", icon: <RotateCcw size={11} /> },
    archived:           { bg: "bg-gray-100", text: "text-gray-400", icon: <AlertCircle size={11} /> },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      {s.icon}
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ReportTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    syllabus_approval: "Syllabus Approval",
    research_validation: "Research Validation",
    industry_engagement: "Industry Engagement",
    ethics_clearance: "Ethics Clearance",
    ip_disclosure: "IP Disclosure",
    commercialisation_approval: "Commercialisation",
  };
  const colors: Record<string, string> = {
    syllabus_approval: "bg-purple-100 text-purple-700",
    research_validation: "bg-blue-100 text-blue-700",
    industry_engagement: "bg-teal-100 text-teal-700",
    ethics_clearance: "bg-orange-100 text-orange-700",
    ip_disclosure: "bg-yellow-100 text-yellow-700",
    commercialisation_approval: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[type] ?? "bg-gray-100 text-gray-500"}`}>
      {labels[type] ?? type}
    </span>
  );
}

function H4StageBadge({ stage }: { stage: string | null }) {
  if (!stage) return null;
  const labels: Record<string, string> = {
    problem_definition: "H4.1 Problem",
    research_discovery: "H4.2 Research",
    hypothesis_development: "H4.3 Hypothesis",
    validation: "H4.4 Validation",
    commercialisation: "H4.5 Commercialise",
  };
  return (
    <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">
      {labels[stage] ?? stage}
    </span>
  );
}

// ── Summary Cards ─────────────────────────────────────────────────────────────
function SummaryCards({ ventureId }: { ventureId: VentureId }) {
  const { data: summary } = trpc.uniApprovalReport.getSummary.useQuery({ ventureId });
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[
        { label: "Total Reports", value: summary.total, icon: FileText, color: "#3A97D3" },
        { label: "Approved", value: summary.approved, icon: CheckCircle2, color: "#51AF37" },
        { label: "Under Review", value: summary.underReview, icon: Clock, color: "#F49C13" },
        { label: "Approval Rate", value: `${summary.approvalRate}%`, icon: BarChart3, color: "#8B5CF6" },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</div>
            <div className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AI Generate Dialog ─────────────────────────────────────────────────────────
function AIGenerateDialog({ ventureId, onSuccess }: { ventureId: VentureId; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<string>("syllabus_approval");
  const [h4Stage, setH4Stage] = useState<string>("problem_definition");
  const [offeringId, setOfferingId] = useState<string>("");
  const [portfolioId, setPortfolioId] = useState<string>("");

  const { data: portfolios } = trpc.portfoliosOfferings.portfolios.list.useQuery({ ventureId });
  const { data: offerings } = trpc.portfoliosOfferings.offerings.list.useQuery(
    { portfolioId: portfolioId || "" },
    { enabled: !!portfolioId }
  );
  const { data: research } = trpc.uniResearch.list.useQuery({ ventureId });

  const generateAI = trpc.uniApprovalReport.generateAI.useMutation({
    onSuccess: (data) => {
      toast.success(`AI report generated: "${data.title}"`);
      setOpen(false);
      onSuccess();
    },
    onError: (e) => toast.error(`Generation failed: ${e.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#8B5CF6", color: "white" }}>
          <Sparkles size={13} /> AI Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-600" />
            AI-Generate Approval Report
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-purple-50 rounded-lg p-3 text-xs text-purple-700 border border-purple-100">
            <strong>H4 Dual-Risk Model:</strong> The AI will generate a structured report scoped to the selected offering, pulling in research projects, validation experiments, and university partners automatically.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="syllabus_approval">Syllabus Approval</SelectItem>
                  <SelectItem value="research_validation">Research Validation</SelectItem>
                  <SelectItem value="industry_engagement">Industry Engagement</SelectItem>
                  <SelectItem value="ethics_clearance">Ethics Clearance</SelectItem>
                  <SelectItem value="ip_disclosure">IP Disclosure</SelectItem>
                  <SelectItem value="commercialisation_approval">Commercialisation Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">H4 Stage</Label>
              <Select value={h4Stage} onValueChange={setH4Stage}>
                <SelectTrigger className="text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="problem_definition">1. Problem Definition</SelectItem>
                  <SelectItem value="research_discovery">2. Research & Discovery</SelectItem>
                  <SelectItem value="hypothesis_development">3. Hypothesis Development</SelectItem>
                  <SelectItem value="validation">4. Validation</SelectItem>
                  <SelectItem value="commercialisation">5. Commercialisation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Portfolio (optional)</Label>
            <Select value={portfolioId} onValueChange={(v) => { setPortfolioId(v); setOfferingId(""); }}>
              <SelectTrigger className="text-xs mt-1">
                <SelectValue placeholder="All portfolios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All portfolios</SelectItem>
                {portfolios?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {portfolioId && (
            <div>
              <Label className="text-xs">Offering (optional)</Label>
              <Select value={offeringId} onValueChange={setOfferingId}>
                <SelectTrigger className="text-xs mt-1">
                  <SelectValue placeholder="All offerings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All offerings</SelectItem>
                  {offerings?.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="text-xs text-gray-500">
            {research && research.length > 0
              ? `${research.length} research project(s) will be included automatically.`
              : "No research projects found — the AI will generate objectives from venture context."}
          </div>

          <Button
            className="w-full gap-2"
            style={{ background: "#8B5CF6", color: "white" }}
            disabled={generateAI.isPending}
            onClick={() => generateAI.mutate({
              ventureId,
              offeringId: offeringId || undefined,
              portfolioId: portfolioId || undefined,
              reportType: reportType as any,
              h4Stage: h4Stage as any,
            })}
          >
            {generateAI.isPending ? (
              <><span className="animate-spin inline-block">⟳</span> Generating Report...</>
            ) : (
              <><Sparkles size={14} /> Generate AI Report</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Report View Dialog ─────────────────────────────────────────────────────────
function ReportViewDialog({ reportId, onClose }: { reportId: number; onClose: () => void }) {
  const { data: report } = trpc.uniApprovalReport.get.useQuery({ id: reportId });
  const updateStatus = trpc.uniApprovalReport.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); onClose(); },
  });

  if (!report) return null;

  const sections = [
    { label: "Executive Summary", icon: FileText, content: report.executiveSummary },
    { label: "Problem Statement", icon: Lightbulb, content: report.problemStatement },
    { label: "Research Objectives", icon: BookOpen, content: report.researchObjectives },
    { label: "Methodology", icon: BarChart3, content: report.methodology },
    { label: "Validation Evidence", icon: CheckCircle2, content: report.validationEvidence },
    { label: "Academic Contribution", icon: GraduationCap, content: report.academicContribution },
    { label: "Commercial Potential", icon: ArrowRight, content: report.commercialPotential },
    { label: "Ethics Statement", icon: Shield, content: report.ethicsStatement },
    { label: "IP Statement", icon: Building2, content: report.ipStatement },
    { label: "Recommendations", icon: CheckCircle2, content: report.recommendations },
  ].filter(s => s.content);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between gap-4" style={{ background: "linear-gradient(135deg, #1a2332 0%, #2d3f5c 100%)" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <ReportTypeBadge type={report.reportType} />
              <StatusBadge status={report.status} />
              {report.h4Stage && <H4StageBadge stage={report.h4Stage} />}
              {report.aiGenerated && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 flex items-center gap-1">
                  <Sparkles size={10} /> AI Generated
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white truncate" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {report.title}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              {report.offeringData && <span>Offering: <strong className="text-gray-300">{report.offeringData.name}</strong></span>}
              {report.portfolioData && <span>Portfolio: <strong className="text-gray-300">{report.portfolioData.name}</strong></span>}
              {report.vrlStage && <span>VRL {report.vrlStage}</span>}
              {report.trlLevel && <span>TRL {report.trlLevel}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none mt-1">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Dual Risk Model Banner */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-lg p-3 border" style={{ background: "#51AF3710", borderColor: "#51AF3730" }}>
              <div className="text-xs font-semibold text-gray-500 mb-0.5">Product Risk Owner</div>
              <div className="text-sm font-bold text-gray-800">{report.productRiskOwner ?? "Founder"}</div>
              <div className="text-xs text-gray-400 mt-0.5">Technology · Engineering · Product</div>
            </div>
            <div className="rounded-lg p-3 border" style={{ background: "#3A97D310", borderColor: "#3A97D330" }}>
              <div className="text-xs font-semibold text-gray-500 mb-0.5">Business Risk Owner</div>
              <div className="text-sm font-bold text-gray-800">{report.businessRiskOwner ?? "University Partner"}</div>
              <div className="text-xs text-gray-400 mt-0.5">Market · Strategy · Commercialisation</div>
            </div>
          </div>

          {/* AI Full Content or Sections */}
          {report.aiGenerated && report.aiContent ? (
            <div className="prose prose-sm max-w-none">
              <Streamdown>{report.aiContent}</Streamdown>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map(({ label, icon: Icon, content }) => (
                <div key={label} className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className="text-gray-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Linked Research */}
          {report.linkedResearch && report.linkedResearch.length > 0 && (
            <div className="mt-4 rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Linked Research Projects</span>
              </div>
              <div className="space-y-2">
                {report.linkedResearch.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="font-medium text-gray-800">{r.title}</span>
                    <span className="text-gray-400 text-xs">({r.researchType})</span>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Notes */}
          {report.reviewNotes && (
            <div className="mt-4 rounded-xl border border-orange-200 p-4 bg-orange-50">
              <div className="text-xs font-semibold text-orange-600 mb-1">Review Notes</div>
              <p className="text-sm text-orange-800">{report.reviewNotes}</p>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            {report.submittedAt && <span>Submitted: {new Date(report.submittedAt).toLocaleDateString("en-GB")}</span>}
            {report.approvedAt && <span className="ml-3">Approved: {new Date(report.approvedAt).toLocaleDateString("en-GB")}</span>}
          </div>
          <div className="flex items-center gap-2">
            {report.status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1"
                onClick={() => updateStatus.mutate({ id: report.id, status: "under_review" })}
              >
                <ArrowRight size={12} /> Submit for Review
              </Button>
            )}
            {report.status === "under_review" && (
              <>
                <Button
                  size="sm"
                  className="text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => updateStatus.mutate({ id: report.id, status: "approved", approvedBy: "Reviewer" })}
                >
                  <CheckCircle2 size={12} /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1 text-red-600 border-red-200"
                  onClick={() => updateStatus.mutate({ id: report.id, status: "revision_requested" })}
                >
                  <RotateCcw size={12} /> Request Revision
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create Report Dialog ───────────────────────────────────────────────────────
function CreateReportDialog({ ventureId, onSuccess }: { ventureId: VentureId; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    reportType: "syllabus_approval",
    h4Stage: "problem_definition",
    offeringId: "",
    portfolioId: "",
    productRiskOwner: "",
    businessRiskOwner: "",
    executiveSummary: "",
    problemStatement: "",
    recommendations: "",
  });

  const { data: portfolios } = trpc.portfoliosOfferings.portfolios.list.useQuery({ ventureId });
  const { data: offerings } = trpc.portfoliosOfferings.offerings.list.useQuery(
    { portfolioId: form.portfolioId || "" },
    { enabled: !!form.portfolioId }
  );

  const upsert = trpc.uniApprovalReport.upsert.useMutation({
    onSuccess: () => { toast.success("Report created"); setOpen(false); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
          <Plus size={13} /> New Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Approval Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Report Title *</Label>
            <Input
              className="text-xs mt-1"
              placeholder="e.g. EcoBlend Biomaterials — Syllabus Approval H4.2"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Report Type</Label>
              <Select value={form.reportType} onValueChange={v => setForm(f => ({ ...f, reportType: v }))}>
                <SelectTrigger className="text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="syllabus_approval">Syllabus Approval</SelectItem>
                  <SelectItem value="research_validation">Research Validation</SelectItem>
                  <SelectItem value="industry_engagement">Industry Engagement</SelectItem>
                  <SelectItem value="ethics_clearance">Ethics Clearance</SelectItem>
                  <SelectItem value="ip_disclosure">IP Disclosure</SelectItem>
                  <SelectItem value="commercialisation_approval">Commercialisation Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">H4 Stage</Label>
              <Select value={form.h4Stage} onValueChange={v => setForm(f => ({ ...f, h4Stage: v }))}>
                <SelectTrigger className="text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="problem_definition">1. Problem Definition</SelectItem>
                  <SelectItem value="research_discovery">2. Research & Discovery</SelectItem>
                  <SelectItem value="hypothesis_development">3. Hypothesis Development</SelectItem>
                  <SelectItem value="validation">4. Validation</SelectItem>
                  <SelectItem value="commercialisation">5. Commercialisation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Portfolio</Label>
            <Select value={form.portfolioId} onValueChange={v => setForm(f => ({ ...f, portfolioId: v, offeringId: "" }))}>
              <SelectTrigger className="text-xs mt-1"><SelectValue placeholder="Select portfolio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {portfolios?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.portfolioId && (
            <div>
              <Label className="text-xs">Offering</Label>
              <Select value={form.offeringId} onValueChange={v => setForm(f => ({ ...f, offeringId: v }))}>
                <SelectTrigger className="text-xs mt-1"><SelectValue placeholder="Select offering" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {offerings?.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Product Risk Owner</Label>
              <Input className="text-xs mt-1" placeholder="Founder name" value={form.productRiskOwner} onChange={e => setForm(f => ({ ...f, productRiskOwner: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Business Risk Owner</Label>
              <Input className="text-xs mt-1" placeholder="University contact" value={form.businessRiskOwner} onChange={e => setForm(f => ({ ...f, businessRiskOwner: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Executive Summary</Label>
            <Textarea className="text-xs mt-1 min-h-[80px]" placeholder="Brief overview of the approval request..." value={form.executiveSummary} onChange={e => setForm(f => ({ ...f, executiveSummary: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Problem Statement</Label>
            <Textarea className="text-xs mt-1 min-h-[60px]" placeholder="What problem does this venture/offering address?" value={form.problemStatement} onChange={e => setForm(f => ({ ...f, problemStatement: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Recommendations</Label>
            <Textarea className="text-xs mt-1 min-h-[60px]" placeholder="Recommendations for approval..." value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} />
          </div>
          <Button
            className="w-full"
            disabled={!form.title || upsert.isPending}
            onClick={() => upsert.mutate({
              ventureId,
              title: form.title,
              reportType: form.reportType as any,
              h4Stage: form.h4Stage as any,
              offeringId: form.offeringId || undefined,
              portfolioId: form.portfolioId || undefined,
              productRiskOwner: form.productRiskOwner || undefined,
              businessRiskOwner: form.businessRiskOwner || undefined,
              executiveSummary: form.executiveSummary || undefined,
              problemStatement: form.problemStatement || undefined,
              recommendations: form.recommendations || undefined,
            })}
          >
            {upsert.isPending ? "Creating..." : "Create Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Report Card ────────────────────────────────────────────────────────────────
function ReportCard({
  report,
  onView,
  onDelete,
}: {
  report: any;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={onView}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <ReportTypeBadge type={report.reportType} />
            <StatusBadge status={report.status} />
            {report.h4Stage && <H4StageBadge stage={report.h4Stage} />}
            {report.aiGenerated && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 flex items-center gap-0.5">
                <Sparkles size={9} /> AI
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: "'Prompt', sans-serif" }}>
            {report.title}
          </h3>
          {report.executiveSummary && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{report.executiveSummary}</p>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
        >
          <Trash2 size={12} className="text-red-400" />
        </button>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        {report.productRiskOwner && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {report.productRiskOwner}
          </span>
        )}
        {report.businessRiskOwner && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            {report.businessRiskOwner}
          </span>
        )}
        <span className="ml-auto">{new Date(report.createdAt).toLocaleDateString("en-GB")}</span>
        <ChevronRight size={12} className="text-gray-300" />
      </div>
    </div>
  );
}

// ── Main Tab Component ─────────────────────────────────────────────────────────
export default function UniApprovalReportTab({ ventureId }: { ventureId: VentureId }) {
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: reports, refetch } = trpc.uniApprovalReport.list.useQuery({ ventureId });
  const deleteReport = trpc.uniApprovalReport.delete.useMutation({
    onSuccess: () => { toast.success("Report deleted"); refetch(); },
  });

  const filtered = (reports ?? []).filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterType !== "all" && r.reportType !== filterType) return false;
    return true;
  });

  return (
    <div>
      <SummaryCards ventureId={ventureId} />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 text-xs h-8">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="revision_requested">Revision Requested</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44 text-xs h-8">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="syllabus_approval">Syllabus Approval</SelectItem>
              <SelectItem value="research_validation">Research Validation</SelectItem>
              <SelectItem value="industry_engagement">Industry Engagement</SelectItem>
              <SelectItem value="ethics_clearance">Ethics Clearance</SelectItem>
              <SelectItem value="ip_disclosure">IP Disclosure</SelectItem>
              <SelectItem value="commercialisation_approval">Commercialisation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <CreateReportDialog ventureId={ventureId} onSuccess={refetch} />
          <AIGenerateDialog ventureId={ventureId} onSuccess={refetch} />
        </div>
      </div>

      {/* H4 Dual Risk Model Info Banner */}
      <div className="rounded-xl border p-4 mb-5 bg-gradient-to-r from-gray-50 to-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800 mb-1">H4 Lean Methodology — Dual Risk Model</div>
            <div className="text-xs text-gray-600">
              Approval reports formalise the university's role in managing <strong>business risk</strong> (market, strategy, commercialisation) while founders manage <strong>product risk</strong> (technology, engineering). Each report is scoped to a specific offering and H4 stage, providing evidence-based validation for academic sign-off.
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1 text-green-700"><span className="w-2 h-2 rounded-full bg-green-400" /> Product Risk → Founder</span>
              <span className="flex items-center gap-1 text-blue-700"><span className="w-2 h-2 rounded-full bg-blue-400" /> Business Risk → University</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No approval reports yet</p>
          <p className="text-xs mt-1">Create a manual report or use AI Generate to draft one automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onView={() => setViewingId(report.id)}
              onDelete={() => {
                if (confirm("Delete this report?")) deleteReport.mutate({ id: report.id });
              }}
            />
          ))}
        </div>
      )}

      {/* View Dialog */}
      {viewingId !== null && (
        <ReportViewDialog reportId={viewingId} onClose={() => { setViewingId(null); refetch(); }} />
      )}
    </div>
  );
}
