// ============================================================
// Operations — Supplier Assessment  /operations/suppliers
// Supplier directory with risk scoring and single-source alerts
// ============================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Truck, Plus, Pencil, Trash2, AlertTriangle,
  CheckCircle2, Clock, XCircle, Search, ShieldAlert,
} from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

// ── Constants ─────────────────────────────────────────────────────────────────

const RISK_LEVELS = [
  { value: "low",    label: "Low",    color: "#16a34a", bg: "#f0fdf4" },
  { value: "medium", label: "Medium", color: "#F69111", bg: "#fff7ed" },
  { value: "high",   label: "High",   color: "#dc2626", bg: "#fef2f2" },
];

const AUDIT_STATUSES = [
  { value: "not_audited", label: "Not Audited", Icon: Clock,        color: "#6b7280" },
  { value: "in_progress", label: "In Progress", Icon: AlertTriangle, color: "#F69111" },
  { value: "approved",    label: "Approved",    Icon: CheckCircle2,  color: "#16a34a" },
  { value: "rejected",    label: "Rejected",    Icon: XCircle,       color: "#dc2626" },
];

const EMPTY_FORM = {
  supplierName:      "",
  componentSupplied: "",
  leadTimeDays:      "",
  moq:               "",
  unitCost:          "",
  riskLevel:         "medium" as const,
  singleSource:      false,
  auditStatus:       "not_audited" as const,
  notes:             "",
};
type FormState = typeof EMPTY_FORM;

function riskCfg(r: string) { return RISK_LEVELS.find(x => x.value === r) ?? RISK_LEVELS[1]; }
function auditCfg(a: string) { return AUDIT_STATUSES.find(x => x.value === a) ?? AUDIT_STATUSES[0]; }

// ── Supplier Modal ────────────────────────────────────────────────────────────

