// ============================================================
// FMEA ENGINEERING RISK & MITIGATION MODULE
// Failure Mode & Effects Analysis — Risk Priority Number (RPN)
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// ── RPN Colour Logic ──────────────────────────────────────────────────────────
function getRpnLevel(rpn: number, severity?: number): "critical" | "warning" | "safe" {
  if (rpn > 100 || (severity !== undefined && severity >= 9)) return "critical";
  if (rpn >= 50) return "warning";
  return "safe";
}

const RPN_STYLES = {
  critical: {
    badge: "bg-red-100 text-red-700 border-red-300 font-bold",
    row: "bg-red-50/60",
    icon: <ShieldAlert size={14} className="text-red-600" />,
  },
  warning: {
    badge: "bg-amber-100 text-amber-700 border-amber-300 font-bold",
    row: "bg-amber-50/40",
    icon: <AlertTriangle size={14} className="text-amber-600" />,
  },
  safe: {
    badge: "bg-green-100 text-green-700 border-green-300 font-bold",
    row: "",
    icon: <ShieldCheck size={14} className="text-green-600" />,
  },
};

function RpnBadge({ rpn, severity }: { rpn: number; severity?: number }) {
  const level = getRpnLevel(rpn, severity);
  const style = RPN_STYLES[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${style.badge}`}>
      {style.icon}
      {rpn}
    </span>
  );
}

// ── Score Slider ──────────────────────────────────────────────────────────────
function ScoreInput({
  label, value, onChange, hint,
}: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs font-semibold text-gray-600">
        {label}
        {hint && <span className="ml-1 text-gray-400 font-normal">({hint})</span>}
      </Label>
      <div className="flex items-center gap-2">
        <input type="range" min={1} max={10} value={value}
          onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-green-600" />
        <span className={`w-8 text-center text-sm font-bold rounded ${value >= 9 ? "text-red-600" : value >= 7 ? "text-amber-600" : "text-green-700"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ── Add Risk Dialog ───────────────────────────────────────────────────────────
function AddRiskDialog({ ventureId, open, onClose, onSaved }: {
  ventureId: string; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    componentName: "", failureMode: "", failureEffect: "",
    severity: 5, occurrence: 5, detection: 5, relatedTrlStage: "none", notes: "",
  });

  const addRisk = trpc.fmea.addRisk.useMutation({
    onSuccess: () => {
      toast.success("Risk added to register");
      onSaved(); onClose();
      setForm({ componentName: "", failureMode: "", failureEffect: "", severity: 5, occurrence: 5, detection: 5, relatedTrlStage: "none", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const rpnPreview = form.severity * form.occurrence * form.detection;
  const rpnLevel = getRpnLevel(rpnPreview, form.severity);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-500" /> Add Engineering Risk (FMEA)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold text-gray-600">Component / System *</Label>
            <Input placeholder="e.g. Thermal Management System" value={form.componentName}
              onChange={(e) => setForm({ ...form, componentName: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600">Failure Mode *</Label>
            <Input placeholder="e.g. Liquid coolant leakage during operation" value={form.failureMode}
              onChange={(e) => setForm({ ...form, failureMode: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600">Failure Effect *</Label>
            <Textarea placeholder="e.g. Short circuit of main PCB, complete system failure" value={form.failureEffect}
              onChange={(e) => setForm({ ...form, failureEffect: e.target.value })} className="mt-1 min-h-[60px]" />
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">RPN Scores</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Preview:</span>
                <RpnBadge rpn={rpnPreview} severity={form.severity} />
              </div>
            </div>
            <ScoreInput label="Severity (S)" value={form.severity} onChange={(v) => setForm({ ...form, severity: v })} hint="1=negligible, 10=catastrophic" />
            <ScoreInput label="Occurrence (O)" value={form.occurrence} onChange={(v) => setForm({ ...form, occurrence: v })} hint="1=remote, 10=almost certain" />
            <ScoreInput label="Detection (D)" value={form.detection} onChange={(v) => setForm({ ...form, detection: v })} hint="1=certain detect, 10=impossible" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-gray-600">Related TRL Stage</Label>
              <Select value={form.relatedTrlStage} onValueChange={(v) => setForm({ ...form, relatedTrlStage: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {[1,2,3,4,5,6,7,8,9].map(n => <SelectItem key={n} value={String(n)}>TRL {n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Notes</Label>
              <Input placeholder="Optional context" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" />
            </div>
          </div>
          {rpnLevel === "critical" && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span><strong>Critical RPN detected.</strong> This risk will trigger a TRL Blocker warning until a mitigation is marked Implemented or Verified.</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => addRisk.mutate({
              ventureId, componentName: form.componentName, failureMode: form.failureMode,
              failureEffect: form.failureEffect, severity: form.severity, occurrence: form.occurrence,
              detection: form.detection,
              relatedTrlStage: form.relatedTrlStage !== "none" ? Number(form.relatedTrlStage) : undefined,
              notes: form.notes || undefined,
            })}
            disabled={!form.componentName || !form.failureMode || !form.failureEffect || addRisk.isPending}
            className="bg-green-700 hover:bg-green-800 text-white"
          >
            {addRisk.isPending ? "Saving…" : "Add Risk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Mitigation Dialog ─────────────────────────────────────────────────────
function AddMitigationDialog({ riskId, riskComponent, open, onClose, onSaved }: {
  riskId: number; riskComponent: string; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    actionDescription: "", owner: "",
    status: "Identified" as "Identified" | "In Progress" | "Implemented" | "Verified",
    revisedSeverity: 3, revisedOccurrence: 3, revisedDetection: 3,
  });

  const addMitigation = trpc.fmea.addMitigation.useMutation({
    onSuccess: () => { toast.success("Mitigation action added"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const revisedRpn = form.revisedSeverity * form.revisedOccurrence * form.revisedDetection;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield size={18} className="text-green-600" /> Add Mitigation Action
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">For: <span className="font-semibold text-gray-700">{riskComponent}</span></p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold text-gray-600">Action Description *</Label>
            <Textarea placeholder="e.g. Switch to non-conductive dielectric fluid and add secondary containment lip"
              value={form.actionDescription} onChange={(e) => setForm({ ...form, actionDescription: e.target.value })}
              className="mt-1 min-h-[70px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-gray-600">Owner</Label>
              <Input placeholder="e.g. Lead Engineer" value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Identified","In Progress","Implemented","Verified"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 space-y-3 border border-green-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Revised RPN Scores</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Revised RPN:</span>
                <RpnBadge rpn={revisedRpn} />
              </div>
            </div>
            <ScoreInput label="Revised Severity (rS)" value={form.revisedSeverity} onChange={(v) => setForm({ ...form, revisedSeverity: v })} />
            <ScoreInput label="Revised Occurrence (rO)" value={form.revisedOccurrence} onChange={(v) => setForm({ ...form, revisedOccurrence: v })} />
            <ScoreInput label="Revised Detection (rD)" value={form.revisedDetection} onChange={(v) => setForm({ ...form, revisedDetection: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => addMitigation.mutate({
              riskId, actionDescription: form.actionDescription, owner: form.owner || undefined,
              status: form.status, revisedSeverity: form.revisedSeverity,
              revisedOccurrence: form.revisedOccurrence, revisedDetection: form.revisedDetection,
            })}
            disabled={!form.actionDescription || addMitigation.isPending}
            className="bg-green-700 hover:bg-green-800 text-white"
          >
            {addMitigation.isPending ? "Saving…" : "Add Mitigation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Mitigation Status Badge ───────────────────────────────────────────────────
const MITIGATION_STATUS_STYLES: Record<string, string> = {
  Identified: "bg-gray-100 text-gray-600 border-gray-300",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-300",
  Implemented: "bg-amber-100 text-amber-700 border-amber-300",
  Verified: "bg-green-100 text-green-700 border-green-300",
};

function MitigationStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${MITIGATION_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// ── Expandable Risk Row ───────────────────────────────────────────────────────
type RiskRecord = {
  id: number; ventureId: string; componentName: string; failureMode: string;
  failureEffect: string; severity: number; occurrence: number; detection: number;
  initialRpn: number; relatedTrlStage: number | null; notes: string | null;
};

function RiskRow({ risk, onDeleted }: { risk: RiskRecord; onDeleted: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [addMitigOpen, setAddMitigOpen] = useState(false);

  const rpnLevel = getRpnLevel(risk.initialRpn, risk.severity);
  const rpnStyle = RPN_STYLES[rpnLevel];

  const { data: mitigations, refetch } = trpc.fmea.listMitigations.useQuery(
    { riskId: risk.id }, { enabled: expanded }
  );

  const deleteRisk = trpc.fmea.deleteRisk.useMutation({
    onSuccess: () => { toast.success("Risk removed"); onDeleted(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMitigation = trpc.fmea.updateMitigation.useMutation({
    onSuccess: () => { refetch(); toast.success("Status updated"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMitigation = trpc.fmea.deleteMitigation.useMutation({
    onSuccess: () => { refetch(); toast.success("Mitigation removed"); },
    onError: (e) => toast.error(e.message),
  });

  const activeMitigation = mitigations
    ?.filter(m => m.status === "Implemented" || m.status === "Verified")
    .sort((a, b) => (a.revisedRpn ?? 999) - (b.revisedRpn ?? 999))[0];

  return (
    <>
      <tr className={`border-b transition-colors cursor-pointer hover:bg-gray-50 group ${rpnStyle.row}`}
        style={{ borderColor: "#f3f4f6" }} onClick={() => setExpanded(!expanded)}>
        <td className="py-3 pl-4 pr-2 w-6">
          {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        </td>
        <td className="py-3 pr-4">
          <div className="font-semibold text-sm text-gray-800">{risk.componentName}</div>
          {risk.relatedTrlStage && <span className="text-xs text-blue-600 font-mono">TRL {risk.relatedTrlStage}</span>}
        </td>
        <td className="py-3 pr-4 text-sm text-gray-700 max-w-[200px]">
          <div className="truncate" title={risk.failureMode}>{risk.failureMode}</div>
        </td>
        <td className="py-3 pr-4 text-sm text-gray-500 max-w-[200px] hidden lg:table-cell">
          <div className="truncate" title={risk.failureEffect}>{risk.failureEffect}</div>
        </td>
        <td className="py-3 pr-3 text-center">
          <span className={`text-sm font-bold ${risk.severity >= 9 ? "text-red-600" : risk.severity >= 7 ? "text-amber-600" : "text-gray-700"}`}>{risk.severity}</span>
        </td>
        <td className="py-3 pr-3 text-center"><span className="text-sm font-bold text-gray-700">{risk.occurrence}</span></td>
        <td className="py-3 pr-3 text-center"><span className="text-sm font-bold text-gray-700">{risk.detection}</span></td>
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2">
            <RpnBadge rpn={risk.initialRpn} severity={risk.severity} />
            {activeMitigation && (
              <><span className="text-gray-300 text-xs">→</span><RpnBadge rpn={activeMitigation.revisedRpn ?? 0} /></>
            )}
          </div>
        </td>
        <td className="py-3 pr-4">
          <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this risk and all its mitigations?")) deleteRisk.mutate({ id: risk.id }); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all">
            <Trash2 size={13} className="text-red-400" />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr style={{ borderColor: "#f3f4f6" }} className="border-b">
          <td colSpan={9} className="bg-gray-50/80 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Mitigation Actions</span>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => setAddMitigOpen(true)}>
                <Plus size={12} /> Add Mitigation
              </Button>
            </div>
            {!mitigations || mitigations.length === 0 ? (
              <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                <Info size={14} />
                No mitigation actions yet.{" "}
                {risk.initialRpn > 100 && <span className="text-red-500 font-medium">⚠ High RPN — add a mitigation to clear the TRL blocker.</span>}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
                    <th className="text-left pb-2 pr-4">Action</th>
                    <th className="text-left pb-2 pr-4">Owner</th>
                    <th className="text-left pb-2 pr-4">Status</th>
                    <th className="text-center pb-2 pr-4">rS</th>
                    <th className="text-center pb-2 pr-4">rO</th>
                    <th className="text-center pb-2 pr-4">rD</th>
                    <th className="text-left pb-2 pr-4">Revised RPN</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {mitigations.map(m => (
                    <tr key={m.id} className="border-t" style={{ borderColor: "#e5e7eb" }}>
                      <td className="py-2 pr-4 text-gray-700 max-w-[240px]"><div className="text-xs">{m.actionDescription}</div></td>
                      <td className="py-2 pr-4 text-xs text-gray-500">{m.owner ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <Select value={m.status}
                          onValueChange={(v) => updateMitigation.mutate({ id: m.id, status: v as "Identified" | "In Progress" | "Implemented" | "Verified" })}>
                          <SelectTrigger className="h-7 text-xs w-36 border-0 bg-transparent p-0 shadow-none focus:ring-0">
                            <MitigationStatusBadge status={m.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {["Identified","In Progress","Implemented","Verified"].map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-4 text-center text-xs font-bold text-gray-600">{m.revisedSeverity}</td>
                      <td className="py-2 pr-4 text-center text-xs font-bold text-gray-600">{m.revisedOccurrence}</td>
                      <td className="py-2 pr-4 text-center text-xs font-bold text-gray-600">{m.revisedDetection}</td>
                      <td className="py-2 pr-4">
                        {(m.status === "Implemented" || m.status === "Verified")
                          ? <RpnBadge rpn={m.revisedRpn ?? 0} />
                          : <span className="text-xs text-gray-400 italic">pending</span>}
                      </td>
                      <td className="py-2">
                        <button onClick={() => deleteMitigation.mutate({ id: m.id })}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50">
                          <Trash2 size={11} className="text-red-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}

      {addMitigOpen && (
        <AddMitigationDialog riskId={risk.id} riskComponent={risk.componentName}
          open={addMitigOpen} onClose={() => setAddMitigOpen(false)} onSaved={() => refetch()} />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RiskManagement() {
  const { ventures } = useVentures();
  const [selectedVentureId, setSelectedVentureId] = useState(ventures[0]?.id ?? "ecoblend");
  const [addRiskOpen, setAddRiskOpen] = useState(false);

  const selectedVenture = ventures.find(v => v.id === selectedVentureId);

  const { data: risks, refetch, isLoading } = trpc.fmea.listRisks.useQuery(
    { ventureId: selectedVentureId }, { enabled: !!selectedVentureId }
  );

  const { data: blockerData } = trpc.fmea.trlBlockerCheck.useQuery(
    { ventureId: selectedVentureId }, { enabled: !!selectedVentureId }
  );

  const criticalCount = risks?.filter(r => r.initialRpn > 100 || r.severity >= 9).length ?? 0;
  const highCount = risks?.filter(r => r.initialRpn >= 50 && r.initialRpn <= 100).length ?? 0;
  const avgRpn = risks && risks.length > 0
    ? Math.round(risks.reduce((a, r) => a + r.initialRpn, 0) / risks.length) : 0;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "#dc262615", color: "#dc2626" }}>FMEA</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">Engineering Risk Register</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Risk Management
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Failure Mode &amp; Effects Analysis (FMEA) — log engineering risks, calculate Risk Priority Numbers (RPN = S × O × D), and link mitigation actions to TRL progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedVentureId} onValueChange={setSelectedVentureId}>
              <SelectTrigger className="w-40 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ventures.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setAddRiskOpen(true)}>
              <Plus size={13} /> Add Risk
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* TRL Blocker Banner */}
        {blockerData?.hasBlocker && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={20} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-700">
                TRL Advancement Blocked — {blockerData.blockerCount} unmitigated critical risk{blockerData.blockerCount > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {selectedVenture?.name} has {blockerData.blockerCount} engineering risk{blockerData.blockerCount > 1 ? "s" : ""} with RPN &gt; 100 and no Implemented or Verified mitigation. Resolve these before advancing to the next TRL level.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {blockerData.risks.map(r => (
                  <span key={r.id} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-300">
                    {r.componentName} (RPN {r.initialRpn})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Total Risks</span>
            <div className="text-3xl font-bold mt-1" style={{ fontFamily: "'Prompt', sans-serif", color: "#1a2332" }}>{risks?.length ?? 0}</div>
            <span className="text-xs text-gray-400">logged in register</span>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#fca5a5" }}>
            <span className="text-xs font-semibold uppercase tracking-widest text-red-400">Critical (RPN &gt;100)</span>
            <div className="text-3xl font-bold mt-1 text-red-600" style={{ fontFamily: "'Prompt', sans-serif" }}>{criticalCount}</div>
            <span className="text-xs text-gray-400">require immediate action</span>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#fcd34d" }}>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">High (RPN 50–100)</span>
            <div className="text-3xl font-bold mt-1 text-amber-600" style={{ fontFamily: "'Prompt', sans-serif" }}>{highCount}</div>
            <span className="text-xs text-gray-400">monitor closely</span>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#86efac" }}>
            <span className="text-xs font-semibold uppercase tracking-widest text-green-500">Avg RPN</span>
            <div className="text-3xl font-bold mt-1" style={{ fontFamily: "'Prompt', sans-serif", color: avgRpn > 100 ? "#dc2626" : avgRpn >= 50 ? "#d97706" : "#16a34a" }}>{avgRpn}</div>
            <span className="text-xs text-gray-400">portfolio average</span>
          </div>
        </div>

        {/* FMEA Table */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#f3f4f6" }}>
            <div>
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                FMEA Risk Register
                {selectedVenture && <span className="ml-2 text-sm font-normal text-gray-400">— {selectedVenture.name}</span>}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Click any row to expand mitigation actions · RPN = Severity × Occurrence × Detection</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Critical (&gt;100)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> High (50–100)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Low (&lt;50)</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60" style={{ borderColor: "#f3f4f6" }}>
                  <th className="py-3 pl-4 pr-2 w-6" />
                  <th className="text-left py-3 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Component</th>
                  <th className="text-left py-3 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Failure Mode</th>
                  <th className="text-left py-3 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400 hidden lg:table-cell">Effect</th>
                  <th className="text-center py-3 pr-3 text-xs font-semibold uppercase tracking-widest text-gray-400">S</th>
                  <th className="text-center py-3 pr-3 text-xs font-semibold uppercase tracking-widest text-gray-400">O</th>
                  <th className="text-center py-3 pr-3 text-xs font-semibold uppercase tracking-widest text-gray-400">D</th>
                  <th className="text-left py-3 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-400">RPN</th>
                  <th className="py-3 pr-4 w-8" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} className="py-12 text-center text-gray-400 text-sm">Loading risks…</td></tr>
                ) : !risks || risks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <ShieldCheck size={36} className="text-green-300" />
                        <p className="text-gray-500 font-medium">No risks logged yet</p>
                        <p className="text-xs text-gray-400 max-w-xs">Add your first engineering risk to begin the FMEA analysis for {selectedVenture?.name}.</p>
                        <Button size="sm" className="mt-1 bg-red-600 hover:bg-red-700 text-white gap-1" onClick={() => setAddRiskOpen(true)}>
                          <Plus size={13} /> Add First Risk
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  [...risks].sort((a, b) => b.initialRpn - a.initialRpn).map(risk => (
                    <RiskRow key={risk.id} risk={risk} onDeleted={refetch} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FMEA Scoring Guide */}
        <div className="bg-gray-50 rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">FMEA Scoring Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
            <div>
              <p className="font-semibold text-gray-700 mb-1">Severity (S)</p>
              <p>How severe is the effect if the failure occurs?</p>
              <p className="mt-1 text-gray-400">1 = No effect · 5 = Moderate · 10 = Catastrophic</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">Occurrence (O)</p>
              <p>How likely is the failure to occur?</p>
              <p className="mt-1 text-gray-400">1 = Remote · 5 = Occasional · 10 = Almost certain</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">Detection (D)</p>
              <p>How difficult is it to detect before reaching the user?</p>
              <p className="mt-1 text-gray-400">1 = Certain detect · 5 = Moderate · 10 = Impossible</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t text-xs text-gray-500" style={{ borderColor: "#e5e7eb" }}>
            <strong>RPN = S × O × D</strong> · Critical: &gt;100 (or S ≥ 9) · High: 50–100 · Low: &lt;50
          </div>
        </div>
      </div>

      {addRiskOpen && (
        <AddRiskDialog ventureId={selectedVentureId} open={addRiskOpen}
          onClose={() => setAddRiskOpen(false)} onSaved={refetch} />
      )}
    </div>
  );
}
