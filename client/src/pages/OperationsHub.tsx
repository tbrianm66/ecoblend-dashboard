// ============================================================
// Operations & Manufacturing Hub — /operations
// Operating Model overview page (Module 6 landing)
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
  Factory, Plus, Pencil, Trash2,
  PackageCheck, Boxes, DollarSign, MapPin, CheckCircle2, Clock, Archive,
} from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

// ── Constants ─────────────────────────────────────────────────────────────────

const MODEL_TYPES = [
  { value: "in_house",     label: "In-House",          desc: "Full manufacturing owned internally" },
  { value: "contract_cmo", label: "Contract CMO",       desc: "Third-party contract manufacturing" },
  { value: "hybrid",       label: "Hybrid",             desc: "Mix of in-house and contract" },
  { value: "outsourced",   label: "Fully Outsourced",   desc: "All manufacturing outsourced" },
];

const STATUSES = [
  { value: "draft",    label: "Draft",    color: "#6b7280", bg: "#f3f4f6", Icon: Clock },
  { value: "active",   label: "Active",   color: "#16a34a", bg: "#f0fdf4", Icon: CheckCircle2 },
  { value: "archived", label: "Archived", color: "#9ca3af", bg: "#f9fafb", Icon: Archive },
];

const EMPTY_FORM = {
  modelType:             "in_house" as const,
  capacityUnitsPerMonth: "" as string,
  unitOpCost:            "",
  facilityLocation:      "",
  status:                "draft" as const,
  notes:                 "",
};
type FormState = typeof EMPTY_FORM;

function typeCfg(t: string) { return MODEL_TYPES.find(m => m.value === t) ?? MODEL_TYPES[0]; }
function statusCfg(s: string) { return STATUSES.find(x => x.value === s) ?? STATUSES[0]; }

// ── Model Modal ───────────────────────────────────────────────────────────────