function SupplierModal({ open, onClose, ventureId, editId, initialForm, onSaved }: {
  open: boolean; onClose: () => void; ventureId: string;
  editId?: number; initialForm: FormState; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const upsert = trpc.operations.suppliers.upsert.useMutation({
    onSuccess: () => { toast.success(editId ? "Supplier updated." : "Supplier added."); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Supplier Name *</label>
            <Input value={form.supplierName} onChange={e => set("supplierName", e.target.value)} placeholder="e.g. UK Hemp Processors Ltd" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Component / Material Supplied</label>
            <Input value={form.componentSupplied} onChange={e => set("componentSupplied", e.target.value)} placeholder="e.g. Hemp Fibre Bale, Flax Straw" className="mt-1" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Lead Time (days)</label>
              <Input type="number" min={0} value={form.leadTimeDays} onChange={e => set("leadTimeDays", e.target.value)} placeholder="14" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">MOQ (units)</label>
              <Input type="number" min={0} value={form.moq} onChange={e => set("moq", e.target.value)} placeholder="500" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Unit Cost (£)</label>
              <Input type="number" min={0} step="0.0001" value={form.unitCost} onChange={e => set("unitCost", e.target.value)} placeholder="0.85" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Risk Level *</label>
              <Select value={form.riskLevel} onValueChange={v => set("riskLevel", v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Audit Status</label>
              <Select value={form.auditStatus} onValueChange={v => set("auditStatus", v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIT_STATUSES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: "#e5e7eb" }}>
            <input
              type="checkbox"
              id="single-source"
              checked={form.singleSource}
              onChange={e => set("singleSource", e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <label htmlFor="single-source" className="text-sm text-gray-700">
              <span className="font-semibold">Single-source supplier</span>
              <span className="text-gray-400 ml-1 text-xs">— flags a supply chain concentration risk</span>
            </label>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Notes</label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Backup suppliers, contractual terms, certification status…" rows={2} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.supplierName.trim() || upsert.isPending}
            onClick={() => upsert.mutate({
              id: editId, ventureId, ...form,
              leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
              moq:          form.moq ? Number(form.moq) : undefined,
            })}
            style={{ background: "#56A837" }}
          >
            {upsert.isPending ? "Saving…" : editId ? "Save Changes" : "Add Supplier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OpsSuppliers() {
  const { selectedVentureId } = useSelectedVenture();
  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState<{ id: number; form: FormState } | null>(null);
  const [search, setSearch]         = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("all");

  const { data: allSuppliers = [], refetch } = trpc.operations.suppliers.list.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );
  const { data: summary } = trpc.operations.suppliers.riskSummary.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );

  const deleteSupplier = trpc.operations.suppliers.delete.useMutation({
    onSuccess: () => { toast.success("Supplier deleted."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = allSuppliers.filter(s => {
    const matchSearch = !search || s.supplierName.toLowerCase().includes(search.toLowerCase()) || (s.componentSupplied ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRisk   = filterRisk === "all" || s.riskLevel === filterRisk;
    return matchSearch && matchRisk;
  });

  const openAdd = () => { setEditItem(null); setModalOpen(true); };
  const openEdit = (s: typeof allSuppliers[0]) => {
    setEditItem({ id: s.id, form: {
      supplierName:      s.supplierName,
      componentSupplied: s.componentSupplied ?? "",
      leadTimeDays:      s.leadTimeDays?.toString() ?? "",
      moq:               s.moq?.toString() ?? "",
      unitCost:          s.unitCost?.toString() ?? "",
      riskLevel:         s.riskLevel as any,
      singleSource:      s.singleSource ?? false,
      auditStatus:       s.auditStatus as any,
      notes:             s.notes ?? "",
    }});
    setModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <ModuleHeader
        icon={<Truck size={20} />}
        title="Supplier Assessment"
        purpose="Supplier directory with risk ratings, single-source alerts, and audit status tracking."
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openAdd}><Plus size={14} /> Add Supplier</Button>}
      />

      <div className="space-y-6">
        <VentureSelector />

        {!selectedVentureId ? <NoVentureState /> : (
          <>
            {/* Risk summary cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Suppliers",     value: summary?.total ?? 0,              color: "#56A837", Icon: Truck },
                { label: "Single-Source Risk",  value: summary?.singleSourceCount ?? 0,  color: "#F69111", Icon: ShieldAlert },
                { label: "High Risk",           value: summary?.highRiskCount ?? 0,       color: "#dc2626", Icon: AlertTriangle },
                { label: "Avg. Lead Time",      value: `${summary?.avgLeadTime ?? 0}d`,   color: "#3B85BA", Icon: Clock },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <c.Icon size={14} style={{ color: c.color }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{c.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Single-source warning banner */}
            {(summary?.singleSourceCount ?? 0) > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "#fff7ed", borderColor: "#fed7aa" }}>
                <AlertTriangle size={16} className="text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">
                    Single-source concentration risk — {summary?.singleSourceCount} component{summary!.singleSourceCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    These components rely on a single supplier. Any disruption will halt production. Qualify alternative suppliers urgently.
                  </p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers or components…" className="pl-9 h-9 text-sm" />
              </div>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Risk level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risk levels</SelectItem>
                  {RISK_LEVELS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {allSuppliers.length === 0 ? (
              <EmptyState
                icon={<Truck size={32} />}
                title="No suppliers recorded"
                description="Add your supply chain partners to track lead times, costs, risk levels, and audit status."
                action={<Button size="sm" onClick={openAdd} style={{ background: "#56A837" }}><Plus size={14} className="mr-1" /> Add Supplier</Button>}
              />
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ background: "#fafafa", borderColor: "#f3f4f6" }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Supplier</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Component</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Lead Time</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">MOQ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Unit Cost</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Risk</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Audit</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => {
                      const rc = riskCfg(s.riskLevel);
                      const ac = auditCfg(s.auditStatus);
                      return (
                        <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#f3f4f6" }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{s.supplierName}</span>
                              {s.singleSource && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0" style={{ borderColor: "#F69111", color: "#F69111", background: "#fff7ed" }}>
                                  Single Source
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{s.componentSupplied ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-700">{s.leadTimeDays != null ? `${s.leadTimeDays}d` : "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-700">{s.moq != null ? s.moq.toLocaleString() : "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-700">{s.unitCost != null ? `£${parseFloat(s.unitCost).toFixed(4)}` : "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: rc.color, color: rc.color, background: rc.bg }}>{rc.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] gap-1" style={{ borderColor: ac.color, color: ac.color }}>
                              <ac.Icon size={9} />{ac.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(s)}><Pencil size={12} /></Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                onClick={() => { if (confirm("Delete this supplier?")) deleteSupplier.mutate({ id: s.id }); }}>
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && allSuppliers.length > 0 && (
                  <div className="text-center py-8 text-sm text-gray-400">No suppliers match your filters.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <SupplierModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        ventureId={selectedVentureId ?? ""}
        editId={editItem?.id}
        initialForm={editItem?.form ?? EMPTY_FORM}
        onSaved={refetch}
      />
    </div>
  );
}
