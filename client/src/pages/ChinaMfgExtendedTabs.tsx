// ============================================================
// CHINA MANUFACTURING PLAYBOOK — EXTENDED TABS
// Supplier Onboarding, Factory Audit, RFQ Manager, ASL, Contract Templates
// ============================================================
import { useState } from "react";
import React from "react";
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
import {
  Users, ClipboardList, FileText, Star, CheckSquare, Plus, Pencil, Trash2,
  Building2, Award, AlertTriangle, CheckCircle2, Circle, Loader2, Sparkles,
} from "lucide-react";

// ── Colour helpers ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  under_review: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  on_hold: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  probationary: "bg-yellow-100 text-yellow-700",
  suspended: "bg-orange-100 text-orange-700",
  delisted: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  responses_received: "bg-purple-100 text-purple-700",
  evaluated: "bg-indigo-100 text-indigo-700",
  awarded: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  complete: "bg-green-100 text-green-700",
  follow_up_required: "bg-orange-100 text-orange-700",
  signed: "bg-green-100 text-green-700",
  under_review_contract: "bg-blue-100 text-blue-700",
  expired: "bg-gray-100 text-gray-500",
  terminated: "bg-red-100 text-red-700",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const AUDIT_RESULT_COLORS: Record<string, string> = {
  pass: "text-green-600",
  fail: "text-red-600",
  partial: "text-yellow-600",
  na: "text-gray-400",
};

// ── Score bar ──────────────────────────────────────────────────────────────────
function ScoreBar({ value, max = 5, color = "#56A837" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8 text-right">{value}/{max}</span>
    </div>
  );
}

