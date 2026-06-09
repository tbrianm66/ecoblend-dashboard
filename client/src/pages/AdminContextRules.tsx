/**
 * Admin Context Rule Builder
 *
 * Full CRUD for playbook context rules with:
 * - Rule list table with edit/duplicate/activate/deactivate/delete
 * - Create/Edit form with all field selectors (4 tabs)
 * - Filter and search by module, playbook, priority, active status
 * - Rule Preview panel showing plain English description
 * - Form validation (rule name, playbook, module required)
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Filter,
  BookOpen,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ─── Constants ───
const MODULES = [
  "Command Centre", "Venture Intake", "Discovery & Market", "Validation Lab",
  "Readiness Scoring", "R&D Hub", "Risk Intelligence", "Investment Pack",
  "Governance", "Execution Planning", "Supply Chain", "ESG & Impact",
  "Knowledge Base", "Coaching Studio", "Academic Research", "Admin",
];

const PRIORITIES = ["High", "Medium", "Low"] as const;

const VENTURE_STAGES = ["ALL", "VRL 1", "VRL 2", "VRL 3", "VRL 4", "VRL 5", "VRL 6", "VRL 7", "VRL 8", "VRL 9"];
const VENTURE_TYPES = ["ALL", "Product", "Service", "Platform", "Marketplace", "R&D"];
const SPV_BRANDS = ["ALL", "EcoBlend", "BEBUS", "TONE", "REAL", "PIPE"];
const WORKFLOW_STAGES = ["ALL", "Intake", "Discovery", "Validation", "Scoring", "R&D", "Risk", "Investment", "Governance", "Execution"];
const RD_STAGES = ["Concept", "Simulation", "Prototype", "Pilot"];
const RISK_CATEGORIES = ["Market", "Technology", "Financial", "Operational", "Regulatory", "Strategic"];
const SCORING_FRAMEWORKS = ["VRL", "TRL", "BRL", "MRL", "PRL", "FRL", "CRL", "IRL", "SRL"];
const EVIDENCE_TYPES = ["Interview", "Survey", "Experiment", "Financial", "Market Data", "Academic Paper", "Expert Review"];
const ACCESS_LEVELS = ["Admin Only", "Internal Team", "Venture Team", "Advisor Access", "Academic Partner Access", "Investor View"];

const priorityColor: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#6b7280",
};

// ─── Rule Preview Generator ───
function generateRulePreview(rule: any, playbookTitle?: string): string {
  const parts: string[] = [];
  parts.push(`Show "${playbookTitle || rule.ruleName || "playbook"}" in ${rule.module || "all modules"}`);
  if (rule.workflowStage && rule.workflowStage !== "ALL") parts.push(`during ${rule.workflowStage} stage`);
  if (rule.ventureStage && rule.ventureStage !== "ALL") parts.push(`for ventures at ${rule.ventureStage}`);
  if (rule.ventureType && rule.ventureType !== "ALL") parts.push(`of type ${rule.ventureType}`);
  if (rule.spvBrand && rule.spvBrand !== "ALL") parts.push(`under ${rule.spvBrand} brand`);
  if (rule.userRoles) parts.push(`visible to ${rule.userRoles}`);
  if (rule.riskCategories) parts.push(`when ${rule.riskCategories} risks are present`);
  if (rule.scoringFrameworks) parts.push(`linked to ${rule.scoringFrameworks} scoring`);
  if (rule.missingEvidenceTrigger) parts.push(`triggered when ${rule.missingEvidenceTrigger} evidence is missing`);
  if (rule.scoreThresholdTrigger) parts.push(`when score drops below ${rule.scoreThresholdTrigger}`);
  if (rule.riskThresholdTrigger) parts.push(`when risk exceeds ${rule.riskThresholdTrigger}`);
  if (rule.rdStageTrigger) parts.push(`at R&D stage ${rule.rdStageTrigger}`);
  parts.push(`with ${rule.priority || "Medium"} priority`);
  return parts.join(" ");
}

// ─── Empty Form State ───
const emptyForm = {
  ruleName: "",
  description: "",
  playbookId: "",
  module: "",
  page: "ALL",
  workflowStage: "ALL",
  ventureStage: "ALL",
  ventureType: "ALL",
  spvBrand: "ALL",
  userRoles: "",
  riskCategories: "",
  scoringFrameworks: "",
  evidenceTypes: "",
  approvalGate: "",
  rdStage: "",
  investmentPackStatus: "",
  missingEvidenceTrigger: "",
  scoreThresholdTrigger: "",
  riskThresholdTrigger: "",
  approvalGateTrigger: "",
  rdStageTrigger: "",
  investmentPackStatusTrigger: "",
  priority: "Medium" as "High" | "Medium" | "Low",
};

export default function AdminContextRules() {
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterActive, setFilterActive] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [formTab, setFormTab] = useState<"context" | "triggers" | "filters" | "preview">("context");
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: rules = [], isLoading } = trpc.contextual.adminListRules.useQuery();
  const { data: _playbookRes } = trpc.admin.playbooks.list.useQuery({ limit: 100 });
  const playbooks = _playbookRes?.playbooks ?? [];

  const createRule = trpc.contextual.adminCreateRule.useMutation({
    onSuccess: () => { utils.contextual.adminListRules.invalidate(); toast.success("Rule created"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateRule = trpc.contextual.adminUpdateRule.useMutation({
    onSuccess: () => { utils.contextual.adminListRules.invalidate(); toast.success("Rule updated"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteRule = trpc.contextual.adminDeleteRule.useMutation({
    onSuccess: () => { utils.contextual.adminListRules.invalidate(); toast.success("Rule deleted"); setDeleteConfirm(null); },
    onError: (e) => toast.error(e.message),
  });

  const playbookMap = useMemo(() => {
    const m: Record<string, string> = {};
    (playbooks as any[]).forEach((p: any) => { m[p.id] = p.title; });
    return m;
  }, [playbooks]);

  // ─── Filtered Rules ───
  const filtered = useMemo(() => {
    let list = [...(rules as any[])];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r: any) =>
        (r.rule_name || "").toLowerCase().includes(q) ||
        (r.playbook_title || "").toLowerCase().includes(q) ||
        (r.module || "").toLowerCase().includes(q)
      );
    }
    if (filterModule !== "ALL") list = list.filter((r: any) => r.module === filterModule);
    if (filterPriority !== "ALL") list = list.filter((r: any) => r.priority === filterPriority);
    if (filterActive !== "ALL") list = list.filter((r: any) => (filterActive === "Active" ? r.active : !r.active));
    return list;
  }, [rules, search, filterModule, filterPriority, filterActive]);

  // ─── Handlers ───
  const openCreate = () => {
    setEditingRule(null);
    setForm(emptyForm);
    setFormTab("context");
    setDialogOpen(true);
  };

  const openEdit = (rule: any) => {
    setEditingRule(rule);
    setForm({
      ruleName: rule.rule_name || "",
      description: rule.description || "",
      playbookId: rule.playbook_id || "",
      module: rule.module || "",
      page: rule.page || "ALL",
      workflowStage: rule.workflow_stage || "ALL",
      ventureStage: rule.venture_stage || "ALL",
      ventureType: rule.venture_type || "ALL",
      spvBrand: rule.spv_brand || "ALL",
      userRoles: rule.user_roles || "",
      riskCategories: rule.risk_categories || "",
      scoringFrameworks: rule.scoring_frameworks || "",
      evidenceTypes: rule.evidence_types || "",
      approvalGate: rule.approval_gate || "",
      rdStage: rule.rd_stage || "",
      investmentPackStatus: rule.investment_pack_status || "",
      missingEvidenceTrigger: rule.missing_evidence_trigger || "",
      scoreThresholdTrigger: rule.score_threshold_trigger || "",
      riskThresholdTrigger: rule.risk_threshold_trigger || "",
      approvalGateTrigger: rule.approval_gate_trigger || "",
      rdStageTrigger: rule.rd_stage_trigger || "",
      investmentPackStatusTrigger: rule.investment_pack_status_trigger || "",
      priority: rule.priority || "Medium",
    });
    setFormTab("context");
    setDialogOpen(true);
  };

  const openDuplicate = (rule: any) => {
    setEditingRule(null);
    setForm({
      ruleName: (rule.rule_name || "") + " (Copy)",
      description: rule.description || "",
      playbookId: rule.playbook_id || "",
      module: rule.module || "",
      page: rule.page || "ALL",
      workflowStage: rule.workflow_stage || "ALL",
      ventureStage: rule.venture_stage || "ALL",
      ventureType: rule.venture_type || "ALL",
      spvBrand: rule.spv_brand || "ALL",
      userRoles: rule.user_roles || "",
      riskCategories: rule.risk_categories || "",
      scoringFrameworks: rule.scoring_frameworks || "",
      evidenceTypes: rule.evidence_types || "",
      approvalGate: rule.approval_gate || "",
      rdStage: rule.rd_stage || "",
      investmentPackStatus: rule.investment_pack_status || "",
      missingEvidenceTrigger: rule.missing_evidence_trigger || "",
      scoreThresholdTrigger: rule.score_threshold_trigger || "",
      riskThresholdTrigger: rule.risk_threshold_trigger || "",
      approvalGateTrigger: rule.approval_gate_trigger || "",
      rdStageTrigger: rule.rd_stage_trigger || "",
      investmentPackStatusTrigger: rule.investment_pack_status_trigger || "",
      priority: rule.priority || "Medium",
    });
    setFormTab("context");
    setDialogOpen(true);
  };

  const handleToggleActive = (rule: any) => {
    updateRule.mutate({ id: rule.id, active: !rule.active });
  };

  const handleSave = () => {
    if (!form.ruleName.trim()) { toast.error("Rule name is required"); return; }
    if (!form.playbookId) { toast.error("Playbook is required"); return; }
    if (!form.module) { toast.error("Module is required"); return; }

    const payload = {
      ...form,
      userRoles: form.userRoles || null,
      riskCategories: form.riskCategories || null,
      scoringFrameworks: form.scoringFrameworks || null,
      evidenceTypes: form.evidenceTypes || null,
      approvalGate: form.approvalGate || null,
      rdStage: form.rdStage || null,
      investmentPackStatus: form.investmentPackStatus || null,
      missingEvidenceTrigger: form.missingEvidenceTrigger || null,
      scoreThresholdTrigger: form.scoreThresholdTrigger || null,
      riskThresholdTrigger: form.riskThresholdTrigger || null,
      approvalGateTrigger: form.approvalGateTrigger || null,
      rdStageTrigger: form.rdStageTrigger || null,
      investmentPackStatusTrigger: form.investmentPackStatusTrigger || null,
    };

    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...payload });
    } else {
      createRule.mutate(payload);
    }
  };

  // ─── Stats ───
  const totalRules = (rules as any[]).length;
  const activeRules = (rules as any[]).filter((r: any) => r.active).length;
  const highPriority = (rules as any[]).filter((r: any) => r.priority === "High").length;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={18} style={{ color: "#56A837" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>
                Admin / Context Rules
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Context Rule Builder
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Define when and where playbooks appear across EcoBlend OS modules. Rules control contextual recommendations based on venture stage, risk, scoring, and workflow position.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-1.5" style={{ background: "#56A837" }}>
            <Plus size={14} /> New Rule
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{totalRules}</span>
            <span className="text-xs text-gray-400">Total Rules</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
            <span className="text-2xl font-bold" style={{ color: "#22c55e" }}>{activeRules}</span>
            <span className="text-xs text-gray-400">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle size={14} style={{ color: "#6b7280" }} />
            <span className="text-2xl font-bold text-gray-500">{totalRules - activeRules}</span>
            <span className="text-xs text-gray-400">Inactive</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: "#ef4444" }} />
            <span className="text-2xl font-bold" style={{ color: "#ef4444" }}>{highPriority}</span>
            <span className="text-xs text-gray-400">High Priority</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-8 py-4 border-b" style={{ borderColor: "#f3f4f6" }}>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search rules by name, playbook, or module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={13} /> Filters {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </Button>
        </div>
        {showFilters && (
          <div className="flex gap-3 mt-3">
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Module" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Modules</SelectItem>
                {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Rule List */}
      <div className="px-8 py-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading rules...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm">No context rules found</p>
            <Button onClick={openCreate} variant="outline" size="sm" className="mt-3 gap-1.5">
              <Plus size={13} /> Create First Rule
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((rule: any) => (
              <div
                key={rule.id}
                className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                style={{ borderColor: "#e5e7eb", opacity: rule.active ? 1 : 0.6 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">
                        {rule.rule_name || "Unnamed Rule"}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5"
                        style={{ borderColor: priorityColor[rule.priority], color: priorityColor[rule.priority] }}
                      >
                        {rule.priority}
                      </Badge>
                      {!rule.active && (
                        <Badge variant="outline" className="text-[10px] px-1.5 text-gray-400 border-gray-300">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen size={11} /> {rule.playbook_title || "Unknown Playbook"}
                      </span>
                      <span>|</span>
                      <span>{rule.module}</span>
                      {rule.venture_stage && rule.venture_stage !== "ALL" && (
                        <><span>|</span><span>{rule.venture_stage}</span></>
                      )}
                      {rule.workflow_stage && rule.workflow_stage !== "ALL" && (
                        <><span>|</span><span>{rule.workflow_stage}</span></>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                      className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100"
                      title="Preview"
                    >
                      <Eye size={13} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => openEdit(rule)}
                      className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100"
                      title="Edit"
                    >
                      <Pencil size={13} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => openDuplicate(rule)}
                      className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100"
                      title="Duplicate"
                    >
                      <Copy size={13} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(rule)}
                      className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100"
                      title={rule.active ? "Deactivate" : "Activate"}
                    >
                      {rule.active
                        ? <ToggleRight size={15} style={{ color: "#22c55e" }} />
                        : <ToggleLeft size={15} className="text-gray-400" />
                      }
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(rule.id)}
                      className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Expanded Preview */}
                {expandedRule === rule.id && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
                    <p className="text-xs text-gray-500 italic mb-2">
                      {generateRulePreview(rule, rule.playbook_title)}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {rule.venture_type && rule.venture_type !== "ALL" && (
                        <div><span className="text-gray-400">Type:</span> {rule.venture_type}</div>
                      )}
                      {rule.spv_brand && rule.spv_brand !== "ALL" && (
                        <div><span className="text-gray-400">Brand:</span> {rule.spv_brand}</div>
                      )}
                      {rule.user_roles && (
                        <div><span className="text-gray-400">Roles:</span> {rule.user_roles}</div>
                      )}
                      {rule.risk_categories && (
                        <div><span className="text-gray-400">Risk:</span> {rule.risk_categories}</div>
                      )}
                      {rule.scoring_frameworks && (
                        <div><span className="text-gray-400">Scoring:</span> {rule.scoring_frameworks}</div>
                      )}
                      {rule.evidence_types && (
                        <div><span className="text-gray-400">Evidence:</span> {rule.evidence_types}</div>
                      )}
                      {rule.missing_evidence_trigger && (
                        <div><span className="text-gray-400">Missing Evidence:</span> {rule.missing_evidence_trigger}</div>
                      )}
                      {rule.score_threshold_trigger && (
                        <div><span className="text-gray-400">Score Threshold:</span> {rule.score_threshold_trigger}</div>
                      )}
                      {rule.risk_threshold_trigger && (
                        <div><span className="text-gray-400">Risk Threshold:</span> {rule.risk_threshold_trigger}</div>
                      )}
                      {rule.rd_stage_trigger && (
                        <div><span className="text-gray-400">R&D Stage:</span> {rule.rd_stage_trigger}</div>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-xs text-gray-500 mt-2">{rule.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Delete Context Rule?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">This action cannot be undone. The rule will be permanently removed.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteConfirm && deleteRule.mutate({ id: deleteConfirm })}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingRule ? "Edit Context Rule" : "Create Context Rule"}
            </DialogTitle>
          </DialogHeader>

          {/* Form Tabs */}
          <div className="flex gap-1 border-b pb-2 mb-4" style={{ borderColor: "#e5e7eb" }}>
            {(["context", "triggers", "filters", "preview"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFormTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  formTab === tab ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab === "context" ? "Context" : tab === "triggers" ? "Triggers" : tab === "filters" ? "Filters" : "Preview"}
              </button>
            ))}
          </div>

          {/* Tab: Context */}
          {formTab === "context" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Rule Name *</label>
                <Input
                  value={form.ruleName}
                  onChange={(e) => setForm({ ...form, ruleName: e.target.value })}
                  placeholder="e.g. Show Risk Assessment for VRL 3+ ventures"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe when and why this rule triggers..."
                  className="text-sm min-h-[60px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Playbook *</label>
                  <Select value={form.playbookId} onValueChange={(v) => setForm({ ...form, playbookId: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select playbook" /></SelectTrigger>
                    <SelectContent>
                      {(playbooks as any[]).map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Module *</label>
                  <Select value={form.module} onValueChange={(v) => setForm({ ...form, module: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select module" /></SelectTrigger>
                    <SelectContent>
                      {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Venture Stage</label>
                  <Select value={form.ventureStage} onValueChange={(v) => setForm({ ...form, ventureStage: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VENTURE_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Workflow Stage</label>
                  <Select value={form.workflowStage} onValueChange={(v) => setForm({ ...form, workflowStage: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Priority</label>
                  <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Venture Type</label>
                  <Select value={form.ventureType} onValueChange={(v) => setForm({ ...form, ventureType: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VENTURE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">SPV Brand</label>
                  <Select value={form.spvBrand} onValueChange={(v) => setForm({ ...form, spvBrand: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPV_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Page</label>
                  <Input
                    value={form.page}
                    onChange={(e) => setForm({ ...form, page: e.target.value })}
                    placeholder="ALL"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Triggers */}
          {formTab === "triggers" && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Trigger conditions determine when this rule fires dynamically based on venture data.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Missing Evidence Trigger</label>
                  <Input
                    value={form.missingEvidenceTrigger}
                    onChange={(e) => setForm({ ...form, missingEvidenceTrigger: e.target.value })}
                    placeholder="e.g. Interview, Market Data"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Score Threshold Trigger</label>
                  <Input
                    value={form.scoreThresholdTrigger}
                    onChange={(e) => setForm({ ...form, scoreThresholdTrigger: e.target.value })}
                    placeholder="e.g. VRL < 3.0, BRL < 50%"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Risk Threshold Trigger</label>
                  <Input
                    value={form.riskThresholdTrigger}
                    onChange={(e) => setForm({ ...form, riskThresholdTrigger: e.target.value })}
                    placeholder="e.g. RPN > 100, Critical risks > 0"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Approval Gate Trigger</label>
                  <Input
                    value={form.approvalGateTrigger}
                    onChange={(e) => setForm({ ...form, approvalGateTrigger: e.target.value })}
                    placeholder="e.g. Stage 2 Gate Pending"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">R&D Stage Trigger</label>
                  <Select value={form.rdStageTrigger || "none"} onValueChange={(v) => setForm({ ...form, rdStageTrigger: v === "none" ? "" : v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {RD_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Investment Pack Status Trigger</label>
                  <Input
                    value={form.investmentPackStatusTrigger}
                    onChange={(e) => setForm({ ...form, investmentPackStatusTrigger: e.target.value })}
                    placeholder="e.g. Incomplete, Missing Financials"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Filters */}
          {formTab === "filters" && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Optional filters to narrow when this rule applies. Comma-separate multiple values.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">User Roles</label>
                  <Input
                    value={form.userRoles}
                    onChange={(e) => setForm({ ...form, userRoles: e.target.value })}
                    placeholder="e.g. admin, founder, advisor"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Risk Categories</label>
                  <Input
                    value={form.riskCategories}
                    onChange={(e) => setForm({ ...form, riskCategories: e.target.value })}
                    placeholder="e.g. Market, Technology"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Scoring Frameworks</label>
                  <Input
                    value={form.scoringFrameworks}
                    onChange={(e) => setForm({ ...form, scoringFrameworks: e.target.value })}
                    placeholder="e.g. VRL, TRL, BRL"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Evidence Types</label>
                  <Input
                    value={form.evidenceTypes}
                    onChange={(e) => setForm({ ...form, evidenceTypes: e.target.value })}
                    placeholder="e.g. Interview, Survey, Experiment"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Approval Gate</label>
                  <Input
                    value={form.approvalGate}
                    onChange={(e) => setForm({ ...form, approvalGate: e.target.value })}
                    placeholder="e.g. Stage 2 Gate, Investment Gate"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">R&D Stage</label>
                  <Select value={form.rdStage || "none"} onValueChange={(v) => setForm({ ...form, rdStage: v === "none" ? "" : v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {RD_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Preview */}
          {formTab === "preview" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: "#e5e7eb" }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rule Preview</h3>
                <p className="text-sm text-gray-700 italic">
                  {generateRulePreview(form, playbookMap[form.playbookId])}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: "#e5e7eb" }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Configuration Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Rule Name:</span> <span className="text-gray-700">{form.ruleName || "—"}</span></div>
                  <div><span className="text-gray-400">Playbook:</span> <span className="text-gray-700">{playbookMap[form.playbookId] || "—"}</span></div>
                  <div><span className="text-gray-400">Module:</span> <span className="text-gray-700">{form.module || "—"}</span></div>
                  <div><span className="text-gray-400">Priority:</span> <span style={{ color: priorityColor[form.priority] }}>{form.priority}</span></div>
                  <div><span className="text-gray-400">Venture Stage:</span> <span className="text-gray-700">{form.ventureStage}</span></div>
                  <div><span className="text-gray-400">Workflow Stage:</span> <span className="text-gray-700">{form.workflowStage}</span></div>
                  {form.missingEvidenceTrigger && <div><span className="text-gray-400">Missing Evidence:</span> <span className="text-gray-700">{form.missingEvidenceTrigger}</span></div>}
                  {form.scoreThresholdTrigger && <div><span className="text-gray-400">Score Threshold:</span> <span className="text-gray-700">{form.scoreThresholdTrigger}</span></div>}
                  {form.riskThresholdTrigger && <div><span className="text-gray-400">Risk Threshold:</span> <span className="text-gray-700">{form.riskThresholdTrigger}</span></div>}
                  {form.rdStageTrigger && <div><span className="text-gray-400">R&D Stage Trigger:</span> <span className="text-gray-700">{form.rdStageTrigger}</span></div>}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t" style={{ borderColor: "#e5e7eb" }}>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createRule.isPending || updateRule.isPending}
              style={{ background: "#56A837" }}
            >
              {createRule.isPending || updateRule.isPending ? "Saving..." : editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
