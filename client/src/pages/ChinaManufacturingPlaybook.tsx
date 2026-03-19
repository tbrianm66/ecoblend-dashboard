// ============================================================
// CHINA MANUFACTURING PLAYBOOK
// 4-phase workflow: UK Prototype → China Feasibility → Pilot → Scale
// 6 tabs: Overview, UK Prototype, China Feasibility, Pilot & Scale, IP Protection, QC & Logistics
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Factory, Shield, Truck, CheckCircle2, Circle, ArrowRight,
  Plus, Pencil, Trash2, ChevronRight, Package, Globe,
  AlertTriangle, ClipboardCheck, Ship, FileText, Lock,
  Users, ClipboardList, Star, Award,
} from "lucide-react";
import {
  SupplierOnboardingTab,
  FactoryAuditTab,
  RfqManagerTab,
  ApprovedSupplierListTab,
  ContractTemplatesTab,
} from "./ChinaMfgExtendedTabs";

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase = "uk_prototype" | "china_feasibility" | "pilot_production" | "scale_manufacturing";
type SupplierTier = "tier1_oem" | "tier2_components" | "tier3_raw_materials" | "tier4_tooling";
type QcType = "pre_production" | "in_line" | "pre_shipment_aql";
type FreightType = "sea" | "air" | "rail" | "road";

const PHASES: { id: Phase; label: string; short: string; color: string }[] = [
  { id: "uk_prototype", label: "UK Prototype", short: "UK R&D", color: "#3A97D3" },
  { id: "china_feasibility", label: "China Feasibility", short: "Feasibility", color: "#F49C13" },
  { id: "pilot_production", label: "Pilot Production", short: "Pilot", color: "#8B5CF6" },
  { id: "scale_manufacturing", label: "Scale Manufacturing", short: "Scale", color: "#51AF37" },
];

const TIER_LABELS: Record<SupplierTier, string> = {
  tier1_oem: "Tier 1 — OEM / Assembly",
  tier2_components: "Tier 2 — Components",
  tier3_raw_materials: "Tier 3 — Raw Materials",
  tier4_tooling: "Tier 4 — Tooling",
};

const TIER_COLORS: Record<SupplierTier, string> = {
  tier1_oem: "#51AF37",
  tier2_components: "#3A97D3",
  tier3_raw_materials: "#F49C13",
  tier4_tooling: "#8B5CF6",
};

const QC_LABELS: Record<QcType, string> = {
  pre_production: "Pre-Production Audit",
  in_line: "In-Line Inspection",
  pre_shipment_aql: "Pre-Shipment AQL",
};

const FREIGHT_LABELS: Record<FreightType, string> = {
  sea: "Sea Freight",
  air: "Air Freight",
  rail: "Rail (Belt & Road)",
  road: "Road",
};