// ── Audit item badge ───────────────────────────────────────────────────────────
function AuditBadge({ value }: { value: string }) {
  const icons: Record<string, React.ReactElement> = {
    pass: <CheckCircle2 size={13} className="text-green-600" />,
    fail: <AlertTriangle size={13} className="text-red-600" />,
    partial: <Circle size={13} className="text-yellow-600" />,
    na: <Circle size={13} className="text-gray-400" />,
  };
  const labels: Record<string, string> = { pass: "Pass", fail: "Fail", partial: "Partial", na: "N/A" };
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${AUDIT_RESULT_COLORS[value] ?? "text-gray-500"}`}>
      {icons[value] ?? null}
      {labels[value] ?? value}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SUPPLIER ONBOARDING TAB
// ═══════════════════════════════════════════════════════════════════════════════
const CAPABILITY_CRITERIA = [
  { key: "technicalCapability", label: "Technical Capability" },
  { key: "qualitySystems", label: "Quality Systems" },
  { key: "leadTimesScore", label: "Lead Times" },
  { key: "costCompetitiveness", label: "Cost Competitiveness" },
  { key: "communication", label: "Communication" },
  { key: "complianceStandards", label: "Compliance Standards" },
] as const;

type OnboardingForm = {
  companyName: string; location: string; city: string; country: string;
  contactName: string; contactEmail: string; contactPhone: string;
  capabilities: string; certifications: string; productionCapacity: string;
  keyClients: string; financialStability: string; references: string;
  technicalCapability: number; qualitySystems: number; leadTimesScore: number;
  costCompetitiveness: number; communication: number; complianceStandards: number;
  status: string; notes: string;
};

const EMPTY_ONBOARDING: OnboardingForm = {
  companyName: "", location: "", city: "", country: "China",
  contactName: "", contactEmail: "", contactPhone: "",
  capabilities: "", certifications: "", productionCapacity: "",
  keyClients: "", financialStability: "unknown", references: "",
  technicalCapability: 0, qualitySystems: 0, leadTimesScore: 0,
  costCompetitiveness: 0, communication: 0, complianceStandards: 0,
  status: "pending", notes: "",
};

export function SupplierOnboardingTab({ ventureId }: { ventureId: string }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<OnboardingForm>(EMPTY_ONBOARDING);

  const { data: suppliers = [], refetch } = trpc.mfgOnboarding.list.useQuery({ ventureId });
  const upsert = trpc.mfgOnboarding.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Supplier saved"); } });
  const del = trpc.mfgOnboarding.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Supplier removed"); } });

  const openNew = () => { setEditId(null); setForm(EMPTY_ONBOARDING); setOpen(true); };
  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({
      companyName: s.companyName ?? "", location: s.location ?? "", city: s.city ?? "", country: s.country ?? "China",
      contactName: s.contactName ?? "", contactEmail: s.contactEmail ?? "", contactPhone: s.contactPhone ?? "",
      capabilities: s.capabilities ?? "", certifications: s.certifications ?? "", productionCapacity: s.productionCapacity ?? "",
      keyClients: s.keyClients ?? "", financialStability: s.financialStability ?? "unknown", references: s.references ?? "",
      technicalCapability: s.technicalCapability ?? 0, qualitySystems: s.qualitySystems ?? 0, leadTimesScore: s.leadTimesScore ?? 0,
      costCompetitiveness: s.costCompetitiveness ?? 0, communication: s.communication ?? 0, complianceStandards: s.complianceStandards ?? 0,
      status: s.status ?? "pending", notes: s.notes ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.companyName.trim()) { toast.error("Company name is required"); return; }
    upsert.mutate({ ...(editId ? { id: editId } : {}), ventureId, ...form } as any);
  };

  const avgScore = suppliers.length > 0
    ? (suppliers.reduce((a: number, s: any) => a + (s.overallScore ?? 0), 0) / suppliers.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Suppliers", value: suppliers.length, color: "#56A837" },
          { label: "Approved", value: suppliers.filter((s: any) => s.status === "approved").length, color: "#22c55e" },
          { label: "Under Review", value: suppliers.filter((s: any) => s.status === "under_review").length, color: "#3B85BA" },
          { label: "Avg Score", value: avgScore, color: "#F69111" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Supplier Register</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#56A837" }}>
          <Plus size={13} /> Add Supplier
        </Button>
      </div>

      {/* Supplier cards */}
      {suppliers.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No suppliers registered yet. Click "Add Supplier" to begin onboarding.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {suppliers.map((s: any) => (
            <div key={s.id} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{s.companyName}</p>
                  <p className="text-xs text-gray-400">{s.city}{s.city && s.country ? ", " : ""}{s.country}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {s.status?.replace("_", " ")}
                  </span>
                  <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-gray-100"><Pencil size={12} className="text-gray-400" /></button>
                  <button onClick={() => del.mutate({ id: s.id })} className="p-1 rounded hover:bg-gray-100"><Trash2 size={12} className="text-red-400" /></button>
                </div>
              </div>
              {/* Capability scores */}
              <div className="space-y-1.5 mb-3">
                {CAPABILITY_CRITERIA.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-36 truncate">{label}</span>
                    <ScoreBar value={(s as any)[key] ?? 0} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-2" style={{ borderColor: "#f3f4f6" }}>
                <span>Overall: <strong className="text-gray-700">{(s.overallScore ?? 0).toFixed(1)}/5</strong></span>
                {s.contactEmail && <span className="truncate max-w-[160px]">{s.contactEmail}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Supplier" : "Register New Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Company Name *</Label>
                <Input value={form.companyName} onChange={e => setForm(s => ({ ...s, companyName: e.target.value }))} placeholder="e.g. Shenzhen EcoMaterials Co." />
              </div>
              <div><Label className="text-xs">City</Label><Input value={form.city} onChange={e => setForm(s => ({ ...s, city: e.target.value }))} /></div>
              <div><Label className="text-xs">Country</Label><Input value={form.country} onChange={e => setForm(s => ({ ...s, country: e.target.value }))} /></div>
              <div><Label className="text-xs">Contact Name</Label><Input value={form.contactName} onChange={e => setForm(s => ({ ...s, contactName: e.target.value }))} /></div>
              <div><Label className="text-xs">Contact Email</Label><Input value={form.contactEmail} onChange={e => setForm(s => ({ ...s, contactEmail: e.target.value }))} /></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.contactPhone} onChange={e => setForm(s => ({ ...s, contactPhone: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Financial Stability</Label>
                <Select value={form.financialStability} onValueChange={v => setForm(s => ({ ...s, financialStability: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["unknown", "poor", "fair", "good", "excellent"].map(v => <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label className="text-xs">Capabilities</Label><Textarea value={form.capabilities} onChange={e => setForm(s => ({ ...s, capabilities: e.target.value }))} rows={2} placeholder="e.g. Injection moulding, composite panels, ISO 9001" /></div>
              <div className="col-span-2"><Label className="text-xs">Certifications (comma-separated)</Label><Input value={form.certifications} onChange={e => setForm(s => ({ ...s, certifications: e.target.value }))} placeholder="ISO 9001, ISO 14001, CE" /></div>
              <div><Label className="text-xs">Production Capacity</Label><Input value={form.productionCapacity} onChange={e => setForm(s => ({ ...s, productionCapacity: e.target.value }))} placeholder="e.g. 50,000 units/month" /></div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(s => ({ ...s, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending", "under_review", "approved", "rejected", "on_hold"].map(v => <SelectItem key={v} value={v}>{v.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Capability Assessment */}
            <div className="border rounded-lg p-4" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs font-bold text-gray-700 mb-3">Capability Assessment (0–5)</p>
              <div className="grid grid-cols-2 gap-3">
                {CAPABILITY_CRITERIA.map(({ key, label }) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" min={0} max={5} value={(form as any)[key]} onChange={e => setForm(s => ({ ...s, [key]: parseInt(e.target.value) || 0 }))} />
                  </div>
                ))}
              </div>
            </div>
            <div><Label className="text-xs">Key Clients</Label><Input value={form.keyClients} onChange={e => setForm(s => ({ ...s, keyClients: e.target.value }))} placeholder="e.g. BYD, CATL, Foxconn" /></div>
            <div><Label className="text-xs">References</Label><Textarea value={form.references} onChange={e => setForm(s => ({ ...s, references: e.target.value }))} rows={2} /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))} rows={2} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={upsert.isPending} style={{ background: "#56A837" }}>
                {upsert.isPending ? <Loader2 size={14} className="animate-spin" /> : "Save Supplier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. FACTORY AUDIT TAB
// ═══════════════════════════════════════════════════════════════════════════════
const AUDIT_CHECKLIST_ITEMS = [
  { key: "facilityCondition", label: "Facility Condition" },
  { key: "equipmentCapability", label: "Equipment Capability" },
  { key: "workforceSkills", label: "Workforce Skills" },
  { key: "qcProcesses", label: "QC Processes" },
  { key: "healthAndSafety", label: "Health & Safety" },
  { key: "environmentalCompliance", label: "Environmental Compliance" },
] as const;

type AuditForm = {
  supplierName: string; auditorName: string;
  facilityCondition: string; equipmentCapability: string; workforceSkills: string;
  qcProcesses: string; healthAndSafety: string; environmentalCompliance: string;
  overallResult: string; findings: string; correctiveActions: string; status: string;
};

const EMPTY_AUDIT: AuditForm = {
  supplierName: "", auditorName: "",
  facilityCondition: "na", equipmentCapability: "na", workforceSkills: "na",
  qcProcesses: "na", healthAndSafety: "na", environmentalCompliance: "na",
  overallResult: "pending", findings: "", correctiveActions: "", status: "scheduled",
};

export function FactoryAuditTab({ ventureId }: { ventureId: string }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AuditForm>(EMPTY_AUDIT);

  const { data: audits = [], refetch } = trpc.mfgAudit.list.useQuery({ ventureId });
  const upsert = trpc.mfgAudit.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Audit saved"); } });
  const del = trpc.mfgAudit.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Audit removed"); } });

  const openNew = () => { setEditId(null); setForm(EMPTY_AUDIT); setOpen(true); };
  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({
      supplierName: a.supplierName ?? "", auditorName: a.auditorName ?? "",
      facilityCondition: a.facilityCondition ?? "na", equipmentCapability: a.equipmentCapability ?? "na",
      workforceSkills: a.workforceSkills ?? "na", qcProcesses: a.qcProcesses ?? "na",
      healthAndSafety: a.healthAndSafety ?? "na", environmentalCompliance: a.environmentalCompliance ?? "na",
      overallResult: a.overallResult ?? "pending", findings: a.findings ?? "",
      correctiveActions: a.correctiveActions ?? "", status: a.status ?? "scheduled",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.supplierName.trim()) { toast.error("Supplier name is required"); return; }
    upsert.mutate({ ...(editId ? { id: editId } : {}), ventureId, ...form } as any);
  };

  const passCount = audits.filter((a: any) => a.overallResult === "pass").length;
  const avgScore = audits.length > 0 ? Math.round(audits.reduce((acc: number, a: any) => acc + (a.auditScore ?? 0), 0) / audits.length) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Audits", value: audits.length, color: "#56A837" },
          { label: "Passed", value: passCount, color: "#22c55e" },
          { label: "Follow-up Required", value: audits.filter((a: any) => a.status === "follow_up_required").length, color: "#F69111" },
          { label: "Avg Score", value: `${avgScore}%`, color: "#3B85BA" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Factory Audit Records</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#56A837" }}>
          <Plus size={13} /> Schedule Audit
        </Button>
      </div>

      {audits.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No factory audits recorded yet.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {audits.map((a: any) => (
            <div key={a.id} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{a.supplierName}</p>
                  <p className="text-xs text-gray-400">{a.auditorName ? `Auditor: ${a.auditorName}` : "Auditor TBC"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {a.status?.replace(/_/g, " ")}
                  </span>
                  <button onClick={() => openEdit(a)} className="p-1 rounded hover:bg-gray-100"><Pencil size={12} className="text-gray-400" /></button>
                  <button onClick={() => del.mutate({ id: a.id })} className="p-1 rounded hover:bg-gray-100"><Trash2 size={12} className="text-red-400" /></button>
                </div>
              </div>
              {/* Checklist grid */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {AUDIT_CHECKLIST_ITEMS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 truncate">{label}</span>
                    <AuditBadge value={(a as any)[key] ?? "na"} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs border-t pt-2" style={{ borderColor: "#f3f4f6" }}>
                <span>Score: <strong className="text-gray-700">{a.auditScore ?? 0}%</strong></span>
                <span className={`font-medium ${a.overallResult === "pass" ? "text-green-600" : a.overallResult === "fail" ? "text-red-600" : "text-yellow-600"}`}>
                  {a.overallResult?.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Audit" : "Schedule Factory Audit"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Supplier Name *</Label><Input value={form.supplierName} onChange={e => setForm(s => ({ ...s, supplierName: e.target.value }))} /></div>
              <div><Label className="text-xs">Auditor Name</Label><Input value={form.auditorName} onChange={e => setForm(s => ({ ...s, auditorName: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(s => ({ ...s, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["scheduled", "in_progress", "complete", "follow_up_required"].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Checklist */}
            <div className="border rounded-lg p-4 space-y-3" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs font-bold text-gray-700">Checklist Results</p>
              {AUDIT_CHECKLIST_ITEMS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{label}</span>
                  <Select value={(form as any)[key]} onValueChange={v => setForm(s => ({ ...s, [key]: v }))}>
                    <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pass", "partial", "fail", "na"].map(v => <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs">Overall Result</Label>
              <Select value={form.overallResult} onValueChange={v => setForm(s => ({ ...s, overallResult: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pass", "conditional_pass", "fail", "pending"].map(v => <SelectItem key={v} value={v}>{v.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Findings</Label><Textarea value={form.findings} onChange={e => setForm(s => ({ ...s, findings: e.target.value }))} rows={3} /></div>
            <div><Label className="text-xs">Corrective Actions</Label><Textarea value={form.correctiveActions} onChange={e => setForm(s => ({ ...s, correctiveActions: e.target.value }))} rows={3} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={upsert.isPending} style={{ background: "#56A837" }}>
                {upsert.isPending ? <Loader2 size={14} className="animate-spin" /> : "Save Audit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RFQ MANAGER TAB
// ═══════════════════════════════════════════════════════════════════════════════
type RfqForm = {
  rfqRef: string; productName: string; productSpecs: string; drawingsUrl: string; materials: string;
  targetVolumeMoq: string; targetVolumeAnnual: string; targetLeadTimeDays: string; targetUnitCostGbp: string;
  materialCostGbp: string; labourCostGbp: string; toolingCostGbp: string; overheadCostGbp: string; packagingCostGbp: string;
  sentToSuppliers: string; awardedSupplier: string; status: string; notes: string;
};

const EMPTY_RFQ: RfqForm = {
  rfqRef: "", productName: "", productSpecs: "", drawingsUrl: "", materials: "",
  targetVolumeMoq: "", targetVolumeAnnual: "", targetLeadTimeDays: "", targetUnitCostGbp: "",
  materialCostGbp: "", labourCostGbp: "", toolingCostGbp: "", overheadCostGbp: "", packagingCostGbp: "",
  sentToSuppliers: "", awardedSupplier: "", status: "draft", notes: "",
};

export function RfqManagerTab({ ventureId }: { ventureId: string }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<RfqForm>(EMPTY_RFQ);

  const { data: rfqs = [], refetch } = trpc.mfgRfq.list.useQuery({ ventureId });
  const upsert = trpc.mfgRfq.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("RFQ saved"); } });
  const del = trpc.mfgRfq.delete.useMutation({ onSuccess: () => { refetch(); toast.success("RFQ deleted"); } });

  const openNew = () => { setEditId(null); setForm(EMPTY_RFQ); setOpen(true); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({
      rfqRef: r.rfqRef ?? "", productName: r.productName ?? "", productSpecs: r.productSpecs ?? "",
      drawingsUrl: r.drawingsUrl ?? "", materials: r.materials ?? "",
      targetVolumeMoq: r.targetVolumeMoq?.toString() ?? "", targetVolumeAnnual: r.targetVolumeAnnual?.toString() ?? "",
      targetLeadTimeDays: r.targetLeadTimeDays?.toString() ?? "", targetUnitCostGbp: r.targetUnitCostGbp?.toString() ?? "",
      materialCostGbp: r.materialCostGbp?.toString() ?? "", labourCostGbp: r.labourCostGbp?.toString() ?? "",
      toolingCostGbp: r.toolingCostGbp?.toString() ?? "", overheadCostGbp: r.overheadCostGbp?.toString() ?? "",
      packagingCostGbp: r.packagingCostGbp?.toString() ?? "", sentToSuppliers: r.sentToSuppliers ?? "",
      awardedSupplier: r.awardedSupplier ?? "", status: r.status ?? "draft", notes: r.notes ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.productName.trim()) { toast.error("Product name is required"); return; }
    const payload: any = { ...(editId ? { id: editId } : {}), ventureId, ...form };
    ["targetVolumeMoq", "targetVolumeAnnual", "targetLeadTimeDays"].forEach(k => { if (payload[k]) payload[k] = parseInt(payload[k]); else delete payload[k]; });
    ["targetUnitCostGbp", "materialCostGbp", "labourCostGbp", "toolingCostGbp", "overheadCostGbp", "packagingCostGbp"].forEach(k => { if (payload[k]) payload[k] = parseFloat(payload[k]); else delete payload[k]; });
    upsert.mutate(payload);
  };

  const totalCost = (r: any) => {
    const vals = [r.materialCostGbp, r.labourCostGbp, r.toolingCostGbp, r.overheadCostGbp, r.packagingCostGbp];
    const sum = vals.reduce((a: number, v: any) => a + (parseFloat(v) || 0), 0);
    return sum > 0 ? `£${sum.toFixed(2)}` : "—";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total RFQs", value: rfqs.length, color: "#56A837" },
          { label: "Draft", value: rfqs.filter((r: any) => r.status === "draft").length, color: "#6b7280" },
          { label: "Sent", value: rfqs.filter((r: any) => r.status === "sent").length, color: "#3B85BA" },
          { label: "Awarded", value: rfqs.filter((r: any) => r.status === "awarded").length, color: "#22c55e" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">RFQ Templates</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#56A837" }}>
          <Plus size={13} /> Create RFQ
        </Button>
      </div>

      {rfqs.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No RFQs created yet.</div>
      ) : (
        <div className="space-y-3">
          {rfqs.map((r: any) => (
            <div key={r.id} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900 text-sm">{r.productName}</p>
                    {r.rfqRef && <span className="text-xs font-mono text-gray-400">{r.rfqRef}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.status?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2 text-xs text-gray-500">
                    <span>MOQ: <strong className="text-gray-700">{r.targetVolumeMoq?.toLocaleString() ?? "—"}</strong></span>
                    <span>Annual: <strong className="text-gray-700">{r.targetVolumeAnnual?.toLocaleString() ?? "—"}</strong></span>
                    <span>Lead time: <strong className="text-gray-700">{r.targetLeadTimeDays ? `${r.targetLeadTimeDays}d` : "—"}</strong></span>
                    <span>Target cost: <strong className="text-gray-700">{r.targetUnitCostGbp ? `£${parseFloat(r.targetUnitCostGbp).toFixed(2)}` : "—"}</strong></span>
                    <span>Total BOM: <strong className="text-gray-700">{totalCost(r)}</strong></span>
                    {r.awardedSupplier && <span className="col-span-2">Awarded to: <strong className="text-green-700">{r.awardedSupplier}</strong></span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => openEdit(r)} className="p-1 rounded hover:bg-gray-100"><Pencil size={12} className="text-gray-400" /></button>
                  <button onClick={() => del.mutate({ id: r.id })} className="p-1 rounded hover:bg-gray-100"><Trash2 size={12} className="text-red-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit RFQ" : "Create RFQ Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">RFQ Reference</Label><Input value={form.rfqRef} onChange={e => setForm(s => ({ ...s, rfqRef: e.target.value }))} placeholder="RFQ-001" /></div>
              <div className="col-span-2"><Label className="text-xs">Product Name *</Label><Input value={form.productName} onChange={e => setForm(s => ({ ...s, productName: e.target.value }))} /></div>
              <div className="col-span-2"><Label className="text-xs">Product Specifications</Label><Textarea value={form.productSpecs} onChange={e => setForm(s => ({ ...s, productSpecs: e.target.value }))} rows={3} /></div>
              <div className="col-span-2"><Label className="text-xs">Materials</Label><Input value={form.materials} onChange={e => setForm(s => ({ ...s, materials: e.target.value }))} placeholder="e.g. Natural fibre composite, bio-resin" /></div>
              <div><Label className="text-xs">Drawings URL</Label><Input value={form.drawingsUrl} onChange={e => setForm(s => ({ ...s, drawingsUrl: e.target.value }))} placeholder="https://..." /></div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(s => ({ ...s, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["draft", "sent", "responses_received", "evaluated", "awarded", "cancelled"].map(v => <SelectItem key={v} value={v}>{v.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Volumes */}
            <div className="border rounded-lg p-4 space-y-3" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs font-bold text-gray-700">Volumes & Lead Times</p>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">MOQ</Label><Input type="number" value={form.targetVolumeMoq} onChange={e => setForm(s => ({ ...s, targetVolumeMoq: e.target.value }))} /></div>
                <div><Label className="text-xs">Annual Volume</Label><Input type="number" value={form.targetVolumeAnnual} onChange={e => setForm(s => ({ ...s, targetVolumeAnnual: e.target.value }))} /></div>
                <div><Label className="text-xs">Lead Time (days)</Label><Input type="number" value={form.targetLeadTimeDays} onChange={e => setForm(s => ({ ...s, targetLeadTimeDays: e.target.value }))} /></div>
              </div>
            </div>
            {/* Pricing breakdown */}
            <div className="border rounded-lg p-4 space-y-3" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs font-bold text-gray-700">Pricing Breakdown (£ per unit)</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "targetUnitCostGbp", label: "Target Unit Cost" },
                  { key: "materialCostGbp", label: "Material" },
                  { key: "labourCostGbp", label: "Labour" },
                  { key: "toolingCostGbp", label: "Tooling" },
                  { key: "overheadCostGbp", label: "Overhead" },
                  { key: "packagingCostGbp", label: "Packaging" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" step="0.01" value={(form as any)[key]} onChange={e => setForm(s => ({ ...s, [key]: e.target.value }))} placeholder="0.00" />
                  </div>
                ))}
              </div>
            </div>
            <div><Label className="text-xs">Sent to Suppliers (comma-separated)</Label><Input value={form.sentToSuppliers} onChange={e => setForm(s => ({ ...s, sentToSuppliers: e.target.value }))} /></div>
            <div><Label className="text-xs">Awarded Supplier</Label><Input value={form.awardedSupplier} onChange={e => setForm(s => ({ ...s, awardedSupplier: e.target.value }))} /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))} rows={2} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={upsert.isPending} style={{ background: "#56A837" }}>
                {upsert.isPending ? <Loader2 size={14} className="animate-spin" /> : "Save RFQ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. APPROVED SUPPLIER LIST (ASL) TAB
// ═══════════════════════════════════════════════════════════════════════════════
const TIER_LABELS: Record<string, string> = {
  oem: "OEM", components: "Components", raw_materials: "Raw Materials", tooling: "Tooling",
};

type AslForm = {
  supplierId: string; supplierName: string; tierLevel: string; capabilities: string;
  riskRating: string; qualityScore: string; deliveryScore: string; costScore: string;
  approvedBy: string; status: string; notes: string;
};

const EMPTY_ASL: AslForm = {
  supplierId: "", supplierName: "", tierLevel: "components", capabilities: "",
  riskRating: "medium", qualityScore: "", deliveryScore: "", costScore: "",
  approvedBy: "", status: "active", notes: "",
};

export function ApprovedSupplierListTab({ ventureId }: { ventureId: string }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AslForm>(EMPTY_ASL);

  const { data: suppliers = [], refetch } = trpc.mfgAsl.list.useQuery({ ventureId });
  const upsert = trpc.mfgAsl.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("ASL entry saved"); } });
  const del = trpc.mfgAsl.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Supplier removed from ASL"); } });

  const openNew = () => { setEditId(null); setForm(EMPTY_ASL); setOpen(true); };
  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({
      supplierId: s.supplierId ?? "", supplierName: s.supplierName ?? "", tierLevel: s.tierLevel ?? "components",
      capabilities: s.capabilities ?? "", riskRating: s.riskRating ?? "medium",
      qualityScore: s.qualityScore?.toString() ?? "", deliveryScore: s.deliveryScore?.toString() ?? "",
      costScore: s.costScore?.toString() ?? "", approvedBy: s.approvedBy ?? "",
      status: s.status ?? "active", notes: s.notes ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.supplierName.trim()) { toast.error("Supplier name is required"); return; }
    const payload: any = { ...(editId ? { id: editId } : {}), ventureId, ...form };
    ["qualityScore", "deliveryScore", "costScore"].forEach(k => { if (payload[k]) payload[k] = parseFloat(payload[k]); else delete payload[k]; });
    upsert.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total ASL", value: suppliers.length, color: "#56A837" },
          { label: "Active", value: suppliers.filter((s: any) => s.status === "active").length, color: "#22c55e" },
          { label: "Probationary", value: suppliers.filter((s: any) => s.status === "probationary").length, color: "#F69111" },
          { label: "Suspended", value: suppliers.filter((s: any) => s.status === "suspended").length, color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Approved Supplier List</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#56A837" }}>
          <Plus size={13} /> Add to ASL
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No approved suppliers yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b text-gray-400 uppercase tracking-widest" style={{ borderColor: "#e5e7eb" }}>
                <th className="text-left py-2 px-3 font-semibold">Supplier</th>
                <th className="text-left py-2 px-3 font-semibold">Tier</th>
                <th className="text-left py-2 px-3 font-semibold">Risk</th>
                <th className="text-left py-2 px-3 font-semibold">Perf. Score</th>
                <th className="text-left py-2 px-3 font-semibold">Status</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s: any) => (
                <tr key={s.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-gray-900">{s.supplierName}</p>
                    {s.supplierId && <p className="text-gray-400 font-mono">{s.supplierId}</p>}
                  </td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{TIER_LABELS[s.tierLevel] ?? s.tierLevel}</span></td>
                  <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[s.riskRating] ?? "bg-gray-100 text-gray-600"}`}>{s.riskRating}</span></td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${s.performanceScore ?? 0}%` }} />
                      </div>
                      <span className="text-gray-600">{(s.performanceScore ?? 0).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"}`}>{s.status}</span></td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-gray-100"><Pencil size={11} className="text-gray-400" /></button>
                      <button onClick={() => del.mutate({ id: s.id })} className="p-1 rounded hover:bg-gray-100"><Trash2 size={11} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit ASL Entry" : "Add to Approved Supplier List"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Supplier ID</Label><Input value={form.supplierId} onChange={e => setForm(s => ({ ...s, supplierId: e.target.value }))} placeholder="SUP-001" /></div>
              <div className="col-span-2"><Label className="text-xs">Supplier Name *</Label><Input value={form.supplierName} onChange={e => setForm(s => ({ ...s, supplierName: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Tier Level</Label>
                <Select value={form.tierLevel} onValueChange={v => setForm(s => ({ ...s, tierLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Risk Rating</Label>
                <Select value={form.riskRating} onValueChange={v => setForm(s => ({ ...s, riskRating: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "critical"].map(v => <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(s => ({ ...s, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["active", "probationary", "suspended", "delisted"].map(v => <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Approved By</Label><Input value={form.approvedBy} onChange={e => setForm(s => ({ ...s, approvedBy: e.target.value }))} /></div>
            </div>
            <div className="border rounded-lg p-4 space-y-3" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs font-bold text-gray-700">Performance Scores (0–100)</p>
              <div className="grid grid-cols-3 gap-3">
                {[{ key: "qualityScore", label: "Quality" }, { key: "deliveryScore", label: "Delivery" }, { key: "costScore", label: "Cost" }].map(({ key, label }) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" min={0} max={100} value={(form as any)[key]} onChange={e => setForm(s => ({ ...s, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
            <div><Label className="text-xs">Capabilities</Label><Textarea value={form.capabilities} onChange={e => setForm(s => ({ ...s, capabilities: e.target.value }))} rows={2} /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))} rows={2} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={upsert.isPending} style={{ background: "#56A837" }}>
                {upsert.isPending ? <Loader2 size={14} className="animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. CONTRACT TEMPLATES TAB
// ═══════════════════════════════════════════════════════════════════════════════
const CONTRACT_TYPE_LABELS: Record<string, string> = {
  nnn: "NNN Agreement",
  manufacturing: "Manufacturing Agreement",
  tooling_ownership: "Tooling Ownership Agreement",
  quality: "Quality Agreement",
  logistics_supply: "Logistics & Supply Agreement",
};

const CONTRACT_TYPE_COLORS: Record<string, string> = {
  nnn: "#ef4444",
  manufacturing: "#3B85BA",
  tooling_ownership: "#F69111",
  quality: "#22c55e",
  logistics_supply: "#8b5cf6",
};

type ContractForm = {
  supplierName: string; contractType: string; jurisdiction: string;
  penaltyClause: boolean; ipOwnershipClause: boolean; incoterms: string;
  status: string; notes: string; draftText: string; clauseChecklist: string;
};

const EMPTY_CONTRACT: ContractForm = {
  supplierName: "", contractType: "nnn", jurisdiction: "China",
  penaltyClause: false, ipOwnershipClause: false, incoterms: "FOB",
  status: "draft", notes: "", draftText: "", clauseChecklist: "",
};

export function ContractTemplatesTab({ ventureId }: { ventureId: string }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ContractForm>(EMPTY_CONTRACT);
  const [viewDraft, setViewDraft] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");

  const { data: contracts = [], refetch } = trpc.mfgContracts.list.useQuery({ ventureId });
  const upsert = trpc.mfgContracts.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Contract saved"); } });
  const del = trpc.mfgContracts.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Contract deleted"); } });
  const generateDraft = trpc.mfgContracts.generateDraft.useMutation();

  // Load default clauses when contract type changes
  const { data: defaultClauses } = trpc.mfgContracts.getDefaultClauses.useQuery(
    { contractType: form.contractType as any },
    { enabled: open }
  );

  const openNew = () => { setEditId(null); setForm(EMPTY_CONTRACT); setOpen(true); };
  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      supplierName: c.supplierName ?? "", contractType: c.contractType ?? "nnn",
      jurisdiction: c.jurisdiction ?? "China", penaltyClause: c.penaltyClause ?? false,
      ipOwnershipClause: c.ipOwnershipClause ?? false, incoterms: c.incoterms ?? "FOB",
      status: c.status ?? "draft", notes: c.notes ?? "", draftText: c.draftText ?? "",
      clauseChecklist: c.clauseChecklist ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.contractType) { toast.error("Contract type is required"); return; }
    upsert.mutate({ ...(editId ? { id: editId } : {}), ventureId, ...form } as any);
  };

  const handleGenerateDraft = async () => {
    if (!form.supplierName.trim()) { toast.error("Enter a supplier name first"); return; }
    setGenerating(true);
    try {
      const result = await generateDraft.mutateAsync({
        contractType: form.contractType as any,
        supplierName: form.supplierName,
        ventureId,
        additionalContext: additionalContext || undefined,
      });
      setForm(s => ({ ...s, draftText: typeof result.draftText === 'string' ? result.draftText : String(result.draftText) }));
      toast.success("AI draft generated");
    } catch {
      toast.error("Failed to generate draft");
    } finally {
      setGenerating(false);
    }
  };

  // Parse clause checklist
  const getChecklist = (c: any): Record<string, boolean> => {
    try { return JSON.parse(c.clauseChecklist ?? "{}"); } catch { return {}; }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(CONTRACT_TYPE_LABELS).map(([type, label]) => {
          const count = contracts.filter((c: any) => c.contractType === type).length;
          const signed = contracts.filter((c: any) => c.contractType === type && c.status === "signed").length;
          return (
            <div key={type} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb", borderTop: `3px solid ${CONTRACT_TYPE_COLORS[type]}` }}>
              <p className="text-xs font-semibold text-gray-400 mb-1 truncate">{label}</p>
              <p className="text-2xl font-bold" style={{ color: CONTRACT_TYPE_COLORS[type] }}>{count}</p>
              <p className="text-xs text-gray-400">{signed} signed</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Contract Templates</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#56A837" }}>
          <Plus size={13} /> New Contract
        </Button>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No contracts created yet. Use the templates to generate NNN, Manufacturing, Tooling, Quality, and Logistics agreements.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {contracts.map((c: any) => {
            const checklist = getChecklist(c);
            const checkedCount = Object.values(checklist).filter(Boolean).length;
            const totalClauses = Object.keys(checklist).length;
            return (
              <div key={c.id} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${CONTRACT_TYPE_COLORS[c.contractType] ?? "#e5e7eb"}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{CONTRACT_TYPE_LABELS[c.contractType] ?? c.contractType}</p>
                    {c.supplierName && <p className="text-xs text-gray-400">{c.supplierName}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {c.status}
                    </span>
                    <button onClick={() => setViewDraft(c)} className="p-1 rounded hover:bg-gray-100" title="View draft"><FileText size={12} className="text-blue-400" /></button>
                    <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-gray-100"><Pencil size={12} className="text-gray-400" /></button>
                    <button onClick={() => del.mutate({ id: c.id })} className="p-1 rounded hover:bg-gray-100"><Trash2 size={12} className="text-red-400" /></button>
                  </div>
                </div>
                {/* Clause progress */}
                {totalClauses > 0 && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Clauses reviewed</span>
                      <span>{checkedCount}/{totalClauses}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${totalClauses > 0 ? (checkedCount / totalClauses) * 100 : 0}%`, background: CONTRACT_TYPE_COLORS[c.contractType] ?? "#56A837" }} />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                  <span>Jurisdiction: {c.jurisdiction}</span>
                  {c.incoterms && <span>Incoterms: {c.incoterms}</span>}
                  {c.penaltyClause && <span className="text-orange-600">Penalty clause</span>}
                  {c.ipOwnershipClause && <span className="text-blue-600">IP ownership</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Contract" : "Create Contract Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Contract Type *</Label>
                <Select value={form.contractType} onValueChange={v => setForm(s => ({ ...s, contractType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTRACT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Supplier Name</Label><Input value={form.supplierName} onChange={e => setForm(s => ({ ...s, supplierName: e.target.value }))} /></div>
              <div><Label className="text-xs">Jurisdiction</Label><Input value={form.jurisdiction} onChange={e => setForm(s => ({ ...s, jurisdiction: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Incoterms</Label>
                <Select value={form.incoterms} onValueChange={v => setForm(s => ({ ...s, incoterms: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["EXW", "FOB", "CIF", "DDP", "DAP"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(s => ({ ...s, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["draft", "under_review", "signed", "expired", "terminated"].map(v => <SelectItem key={v} value={v}>{v.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4 pt-5">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.penaltyClause} onChange={e => setForm(s => ({ ...s, penaltyClause: e.target.checked }))} />
                  Penalty Clause
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.ipOwnershipClause} onChange={e => setForm(s => ({ ...s, ipOwnershipClause: e.target.checked }))} />
                  IP Ownership
                </label>
              </div>
            </div>
            {/* Default clauses preview */}
            {defaultClauses && defaultClauses.clauses.length > 0 && (
              <div className="border rounded-lg p-3" style={{ borderColor: "#e5e7eb" }}>
                <p className="text-xs font-bold text-gray-700 mb-2">Standard Clauses for this Contract Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {defaultClauses.clauses.map(clause => (
                    <span key={clause} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{clause}</span>
                  ))}
                </div>
              </div>
            )}
            {/* AI Draft generation */}
            <div className="border rounded-lg p-4 space-y-3" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><Sparkles size={13} className="text-purple-500" /> AI Draft Generation</p>
              <Input value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} placeholder="Optional: additional context (product type, special terms...)" />
              <Button size="sm" variant="outline" onClick={handleGenerateDraft} disabled={generating} className="gap-1.5 text-xs">
                {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {generating ? "Generating..." : "Generate AI Draft"}
              </Button>
            </div>
            <div>
              <Label className="text-xs">Contract Draft Text</Label>
              <Textarea value={form.draftText} onChange={e => setForm(s => ({ ...s, draftText: e.target.value }))} rows={8} placeholder="Contract draft will appear here after generation, or enter manually..." className="font-mono text-xs" />
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))} rows={2} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={upsert.isPending} style={{ background: "#56A837" }}>
                {upsert.isPending ? <Loader2 size={14} className="animate-spin" /> : "Save Contract"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Draft Dialog */}
      <Dialog open={!!viewDraft} onOpenChange={() => setViewDraft(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewDraft ? CONTRACT_TYPE_LABELS[viewDraft.contractType] : ""}</DialogTitle>
          </DialogHeader>
          {viewDraft && (
            <div className="mt-2">
              <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
                {viewDraft.supplierName && <span>Supplier: <strong>{viewDraft.supplierName}</strong></span>}
                <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[viewDraft.status] ?? "bg-gray-100 text-gray-600"}`}>{viewDraft.status}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {viewDraft.draftText || "No draft text available. Edit the contract to generate or enter draft text."}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
