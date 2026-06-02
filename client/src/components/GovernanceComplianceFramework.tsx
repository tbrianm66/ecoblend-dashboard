/**
 * Governance Compliance Framework
 * Phase 5 Long-Term — Comprehensive compliance audit engine, scoring, and regulatory mapping
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield, CheckCircle2, AlertCircle, Clock, XCircle,
  Plus, ChevronDown, ChevronRight, BarChart3, FileCheck, X, Save,
} from "lucide-react";

const STATUS_CONFIG = {
  "Compliant": { color: "#51AF37", icon: <CheckCircle2 size={13} />, bg: "#51AF3715" },
  "In Progress": { color: "#3A97D3", icon: <Clock size={13} />, bg: "#3A97D315" },
  "Not Started": { color: "#6b7280", icon: <XCircle size={13} />, bg: "#6b728015" },
  "Non-Compliant": { color: "#e53e3e", icon: <AlertCircle size={13} />, bg: "#e53e3e15" },
  "Waived": { color: "#F49C13", icon: <Shield size={13} />, bg: "#F49C1315" },
} as const;

const PRIORITY_COLORS = {
  Critical: "#e53e3e",
  High: "#F49C13",
  Medium: "#3A97D3",
  Low: "#6b7280",
} as const;

const BUILT_IN_FRAMEWORKS = [
  {
    id: "bcorp",
    name: "B Corp Certification",
    shortName: "B Corp",
    category: "Social Enterprise",
    description: "Rigorous social and environmental performance standards for mission-driven companies",
    requirements: [
      { code: "BC-GOV-01", title: "Mission Lock in Governing Documents", priority: "Critical", description: "Mission must be legally protected in articles of incorporation or equivalent" },
      { code: "BC-GOV-02", title: "Stakeholder Governance Model", priority: "High", description: "Governance structure must consider all stakeholders, not just shareholders" },
      { code: "BC-ENV-01", title: "Environmental Policy Documentation", priority: "High", description: "Formal environmental policy with measurable targets" },
      { code: "BC-SOC-01", title: "Employee Ownership or Profit Sharing", priority: "Medium", description: "At least one form of employee financial participation" },
      { code: "BC-SOC-02", title: "Living Wage Commitment", priority: "High", description: "All employees paid at or above living wage for their region" },
      { code: "BC-TRANS-01", title: "Annual Impact Report", priority: "Medium", description: "Publicly available annual report on social and environmental impact" },
    ],
  },
  {
    id: "un-sdg",
    name: "UN Sustainable Development Goals",
    shortName: "UN SDGs",
    category: "International",
    description: "Alignment with the 17 UN Sustainable Development Goals for 2030",
    requirements: [
      { code: "SDG-01", title: "No Poverty Contribution", priority: "Medium", description: "Business activities contribute to poverty reduction" },
      { code: "SDG-08", title: "Decent Work and Economic Growth", priority: "High", description: "Promote sustained, inclusive economic growth and decent work" },
      { code: "SDG-09", title: "Industry Innovation and Infrastructure", priority: "Medium", description: "Build resilient infrastructure and foster innovation" },
      { code: "SDG-10", title: "Reduced Inequalities", priority: "High", description: "Reduce inequality within and among countries" },
      { code: "SDG-13", title: "Climate Action", priority: "Critical", description: "Take urgent action to combat climate change and its impacts" },
      { code: "SDG-17", title: "Partnerships for the Goals", priority: "Medium", description: "Strengthen implementation through global partnerships" },
    ],
  },
  {
    id: "esg",
    name: "ESG Reporting Standards",
    shortName: "ESG",
    category: "Reporting",
    description: "Environmental, Social, and Governance reporting framework for investor transparency",
    requirements: [
      { code: "ESG-E-01", title: "Carbon Footprint Measurement", priority: "Critical", description: "Annual measurement and reporting of Scope 1, 2, and 3 emissions" },
      { code: "ESG-E-02", title: "Net Zero Pathway", priority: "High", description: "Documented pathway to net zero with interim targets" },
      { code: "ESG-S-01", title: "Diversity and Inclusion Metrics", priority: "High", description: "Board and workforce diversity data published annually" },
      { code: "ESG-S-02", title: "Supply Chain Ethics", priority: "Medium", description: "Supply chain audit for labour rights and environmental standards" },
      { code: "ESG-G-01", title: "Board Independence", priority: "High", description: "Minimum 30% independent directors on the board" },
      { code: "ESG-G-02", title: "Executive Compensation Disclosure", priority: "Medium", description: "Transparent disclosure of executive pay ratios" },
    ],
  },
];

export default function GovernanceComplianceFramework({ ventureId }: { ventureId?: string }) {
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [expandedFramework, setExpandedFramework] = useState<string | null>("bcorp");
  const [addingReq, setAddingReq] = useState<{ frameworkId: number; code: string; title: string } | null>(null);
  const [reqForm, setReqForm] = useState({ status: "Not Started", evidence: "", notes: "", owner: "" });

  const frameworksQuery = trpc.governanceCompliance.getFrameworks.useQuery({ ventureId });
  const requirementsQuery = trpc.governanceCompliance.getRequirements.useQuery({
    ventureId,
    frameworkId: undefined,
  });
  const scoreQuery = trpc.governanceCompliance.getComplianceScore.useQuery({ ventureId });

  const utils = trpc.useUtils();
  const upsertFrameworkMutation = trpc.governanceCompliance.upsertFramework.useMutation({
    onSuccess: () => {
      utils.governanceCompliance.getFrameworks.invalidate();
      utils.governanceCompliance.getComplianceScore.invalidate();
      toast.success("Framework activated");
    },
  });
  const upsertReqMutation = trpc.governanceCompliance.upsertRequirement.useMutation({
    onSuccess: () => {
      utils.governanceCompliance.getRequirements.invalidate();
      utils.governanceCompliance.getComplianceScore.invalidate();
      toast.success("Requirement updated");
      setAddingReq(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const frameworks = frameworksQuery.data ?? [];
  const requirements = requirementsQuery.data ?? [];
  const score = scoreQuery.data;

  const getReqsForFramework = (frameworkName: string) => {
    return requirements.filter((r: any) => r.framework_name === frameworkName || r.framework_short_name === frameworkName);
  };

  const activateFramework = (fw: typeof BUILT_IN_FRAMEWORKS[0]) => {
    upsertFrameworkMutation.mutate({
      name: fw.name,
      shortName: fw.shortName,
      category: fw.category,
      description: fw.description,
      totalRequirements: fw.requirements.length,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Score */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Governance Compliance Framework
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Track compliance with B Corp, UN SDGs, ESG standards, and custom governance requirements
          </p>
        </div>
        {score && (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: score.overallScore >= 70 ? "#51AF37" : score.overallScore >= 40 ? "#F49C13" : "#e53e3e", fontFamily: "'Prompt', sans-serif" }}>
                {score.overallScore}%
              </div>
              <div className="text-xs text-gray-400">Overall Compliance</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={11} style={{ color: "#51AF37" }} />
                <span className="text-gray-600">{score.compliant} Compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={11} style={{ color: "#3A97D3" }} />
                <span className="text-gray-600">{score.inProgress} In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle size={11} style={{ color: "#6b7280" }} />
                <span className="text-gray-600">{score.notStarted} Not Started</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle size={11} style={{ color: "#e53e3e" }} />
                <span className="text-gray-600">{score.nonCompliant} Non-Compliant</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Built-in Frameworks */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Compliance Frameworks</h3>
        <div className="flex flex-col gap-3">
          {BUILT_IN_FRAMEWORKS.map((fw) => {
            const isActive = frameworks.some((f: any) => f.name === fw.name || f.short_name === fw.shortName);
            const fwReqs = getReqsForFramework(fw.shortName);
            const compliantCount = fwReqs.filter((r: any) => r.status === "Compliant").length;
            const isExpanded = expandedFramework === fw.id;

            return (
              <div key={fw.id} className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedFramework(isExpanded ? null : fw.id)}
                >
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); setExpandedFramework(isExpanded ? null : fw.id); }}>
                      {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{fw.name}</span>
                        <Badge variant="outline" className="text-xs" style={{ borderColor: "#e5e7eb", color: "#6b7280" }}>
                          {fw.category}
                        </Badge>
                        {isActive && (
                          <Badge className="text-xs" style={{ background: "#51AF3715", color: "#51AF37", border: "1px solid #51AF3740" }}>
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{fw.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isActive && fwReqs.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {compliantCount}/{fwReqs.length} compliant
                      </div>
                    )}
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={(e) => { e.stopPropagation(); activateFramework(fw); }}
                        style={{ borderColor: "#51AF37", color: "#51AF37" }}
                      >
                        <Plus size={11} /> Activate
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "#f3f4f6" }}>
                    <div className="flex flex-col gap-2">
                      {fw.requirements.map((req) => {
                        const tracked = fwReqs.find((r: any) => r.requirement_code === req.code);
                        const status = tracked?.status ?? "Not Started";
                        const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG["Not Started"];
                        const priColor = PRIORITY_COLORS[req.priority as keyof typeof PRIORITY_COLORS] ?? "#6b7280";

                        return (
                          <div key={req.code} className="flex items-start justify-between p-3 rounded-lg" style={{ background: "#f9fafb" }}>
                            <div className="flex items-start gap-3">
                              <span style={{ color: cfg.color, marginTop: 1 }}>{cfg.icon}</span>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-mono text-gray-400">{req.code}</span>
                                  <span className="text-xs font-semibold text-gray-800">{req.title}</span>
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${priColor}15`, color: priColor }}>
                                    {req.priority}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">{req.description}</p>
                                {tracked?.evidence && (
                                  <p className="text-xs text-green-600 mt-1">
                                    <FileCheck size={10} className="inline mr-1" />
                                    {tracked.evidence}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3 shrink-0">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                                {status}
                              </span>
                              {isActive && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-6 px-2"
                                  onClick={() => {
                                    setAddingReq({ frameworkId: frameworks.find((f: any) => f.name === fw.name)?.id ?? 0, code: req.code, title: req.title });
                                    setReqForm({ status: tracked?.status ?? "Not Started", evidence: tracked?.evidence ?? "", notes: tracked?.notes ?? "", owner: tracked?.owner ?? "" });
                                  }}
                                >
                                  Update
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Update Requirement Modal */}
      {addingReq && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Update Compliance Status</h3>
                <p className="text-xs text-gray-500 mt-0.5">{addingReq.code} — {addingReq.title}</p>
              </div>
              <button onClick={() => setAddingReq(null)}>
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: "#e5e7eb" }}
                  value={reqForm.status}
                  onChange={(e) => setReqForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Evidence / Documentation</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: "#e5e7eb" }}
                  placeholder="Link to document or brief description of evidence"
                  value={reqForm.evidence}
                  onChange={(e) => setReqForm(prev => ({ ...prev, evidence: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Owner</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: "#e5e7eb" }}
                  placeholder="Responsible person or team"
                  value={reqForm.owner}
                  onChange={(e) => setReqForm(prev => ({ ...prev, owner: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ borderColor: "#e5e7eb" }}
                  rows={3}
                  placeholder="Additional context or action items"
                  value={reqForm.notes}
                  onChange={(e) => setReqForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={() => setAddingReq(null)}>Cancel</Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  upsertReqMutation.mutate({
                    frameworkId: addingReq.frameworkId,
                    ventureId: ventureId ?? "portfolio",
                    requirementCode: addingReq.code,
                    title: addingReq.title,
                    status: reqForm.status,
                    evidence: reqForm.evidence,
                    owner: reqForm.owner,
                    notes: reqForm.notes,
                  });
                }}
                disabled={upsertReqMutation.isPending}
                style={{ background: "#51AF37" }}
              >
                <Save size={12} /> {upsertReqMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