const FREIGHT_COLORS: Record<FreightType, string> = {
  sea: "#3A97D3",
  air: "#F49C13",
  rail: "#8B5CF6",
  road: "#51AF37",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function phaseIndex(phase: Phase): number {
  return PHASES.findIndex(p => p.id === phase);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pass: "bg-green-100 text-green-700",
    fail: "bg-red-100 text-red-700",
    conditional_pass: "bg-yellow-100 text-yellow-700",
    pending: "bg-gray-100 text-gray-500",
    planned: "bg-gray-100 text-gray-500",
    booked: "bg-blue-100 text-blue-700",
    in_transit: "bg-indigo-100 text-indigo-700",
    customs: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    delayed: "bg-red-100 text-red-700",
    signed: "bg-green-100 text-green-700",
    sent: "bg-yellow-100 text-yellow-700",
    none: "bg-gray-100 text-gray-400",
    draft: "bg-yellow-100 text-yellow-700",
    not_started: "bg-gray-100 text-gray-400",
    in_progress: "bg-blue-100 text-blue-700",
    validated: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ ventureId, onSelectProject }: { ventureId: string; onSelectProject: (id: number) => void }) {
  const { data: summary } = trpc.mfgPlaybook.getPlaybookSummary.useQuery({ ventureId });
  const { data: projects } = trpc.mfgPlaybook.listProjects.useQuery({ ventureId });
  const advanceMutation = trpc.mfgPlaybook.advancePhase.useMutation({
    onSuccess: () => { utils.mfgPlaybook.listProjects.invalidate(); utils.mfgPlaybook.getPlaybookSummary.invalidate(); toast.success("Phase advanced"); },
    onError: (e) => toast.error(e.message),
  });
  const utils = trpc.useUtils();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Playbook Projects", value: summary?.projects ?? 0, icon: Factory, color: "#3A97D3" },
          { label: "Suppliers Onboarded", value: summary?.suppliers ?? 0, icon: Globe, color: "#51AF37" },
          { label: "QC Pass Rate", value: `${summary?.qcPassRate ?? 0}%`, icon: ClipboardCheck, color: "#8B5CF6" },
          { label: "Active Shipments", value: summary?.activeShipments ?? 0, icon: Ship, color: "#F49C13" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Phase Pipeline */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-gray-900">Manufacturing Pipeline</CardTitle>
          <p className="text-xs text-gray-400">4-phase UK → China manufacturing pathway</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            {PHASES.map((phase, i) => (
              <div key={phase.id} className="flex items-center gap-2 flex-1">
                <div className="flex-1 rounded-xl p-3 text-center" style={{ background: `${phase.color}12`, border: `1.5px solid ${phase.color}30` }}>
                  <p className="text-xs font-bold" style={{ color: phase.color }}>{phase.short}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{(summary?.phaseBreakdown as Record<string, number> | undefined)?.[phase.id] ?? 0} projects</p>
                </div>
                {i < PHASES.length - 1 && <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />}
              </div>
            ))}
          </div>

          {/* Project list */}
          {!projects?.length ? (
            <div className="text-center py-8 text-gray-400 text-sm">No playbook projects yet. Create one using the UK Prototype tab.</div>
          ) : (
            <div className="space-y-3">
              {projects.map(project => {
                const phaseInfo = PHASES[phaseIndex(project.phase as Phase)];
                const completedPhases = [project.ukPrototypeDone, project.chinaFeasibilityDone, project.pilotProductionDone, project.scaleManufacturingDone].filter(Boolean).length;
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all"
                    style={{ borderLeft: `4px solid ${phaseInfo?.color}` }}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${phaseInfo?.color}18` }}>
                        <Factory size={16} style={{ color: phaseInfo?.color }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{project.productName}</p>
                        <p className="text-xs text-gray-400">{project.description?.slice(0, 60) || "No description"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Phase progress dots */}
                      <div className="flex gap-1">
                        {PHASES.map((ph, i) => (
                          <div key={ph.id} className="w-2.5 h-2.5 rounded-full" style={{
                            background: i < completedPhases ? ph.color : (ph.id === project.phase ? ph.color + "80" : "#e5e7eb")
                          }} title={ph.label} />
                        ))}
                      </div>
                      <StatusBadge status={project.phase} />
                      <Button size="sm" variant="outline" className="text-xs h-7"
                        onClick={e => { e.stopPropagation(); advanceMutation.mutate({ id: project.id }); }}>
                        Advance <ChevronRight size={12} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NNN & IP Summary */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Lock size={14} className="text-purple-500" /> IP Protection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-500" />
              <span className="text-sm text-gray-700"><strong>{summary?.nnnSigned ?? 0}</strong> NNN agreements signed</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-blue-500" />
              <span className="text-sm text-gray-700"><strong>{summary?.qcReports ?? 0}</strong> QC reports logged</span>
            </div>
            <div className="flex items-center gap-2">
              <Ship size={16} className="text-orange-500" />
              <span className="text-sm text-gray-700"><strong>{summary?.shipments ?? 0}</strong> total shipments</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Project Form Dialog ────────────────────────────────────────────────────────
function ProjectFormDialog({ ventureId, existing, onClose }: { ventureId: string; existing?: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    productName: existing?.productName ?? "",
    description: existing?.description ?? "",
    phase: (existing?.phase ?? "uk_prototype") as Phase,
    trlLevel: existing?.trlLevel ?? 1,
    targetUnitCostGbp: existing?.targetUnitCostGbp ?? "",
    materialCostGbp: existing?.materialCostGbp ?? "",
    labourCostGbp: existing?.labourCostGbp ?? "",
    overheadCostGbp: existing?.overheadCostGbp ?? "",
    logisticsCostGbp: existing?.logisticsCostGbp ?? "",
    marginPercent: existing?.marginPercent ?? 30,
    notes: existing?.notes ?? "",
  });

  const upsert = trpc.mfgPlaybook.upsertProject.useMutation({
    onSuccess: () => {
      utils.mfgPlaybook.listProjects.invalidate();
      utils.mfgPlaybook.getPlaybookSummary.invalidate();
      toast.success(existing ? "Project updated" : "Project created");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Product Name *</Label>
          <Input value={form.productName} onChange={e => setForm(s => ({ ...s, productName: e.target.value }))} placeholder="e.g. EcoBlend Composite Panel" />
        </div>
        <div className="col-span-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} rows={2} />
        </div>
        <div>
          <Label>Current Phase</Label>
          <Select value={form.phase} onValueChange={v => setForm(s => ({ ...s, phase: v as Phase }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PHASES.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>TRL Level (1–9)</Label>
          <Input type="number" min={1} max={9} value={form.trlLevel} onChange={e => setForm(s => ({ ...s, trlLevel: parseInt(e.target.value) || 1 }))} />
        </div>
        <div>
          <Label>Target Unit Cost (£)</Label>
          <Input type="number" value={form.targetUnitCostGbp} onChange={e => setForm(s => ({ ...s, targetUnitCostGbp: e.target.value }))} placeholder="0.00" />
        </div>
        <div>
          <Label>Margin (%)</Label>
          <Input type="number" value={form.marginPercent} onChange={e => setForm(s => ({ ...s, marginPercent: parseFloat(e.target.value) || 30 }))} />
        </div>
        <div>
          <Label>Material Cost/Unit (£)</Label>
          <Input type="number" value={form.materialCostGbp} onChange={e => setForm(s => ({ ...s, materialCostGbp: e.target.value }))} placeholder="0.00" />
        </div>
        <div>
          <Label>Labour Cost/Unit (£)</Label>
          <Input type="number" value={form.labourCostGbp} onChange={e => setForm(s => ({ ...s, labourCostGbp: e.target.value }))} placeholder="0.00" />
        </div>
        <div>
          <Label>Overhead Cost/Unit (£)</Label>
          <Input type="number" value={form.overheadCostGbp} onChange={e => setForm(s => ({ ...s, overheadCostGbp: e.target.value }))} placeholder="0.00" />
        </div>
        <div>
          <Label>Logistics Cost/Unit (£)</Label>
          <Input type="number" value={form.logisticsCostGbp} onChange={e => setForm(s => ({ ...s, logisticsCostGbp: e.target.value }))} placeholder="0.00" />
        </div>
        <div className="col-span-2">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))} rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => upsert.mutate({ ...existing, ...form, ventureId, trlLevel: Number(form.trlLevel), targetUnitCostGbp: form.targetUnitCostGbp ? Number(form.targetUnitCostGbp) : undefined, materialCostGbp: form.materialCostGbp ? Number(form.materialCostGbp) : undefined, labourCostGbp: form.labourCostGbp ? Number(form.labourCostGbp) : undefined, overheadCostGbp: form.overheadCostGbp ? Number(form.overheadCostGbp) : undefined, logisticsCostGbp: form.logisticsCostGbp ? Number(form.logisticsCostGbp) : undefined })} disabled={!form.productName || upsert.isPending}>
          {upsert.isPending ? "Saving…" : existing ? "Update" : "Create Project"}
        </Button>
      </div>
    </div>
  );
}

// ── UK Prototype Tab ───────────────────────────────────────────────────────────
function UkPrototypeTab({ ventureId }: { ventureId: string }) {
  const { data: projects } = trpc.mfgPlaybook.listProjects.useQuery({ ventureId });
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const deleteMutation = trpc.mfgPlaybook.deleteProject.useMutation({
    onSuccess: () => { utils.mfgPlaybook.listProjects.invalidate(); utils.mfgPlaybook.getPlaybookSummary.invalidate(); toast.success("Project deleted"); },
  });

  const ukProjects = projects?.filter(p => p.phase === "uk_prototype" || p.ukPrototypeDone) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">UK Prototype Layer</h3>
          <p className="text-xs text-gray-400">R&D validation, TRL progression, early LCA, design freeze</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#3A97D3" }}
              onClick={() => setEditing(null)}>
              <Plus size={13} /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Edit Project" : "New Playbook Project"}</DialogTitle></DialogHeader>
            <ProjectFormDialog ventureId={ventureId} existing={editing} onClose={() => { setDialogOpen(false); setEditing(null); }} />
          </DialogContent>
        </Dialog>
      </div>

      {!ukProjects.length ? (
        <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed rounded-xl">
          No UK prototype projects. Create one to start the manufacturing pathway.
        </div>
      ) : (
        <div className="space-y-4">
          {ukProjects.map(project => (
            <Card key={project.id} className="border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900">{project.productName}</h4>
                      <StatusBadge status={project.prototypeStatus || "not_started"} />
                      {project.ukPrototypeDone ? <Badge className="bg-green-100 text-green-700 text-xs">Phase Complete</Badge> : null}
                    </div>
                    <p className="text-xs text-gray-400">{project.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(project); setDialogOpen(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                      <Pencil size={13} className="text-gray-400" />
                    </button>
                    <button onClick={() => deleteMutation.mutate({ id: project.id })} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "TRL Level", value: `TRL ${project.trlLevel}`, color: "#3A97D3" },
                    { label: "Target Unit Cost", value: project.targetUnitCostGbp ? `£${project.targetUnitCostGbp.toFixed(2)}` : "—", color: "#51AF37" },
                    { label: "Material Cost", value: project.materialCostGbp ? `£${project.materialCostGbp.toFixed(2)}` : "—", color: "#F49C13" },
                    { label: "Margin", value: `${project.marginPercent}%`, color: "#8B5CF6" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg p-3" style={{ background: `${color}0d` }}>
                      <p className="text-xs text-gray-400 font-semibold">{label}</p>
                      <p className="text-lg font-bold" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* TRL progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>TRL Progression</span>
                    <span>{project.trlLevel ?? 1}/9</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${((project.trlLevel ?? 1) / 9) * 100}%`, background: "#3A97D3" }} />
                  </div>
                </div>

                {/* Checklist */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "RFQ Sent", done: project.rfqSent },
                    { label: "DFM Complete", done: project.dfmComplete },
                    { label: "Tooling Ownership Agreement", done: project.toolingOwnershipAgreement },
                    { label: "ISO 9001", done: project.iso9001 },
                    { label: "ISO 14001", done: project.iso14001 },
                    { label: "CE Certified", done: project.ceCertified },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                      {done ? <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" /> : <Circle size={13} className="text-gray-300 flex-shrink-0" />}
                      {label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── China Feasibility Tab ──────────────────────────────────────────────────────
function ChinaFeasibilityTab({ ventureId }: { ventureId: string }) {
  const { data: projects } = trpc.mfgPlaybook.listProjects.useQuery({ ventureId });
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const { data: suppliers } = trpc.mfgPlaybook.listSuppliers.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const utils = trpc.useUtils();
  const [supplierDialog, setSupplierDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierForm, setSupplierForm] = useState<any>({
    supplierName: "", tier: "tier1_oem", country: "China", city: "", contactName: "", contactEmail: "",
    nnnAgreement: "none", manufacturingContract: "none", toolingOwnership: "none",
    blackBoxComponents: 0, riskScore: 50, auditScore: 0, qualityScore: 0, isDualSource: 0, notes: "",
  });

  const upsertSupplier = trpc.mfgPlaybook.upsertSupplier.useMutation({
    onSuccess: () => { utils.mfgPlaybook.listSuppliers.invalidate(); toast.success("Supplier saved"); setSupplierDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteSupplier = trpc.mfgPlaybook.deleteSupplier.useMutation({
    onSuccess: () => { utils.mfgPlaybook.listSuppliers.invalidate(); toast.success("Supplier removed"); },
  });

  const feasibilityProjects = projects?.filter(p => p.phase === "china_feasibility" || p.chinaFeasibilityDone || p.ukPrototypeDone) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-gray-900">China Feasibility Layer</h3>
        <p className="text-xs text-gray-400">RFQ, DFM analysis, 4-tier supplier ecosystem, NNN agreements</p>
      </div>

      {/* Project selector */}
      <div className="flex gap-2 flex-wrap">
        {feasibilityProjects.map(p => (
          <button key={p.id} onClick={() => setSelectedProjectId(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedProjectId === p.id ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600 hover:border-orange-300"}`}>
            {p.productName}
          </button>
        ))}
        {!feasibilityProjects.length && <p className="text-sm text-gray-400">Complete UK Prototype phase first.</p>}
      </div>

      {selectedProjectId && (
        <>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-gray-700">Supplier Ecosystem</h4>
            <Dialog open={supplierDialog} onOpenChange={setSupplierDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#F49C13" }}
                  onClick={() => { setEditingSupplier(null); setSupplierForm({ supplierName: "", tier: "tier1_oem", country: "China", city: "", contactName: "", contactEmail: "", nnnAgreement: "none", manufacturingContract: "none", toolingOwnership: "none", blackBoxComponents: 0, riskScore: 50, auditScore: 0, qualityScore: 0, isDualSource: 0, notes: "" }); }}>
                  <Plus size={13} /> Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Supplier Name *</Label>
                      <Input value={supplierForm.supplierName} onChange={e => setSupplierForm((s: any) => ({ ...s, supplierName: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Tier</Label>
                      <Select value={supplierForm.tier} onValueChange={v => setSupplierForm((s: any) => ({ ...s, tier: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TIER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input value={supplierForm.country} onChange={e => setSupplierForm((s: any) => ({ ...s, country: e.target.value }))} />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input value={supplierForm.city} onChange={e => setSupplierForm((s: any) => ({ ...s, city: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Contact Name</Label>
                      <Input value={supplierForm.contactName} onChange={e => setSupplierForm((s: any) => ({ ...s, contactName: e.target.value }))} />
                    </div>
                    <div>
                      <Label>NNN Agreement</Label>
                      <Select value={supplierForm.nnnAgreement} onValueChange={v => setSupplierForm((s: any) => ({ ...s, nnnAgreement: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="signed">Signed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Manufacturing Contract</Label>
                      <Select value={supplierForm.manufacturingContract} onValueChange={v => setSupplierForm((s: any) => ({ ...s, manufacturingContract: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="signed">Signed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tooling Ownership</Label>
                      <Select value={supplierForm.toolingOwnership} onValueChange={v => setSupplierForm((s: any) => ({ ...s, toolingOwnership: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Risk Score (0–100)</Label>
                      <Input type="number" min={0} max={100} value={supplierForm.riskScore} onChange={e => setSupplierForm((s: any) => ({ ...s, riskScore: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <Label>Quality Score (0–100)</Label>
                      <Input type="number" min={0} max={100} value={supplierForm.qualityScore} onChange={e => setSupplierForm((s: any) => ({ ...s, qualityScore: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div className="col-span-2">
                      <Label>Notes</Label>
                      <Textarea value={supplierForm.notes} onChange={e => setSupplierForm((s: any) => ({ ...s, notes: e.target.value }))} rows={2} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSupplierDialog(false)}>Cancel</Button>
                    <Button onClick={() => upsertSupplier.mutate({ ...editingSupplier, ...supplierForm, projectId: selectedProjectId, ventureId })}
                      disabled={!supplierForm.supplierName || upsertSupplier.isPending}>
                      {upsertSupplier.isPending ? "Saving…" : editingSupplier ? "Update" : "Add Supplier"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tier breakdown */}
          {(["tier1_oem", "tier2_components", "tier3_raw_materials", "tier4_tooling"] as SupplierTier[]).map(tier => {
            const tierSuppliers = suppliers?.filter(s => s.tier === tier) ?? [];
            if (!tierSuppliers.length) return null;
            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: TIER_COLORS[tier] }} />
                  <span className="text-xs font-bold text-gray-600">{TIER_LABELS[tier]}</span>
                  <span className="text-xs text-gray-400">({tierSuppliers.length})</span>
                </div>
                <div className="space-y-2 ml-4">
                  {tierSuppliers.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${TIER_COLORS[tier]}18` }}>
                          <Globe size={14} style={{ color: TIER_COLORS[tier] }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{s.supplierName}</p>
                          <p className="text-xs text-gray-400">{s.city}, {s.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={s.nnnAgreement || "none"} />
                        <div className="text-xs text-gray-500">Risk: <strong className={(s.riskScore ?? 0) > 70 ? "text-red-500" : (s.riskScore ?? 0) > 40 ? "text-yellow-500" : "text-green-500"}>{s.riskScore ?? 0}</strong></div>
                        <button onClick={() => { setEditingSupplier(s); setSupplierForm(s); setSupplierDialog(true); }} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100">
                          <Pencil size={11} className="text-gray-400" />
                        </button>
                        <button onClick={() => deleteSupplier.mutate({ id: s.id })} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50">
                          <Trash2 size={11} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {!suppliers?.length && (
            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-xl">
              No suppliers yet. Add your first supplier to build the ecosystem.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Pilot & Scale Tab ──────────────────────────────────────────────────────────
function PilotScaleTab({ ventureId }: { ventureId: string }) {
  const { data: projects } = trpc.mfgPlaybook.listProjects.useQuery({ ventureId });
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  const costData = useMemo(() => {
    if (!selectedProject) return [];
    const mat = selectedProject.materialCostGbp ?? 0;
    const lab = selectedProject.labourCostGbp ?? 0;
    const ovh = selectedProject.overheadCostGbp ?? 0;
    const log = selectedProject.logisticsCostGbp ?? 0;
    const total = mat + lab + ovh + log;
    const margin = selectedProject.marginPercent ?? 30;
    const volumes = [selectedProject.pilotVolume || 100, (selectedProject.pilotVolume || 100) * 2, (selectedProject.pilotVolume || 100) * 5, selectedProject.scaleVolume || 1000, (selectedProject.scaleVolume || 1000) * 2];
    return volumes.map(vol => ({
      volume: `${vol.toLocaleString()} units`,
      Material: parseFloat((mat * vol).toFixed(2)),
      Labour: parseFloat((lab * vol).toFixed(2)),
      Overhead: parseFloat((ovh * vol).toFixed(2)),
      Logistics: parseFloat((log * vol).toFixed(2)),
      Revenue: parseFloat((total * (1 + margin / 100) * vol).toFixed(2)),
    }));
  }, [selectedProject]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-gray-900">Pilot & Scale Layer</h3>
        <p className="text-xs text-gray-400">Volume ramp plan, cost modelling, production economics</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {projects?.map(p => (
          <button key={p.id} onClick={() => setSelectedProjectId(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedProjectId === p.id ? "bg-purple-500 text-white border-purple-500" : "border-gray-200 text-gray-600 hover:border-purple-300"}`}>
            {p.productName}
          </button>
        ))}
      </div>

      {selectedProject && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Pilot Volume", value: `${(selectedProject.pilotVolume || 0).toLocaleString()} units`, color: "#8B5CF6" },
              { label: "Scale Volume", value: `${(selectedProject.scaleVolume || 0).toLocaleString()} units`, color: "#51AF37" },
              { label: "Total Unit Cost", value: selectedProject.materialCostGbp ? `£${((selectedProject.materialCostGbp || 0) + (selectedProject.labourCostGbp || 0) + (selectedProject.overheadCostGbp || 0) + (selectedProject.logisticsCostGbp || 0)).toFixed(2)}` : "—", color: "#3A97D3" },
              { label: "Selling Price", value: selectedProject.materialCostGbp ? `£${(((selectedProject.materialCostGbp || 0) + (selectedProject.labourCostGbp || 0) + (selectedProject.overheadCostGbp || 0) + (selectedProject.logisticsCostGbp || 0)) * (1 + (selectedProject.marginPercent || 30) / 100)).toFixed(2)}` : "—", color: "#F49C13" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-4" style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
                <p className="text-xs text-gray-400 font-semibold">{label}</p>
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {costData.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-900">Cost & Revenue by Production Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={costData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="volume" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Material" stackId="cost" fill="#51AF37" />
                    <Bar dataKey="Labour" stackId="cost" fill="#3A97D3" />
                    <Bar dataKey="Overhead" stackId="cost" fill="#F49C13" />
                    <Bar dataKey="Logistics" stackId="cost" fill="#8B5CF6" />
                    <Bar dataKey="Revenue" fill="#1a2332" opacity={0.15} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ── IP Protection Tab ──────────────────────────────────────────────────────────
function IpProtectionTab({ ventureId }: { ventureId: string }) {
  const { data: projects } = trpc.mfgPlaybook.listProjects.useQuery({ ventureId });
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const { data: suppliers } = trpc.mfgPlaybook.listSuppliers.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  const ipStats = useMemo(() => {
    if (!suppliers) return { nnnSigned: 0, nnnSent: 0, contractSigned: 0, toolingFull: 0, blackBox: 0, dualSource: 0 };
    return {
      nnnSigned: suppliers.filter(s => s.nnnAgreement === "signed").length,
      nnnSent: suppliers.filter(s => s.nnnAgreement === "sent").length,
      contractSigned: suppliers.filter(s => s.manufacturingContract === "signed").length,
      toolingFull: suppliers.filter(s => s.toolingOwnership === "full").length,
      blackBox: suppliers.filter(s => s.blackBoxComponents).length,
      dualSource: suppliers.filter(s => s.isDualSource).length,
    };
  }, [suppliers]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-gray-900">IP Protection Layer</h3>
        <p className="text-xs text-gray-400">NNN agreements, manufacturing contracts, tooling ownership, black-box strategy</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {projects?.map(p => (
          <button key={p.id} onClick={() => setSelectedProjectId(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedProjectId === p.id ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-600 hover:border-purple-300"}`}>
            {p.productName}
          </button>
        ))}
      </div>

      {selectedProjectId && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "NNN Agreements Signed", value: ipStats.nnnSigned, total: suppliers?.length ?? 0, color: "#51AF37", icon: Shield },
              { label: "NNN Agreements Sent", value: ipStats.nnnSent, total: suppliers?.length ?? 0, color: "#F49C13", icon: FileText },
              { label: "Manufacturing Contracts Signed", value: ipStats.contractSigned, total: suppliers?.length ?? 0, color: "#3A97D3", icon: ClipboardCheck },
              { label: "Full Tooling Ownership", value: ipStats.toolingFull, total: suppliers?.length ?? 0, color: "#8B5CF6", icon: Package },
              { label: "Black-Box Components", value: ipStats.blackBox, total: suppliers?.length ?? 0, color: "#EF4444", icon: Lock },
              { label: "Dual-Sourced Suppliers", value: ipStats.dualSource, total: suppliers?.length ?? 0, color: "#06B6D4", icon: Globe },
            ].map(({ label, value, total, color, icon: Icon }) => (
              <Card key={label} className="border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-xl font-bold" style={{ color }}>{value}<span className="text-xs text-gray-400 font-normal">/{total}</span></p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Supplier IP status table */}
          {suppliers && suppliers.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-900">Supplier IP Status Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-semibold text-gray-500">Supplier</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-500">Tier</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-500">NNN</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-500">Contract</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-500">Tooling</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-500">Black-Box</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-500">Dual Source</th>
                        <th className="text-right py-2 pl-2 font-semibold text-gray-500">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map(s => (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2 pr-4 font-medium text-gray-900">{s.supplierName}</td>
                          <td className="py-2 px-2 text-center">
                            <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: `${TIER_COLORS[s.tier as SupplierTier]}18`, color: TIER_COLORS[s.tier as SupplierTier] }}>
                              {s.tier.replace("tier", "T").replace("_oem", "").replace("_components", "").replace("_raw_materials", "").replace("_tooling", "")}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center"><StatusBadge status={s.nnnAgreement || "none"} /></td>
                          <td className="py-2 px-2 text-center"><StatusBadge status={s.manufacturingContract || "none"} /></td>
                          <td className="py-2 px-2 text-center"><StatusBadge status={s.toolingOwnership || "none"} /></td>
                          <td className="py-2 px-2 text-center">{s.blackBoxComponents ? <CheckCircle2 size={13} className="text-green-500 mx-auto" /> : <Circle size={13} className="text-gray-300 mx-auto" />}</td>
                          <td className="py-2 px-2 text-center">{s.isDualSource ? <CheckCircle2 size={13} className="text-blue-500 mx-auto" /> : <Circle size={13} className="text-gray-300 mx-auto" />}</td>
                          <td className="py-2 pl-2 text-right font-bold" style={{ color: (s.riskScore || 0) > 70 ? "#EF4444" : (s.riskScore || 0) > 40 ? "#F49C13" : "#51AF37" }}>
                            {s.riskScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ── QC & Logistics Tab ─────────────────────────────────────────────────────────
function QcLogisticsTab({ ventureId }: { ventureId: string }) {
  const { data: projects } = trpc.mfgPlaybook.listProjects.useQuery({ ventureId });
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const { data: qcReports } = trpc.mfgPlaybook.listQcReports.useQuery({ projectId: selectedProjectId! }, { enabled: !!selectedProjectId });
  const { data: shipments } = trpc.mfgPlaybook.listShipments.useQuery({ projectId: selectedProjectId! }, { enabled: !!selectedProjectId });
  const utils = trpc.useUtils();

  const [qcDialog, setQcDialog] = useState(false);
  const [shipDialog, setShipDialog] = useState(false);
  const [qcForm, setQcForm] = useState<any>({ reportType: "pre_production", inspector: "", sampleSize: "", defectsFound: 0, aqlLevel: "2.5", result: "pending", iso9001Pass: 0, iso14001Pass: 0, cePass: 0, ukcastPass: 0, findings: "", correctiveActions: "" });
  const [shipForm, setShipForm] = useState<any>({ freightType: "sea", originPort: "shenzhen", destinationPort: "Felixstowe, UK", volume: "", weightKg: "", freightCostGbp: "", dutiesGbp: "", insuranceGbp: "", leadTimeDays: "", status: "planned", trackingRef: "", forwarder: "", incoterms: "FOB", notes: "" });

  const upsertQc = trpc.mfgPlaybook.upsertQcReport.useMutation({
    onSuccess: () => { utils.mfgPlaybook.listQcReports.invalidate(); toast.success("QC report saved"); setQcDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteQc = trpc.mfgPlaybook.deleteQcReport.useMutation({
    onSuccess: () => { utils.mfgPlaybook.listQcReports.invalidate(); toast.success("Report deleted"); },
  });
  const upsertShip = trpc.mfgPlaybook.upsertShipment.useMutation({
    onSuccess: () => { utils.mfgPlaybook.listShipments.invalidate(); toast.success("Shipment saved"); setShipDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteShip = trpc.mfgPlaybook.deleteShipment.useMutation({
    onSuccess: () => { utils.mfgPlaybook.listShipments.invalidate(); toast.success("Shipment deleted"); },
  });

  const passRate = qcReports?.length ? Math.round((qcReports.filter(r => r.result === "pass").length / qcReports.length) * 100) : 0;
  const totalFreightCost = shipments?.reduce((sum, s) => sum + (s.freightCostGbp || 0) + (s.dutiesGbp || 0) + (s.insuranceGbp || 0), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-gray-900">QC & Logistics Layer</h3>
        <p className="text-xs text-gray-400">Pre-production audits, AQL inspections, shipment tracking, port selection</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {projects?.map(p => (
          <button key={p.id} onClick={() => setSelectedProjectId(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedProjectId === p.id ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:border-blue-300"}`}>
            {p.productName}
          </button>
        ))}
      </div>

      {selectedProjectId && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "QC Reports", value: qcReports?.length ?? 0, color: "#3A97D3" },
              { label: "QC Pass Rate", value: `${passRate}%`, color: passRate >= 80 ? "#51AF37" : passRate >= 60 ? "#F49C13" : "#EF4444" },
              { label: "Total Shipments", value: shipments?.length ?? 0, color: "#8B5CF6" },
              { label: "Total Logistics Cost", value: `£${totalFreightCost.toLocaleString()}`, color: "#F49C13" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-4" style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
                <p className="text-xs text-gray-400 font-semibold">{label}</p>
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* QC Reports section */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-gray-700">QC Inspection Reports</h4>
            <Dialog open={qcDialog} onOpenChange={setQcDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#3A97D3" }}>
                  <Plus size={13} /> Add QC Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>New QC Report</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Report Type</Label>
                      <Select value={qcForm.reportType} onValueChange={v => setQcForm((s: any) => ({ ...s, reportType: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(QC_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Result</Label>
                      <Select value={qcForm.result} onValueChange={v => setQcForm((s: any) => ({ ...s, result: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                          <SelectItem value="conditional_pass">Conditional Pass</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Inspector</Label>
                      <Input value={qcForm.inspector} onChange={e => setQcForm((s: any) => ({ ...s, inspector: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Sample Size</Label>
                      <Input type="number" value={qcForm.sampleSize} onChange={e => setQcForm((s: any) => ({ ...s, sampleSize: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Defects Found</Label>
                      <Input type="number" value={qcForm.defectsFound} onChange={e => setQcForm((s: any) => ({ ...s, defectsFound: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <Label>AQL Level</Label>
                      <Input value={qcForm.aqlLevel} onChange={e => setQcForm((s: any) => ({ ...s, aqlLevel: e.target.value }))} placeholder="2.5" />
                    </div>
                    <div className="col-span-2">
                      <Label>Findings</Label>
                      <Textarea value={qcForm.findings} onChange={e => setQcForm((s: any) => ({ ...s, findings: e.target.value }))} rows={2} />
                    </div>
                    <div className="col-span-2">
                      <Label>Corrective Actions</Label>
                      <Textarea value={qcForm.correctiveActions} onChange={e => setQcForm((s: any) => ({ ...s, correctiveActions: e.target.value }))} rows={2} />
                    </div>
                    <div className="col-span-2 flex gap-4 flex-wrap">
                      {[["iso9001Pass", "ISO 9001"], ["iso14001Pass", "ISO 14001"], ["cePass", "CE Mark"], ["ukcastPass", "UKCA"]].map(([field, label]) => (
                        <label key={field} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="checkbox" checked={!!qcForm[field]} onChange={e => setQcForm((s: any) => ({ ...s, [field]: e.target.checked ? 1 : 0 }))} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setQcDialog(false)}>Cancel</Button>
                    <Button onClick={() => upsertQc.mutate({ ...qcForm, projectId: selectedProjectId, ventureId, sampleSize: qcForm.sampleSize ? Number(qcForm.sampleSize) : undefined })} disabled={upsertQc.isPending}>
                      {upsertQc.isPending ? "Saving…" : "Save Report"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {qcReports?.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <ClipboardCheck size={16} className="text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{QC_LABELS[r.reportType as QcType]}</p>
                    <p className="text-xs text-gray-400">Inspector: {r.inspector || "—"} · Sample: {r.sampleSize || "—"} · AQL {r.aqlLevel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.defectsFound ? <span className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11} />{r.defectsFound} defects</span> : null}
                  <StatusBadge status={r.result || "pending"} />
                  <button onClick={() => deleteQc.mutate({ id: r.id })} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50">
                    <Trash2 size={11} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
            {!qcReports?.length && <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed rounded-xl">No QC reports yet.</div>}
          </div>

          {/* Shipments section */}
          <div className="flex items-center justify-between mt-2">
            <h4 className="font-semibold text-sm text-gray-700">Logistics Shipments</h4>
            <Dialog open={shipDialog} onOpenChange={setShipDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#8B5CF6" }}>
                  <Plus size={13} /> Add Shipment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>New Shipment</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Freight Type</Label>
                      <Select value={shipForm.freightType} onValueChange={v => setShipForm((s: any) => ({ ...s, freightType: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(FREIGHT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Origin Port</Label>
                      <Select value={shipForm.originPort} onValueChange={v => setShipForm((s: any) => ({ ...s, originPort: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["shenzhen", "shanghai", "ningbo", "qingdao", "guangzhou", "tianjin", "other"].map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Destination</Label>
                      <Input value={shipForm.destinationPort} onChange={e => setShipForm((s: any) => ({ ...s, destinationPort: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Incoterms</Label>
                      <Select value={shipForm.incoterms} onValueChange={v => setShipForm((s: any) => ({ ...s, incoterms: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["EXW", "FOB", "CIF", "DDP", "DAP"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Volume (units)</Label>
                      <Input type="number" value={shipForm.volume} onChange={e => setShipForm((s: any) => ({ ...s, volume: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Weight (kg)</Label>
                      <Input type="number" value={shipForm.weightKg} onChange={e => setShipForm((s: any) => ({ ...s, weightKg: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Freight Cost (£)</Label>
                      <Input type="number" value={shipForm.freightCostGbp} onChange={e => setShipForm((s: any) => ({ ...s, freightCostGbp: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Duties (£)</Label>
                      <Input type="number" value={shipForm.dutiesGbp} onChange={e => setShipForm((s: any) => ({ ...s, dutiesGbp: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Lead Time (days)</Label>
                      <Input type="number" value={shipForm.leadTimeDays} onChange={e => setShipForm((s: any) => ({ ...s, leadTimeDays: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={shipForm.status} onValueChange={v => setShipForm((s: any) => ({ ...s, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["planned", "booked", "in_transit", "customs", "delivered", "delayed"].map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tracking Ref</Label>
                      <Input value={shipForm.trackingRef} onChange={e => setShipForm((s: any) => ({ ...s, trackingRef: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Forwarder</Label>
                      <Input value={shipForm.forwarder} onChange={e => setShipForm((s: any) => ({ ...s, forwarder: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShipDialog(false)}>Cancel</Button>
                    <Button onClick={() => upsertShip.mutate({ ...shipForm, projectId: selectedProjectId, ventureId, volume: shipForm.volume ? Number(shipForm.volume) : undefined, weightKg: shipForm.weightKg ? Number(shipForm.weightKg) : undefined, freightCostGbp: shipForm.freightCostGbp ? Number(shipForm.freightCostGbp) : undefined, dutiesGbp: shipForm.dutiesGbp ? Number(shipForm.dutiesGbp) : undefined, insuranceGbp: shipForm.insuranceGbp ? Number(shipForm.insuranceGbp) : undefined, leadTimeDays: shipForm.leadTimeDays ? Number(shipForm.leadTimeDays) : undefined })} disabled={upsertShip.isPending}>
                      {upsertShip.isPending ? "Saving…" : "Save Shipment"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {shipments?.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${FREIGHT_COLORS[s.freightType as FreightType]}18` }}>
                    <Ship size={14} style={{ color: FREIGHT_COLORS[s.freightType as FreightType] }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{FREIGHT_LABELS[s.freightType as FreightType]} — {s.originPort?.charAt(0).toUpperCase()}{s.originPort?.slice(1)} → {s.destinationPort}</p>
                    <p className="text-xs text-gray-400">{s.incoterms} · {s.volume?.toLocaleString()} units · {s.leadTimeDays}d · {s.trackingRef || "No tracking"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">£{((s.freightCostGbp || 0) + (s.dutiesGbp || 0) + (s.insuranceGbp || 0)).toLocaleString()}</span>
                  <StatusBadge status={s.status || "planned"} />
                  <button onClick={() => deleteShip.mutate({ id: s.id })} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50">
                    <Trash2 size={11} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
            {!shipments?.length && <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed rounded-xl">No shipments yet.</div>}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ChinaManufacturingPlaybook() {
  const { ventures } = useVentures();
  const [activeTab, setActiveTab] = useState("overview");
  const [highlightedProjectId, setHighlightedProjectId] = useState<number | null>(null);

  const ventureId = ventures[0]?.id || "default";
  const venture = ventures.find(v => v.id === ventureId);

  const handleSelectProject = (id: number) => {
    setHighlightedProjectId(id);
    setActiveTab("uk_prototype");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#F49C1315", color: "#F49C13" }}>
                Supply Chain
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">China Manufacturing Playbook</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              China Manufacturing Playbook
            </h1>
            <p className="text-sm text-gray-500 max-w-xl mt-1">
              4-phase UK → China manufacturing pathway: prototype validation, supplier ecosystem, IP protection, QC, and logistics.
            </p>
          </div>
          {venture && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Venture</p>
              <p className="font-bold text-gray-900">{venture.name}</p>
            </div>
          )}
        </div>

        {/* Phase pipeline mini-header */}
        <div className="flex items-center gap-2 mt-4">
          {PHASES.map((phase, i) => (
            <div key={phase.id} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: `${phase.color}12`, color: phase.color }}>
                {phase.label}
              </div>
              {i < PHASES.length - 1 && <ArrowRight size={12} className="text-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-gray-100 p-1 rounded-xl h-auto flex-wrap gap-1">
            {[
              { id: "overview", label: "Overview", icon: Factory },
              { id: "uk_prototype", label: "UK Prototype", icon: Package },
              { id: "china_feasibility", label: "China Feasibility", icon: Globe },
              { id: "pilot_scale", label: "Pilot & Scale", icon: BarChart },
              { id: "ip_protection", label: "IP Protection", icon: Shield },
              { id: "qc_logistics", label: "QC & Logistics", icon: Truck },
              { id: "supplier_onboarding", label: "Onboarding", icon: Users },
              { id: "factory_audit", label: "Factory Audit", icon: ClipboardList },
              { id: "rfq_manager", label: "RFQ Manager", icon: FileText },
              { id: "asl", label: "Approved Suppliers", icon: Award },
              { id: "contracts", label: "Contracts", icon: Lock },
            ].map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Icon size={13} />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab ventureId={ventureId} onSelectProject={handleSelectProject} />
          </TabsContent>
          <TabsContent value="uk_prototype">
            <UkPrototypeTab ventureId={ventureId} />
          </TabsContent>
          <TabsContent value="china_feasibility">
            <ChinaFeasibilityTab ventureId={ventureId} />
          </TabsContent>
          <TabsContent value="pilot_scale">
            <PilotScaleTab ventureId={ventureId} />
          </TabsContent>
          <TabsContent value="ip_protection">
            <IpProtectionTab ventureId={ventureId} />
          </TabsContent>
          <TabsContent value="qc_logistics">
            <QcLogisticsTab ventureId={ventureId} />
          </TabsContent>
          <TabsContent value="supplier_onboarding">
            <SupplierOnboardingTab ventureId={ventureId} />
          </TabsContent>
          <TabsContent value="factory_audit">
            <FactoryAuditTab ventureId={ventureId} />
          </TabsContent>
          <TabsContent value="rfq_manager">
            <RfqManagerTab ventureId={ventureId} />
          </TabsContent>
          <TabsContent value="asl">
            <ApprovedSupplierListTab ventureId={ventureId} />
          </TabsContent>
          <TabsContent value="contracts">
            <ContractTemplatesTab ventureId={ventureId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