function ModelModal({ open, onClose, ventureId, editId, initialForm, onSaved }: {
  open: boolean; onClose: () => void; ventureId: string;
  editId?: number; initialForm: FormState; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const upsert = trpc.operations.model.upsert.useMutation({
    onSuccess: () => { toast.success(editId ? "Model updated." : "Model added."); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Operating Model" : "Add Operating Model"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Model Type *</label>
            <Select value={form.modelType} onValueChange={v => set("modelType", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODEL_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="font-medium">{t.label}</span>
                    <span className="text-gray-400 ml-2 text-xs">{t.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Capacity (units/month)</label>
              <Input type="number" min={0} value={form.capacityUnitsPerMonth} onChange={e => set("capacityUnitsPerMonth", e.target.value)} placeholder="e.g. 5000" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Unit Op. Cost (£)</label>
              <Input type="number" min={0} step="0.01" value={form.unitOpCost} onChange={e => set("unitOpCost", e.target.value)} placeholder="e.g. 3.50" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Facility Location</label>
            <Input value={form.facilityLocation} onChange={e => set("facilityLocation", e.target.value)} placeholder="e.g. Hereford, UK" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
            <Select value={form.status} onValueChange={v => set("status", v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Notes</label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Key constraints, partner relationships, investment plan…" rows={3} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={upsert.isPending}
            onClick={() => upsert.mutate({
              id: editId, ventureId, ...form,
              capacityUnitsPerMonth: form.capacityUnitsPerMonth ? Number(form.capacityUnitsPerMonth) : undefined,
            })}
            style={{ background: "#56A837" }}
          >
            {upsert.isPending ? "Saving…" : editId ? "Save Changes" : "Add Model"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OperationsHub() {
  const { selectedVentureId } = useSelectedVenture();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModel, setEditModel] = useState<{ id: number; form: FormState } | null>(null);

  const { data: models = [], refetch } = trpc.operations.model.list.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );

  const deleteModel = trpc.operations.model.delete.useMutation({
    onSuccess: () => { toast.success("Model deleted."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const active   = models.filter(m => m.status === "active").length;
  const draft    = models.filter(m => m.status === "draft").length;
  const capacity = models.reduce((s, m) => s + (m.capacityUnitsPerMonth ?? 0), 0);

  const openAdd = () => { setEditModel(null); setModalOpen(true); };
  const openEdit = (m: typeof models[0]) => {
    setEditModel({ id: m.id, form: {
      modelType:             m.modelType as any,
      capacityUnitsPerMonth: m.capacityUnitsPerMonth?.toString() ?? "",
      unitOpCost:            m.unitOpCost?.toString() ?? "",
      facilityLocation:      m.facilityLocation ?? "",
      status:                m.status as any,
      notes:                 m.notes ?? "",
    }});
    setModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <ModuleHeader
        icon={<Factory size={20} />}
        title="Operating Model"
        purpose="Design your manufacturing footprint — in-house, CMO, hybrid or outsourced — with cost and capacity planning."
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openAdd}><Plus size={14} /> Add Model</Button>}
      />

      <div className="space-y-6">
        <VentureSelector />

        {!selectedVentureId ? <NoVentureState /> : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Models",   value: models.length, color: "#56A837", Icon: Factory },
                { label: "Active",         value: active,        color: "#16a34a", Icon: CheckCircle2 },
                { label: "Draft",          value: draft,         color: "#F69111", Icon: Clock },
                { label: "Total Capacity", value: `${capacity.toLocaleString()} u/mo`, color: "#3B85BA", Icon: Boxes },
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

            {/* Model cards */}
            {models.length === 0 ? (
              <EmptyState
                icon={<Factory size={32} />}
                title="No operating models defined"
                description="Define your manufacturing approach — in-house, contract CMO, hybrid or fully outsourced — with capacity and cost targets."
                action={<Button size="sm" onClick={openAdd} style={{ background: "#56A837" }}><Plus size={14} className="mr-1" /> Add Model</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {models.map(m => {
                  const tc = typeCfg(m.modelType);
                  const sc = statusCfg(m.status);
                  return (
                    <div key={m.id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid #56A837` }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-xs" style={{ borderColor: "#56A837", color: "#56A837" }}>{tc.label}</Badge>
                            <Badge variant="outline" className="text-[10px] gap-1" style={{ borderColor: sc.color, color: sc.color, background: sc.bg }}>
                              <sc.Icon size={9} />{sc.label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-6 mt-3">
                            {m.capacityUnitsPerMonth != null && (
                              <div className="flex items-center gap-2">
                                <Boxes size={13} className="text-gray-400" />
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Capacity</p>
                                  <p className="text-sm font-bold text-gray-800">{m.capacityUnitsPerMonth.toLocaleString()} u/mo</p>
                                </div>
                              </div>
                            )}
                            {m.unitOpCost != null && (
                              <div className="flex items-center gap-2">
                                <DollarSign size={13} className="text-gray-400" />
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Unit Op. Cost</p>
                                  <p className="text-sm font-bold text-gray-800">£{parseFloat(m.unitOpCost).toFixed(2)}</p>
                                </div>
                              </div>
                            )}
                            {m.facilityLocation && (
                              <div className="flex items-center gap-2">
                                <MapPin size={13} className="text-gray-400" />
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Location</p>
                                  <p className="text-sm font-bold text-gray-800">{m.facilityLocation}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          {m.notes && <p className="text-xs text-gray-500 mt-3">{m.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1 ml-4 shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(m)}><Pencil size={12} /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            onClick={() => { if (confirm("Delete this model?")) deleteModel.mutate({ id: m.id }); }}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <ModelModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditModel(null); }}
        ventureId={selectedVentureId ?? ""}
        editId={editModel?.id}
        initialForm={editModel?.form ?? EMPTY_FORM}
        onSaved={refetch}
      />
    </div>
  );
}
