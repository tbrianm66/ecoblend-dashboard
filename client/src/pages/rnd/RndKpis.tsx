// ============================================================================
// R&D Hub — Technical KPIs  (/rnd/kpis)
// Phase 3: Section 5 — Target vs. Actual KPI tracker
// ============================================================================
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
  BarChart3, Plus, Pencil, Trash2,
  CheckCircle2, AlertTriangle, XCircle,
} from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

// ── Constants ─────────────────────────────────────────────────────────────────

const KPI_STATUSES = [
  { value: "on_track", label: "On Track", color: "#16a34a", bg: "#f0fdf4", Icon: CheckCircle2 },
  { value: "at_risk",  label: "At Risk",  color: "#F69111", bg: "#fff7ed", Icon: AlertTriangle },
  { value: "failed",   label: "Failed",   color: "#dc2626", bg: "#fef2f2", Icon: XCircle },
];

function statusCfg(status: string) {
  return KPI_STATUSES.find(s => s.value === status) ?? KPI_STATUSES[0];
}

const EMPTY_FORM = {
  metricName:  "",
  targetValue: "",
  actualValue: "",
  unit:        "",
  status:      "on_track" as const,
  notes:       "",
  projectId:   undefined as number | undefined,
};
type FormState = typeof EMPTY_FORM;

// ── KPI Modal ─────────────────────────────────────────────────────────────────

function KpiModal({
  open, onClose, ventureId, editId, initialForm, onSaved,
}: {
  open: boolean; onClose: () => void; ventureId: string;
  editId?: number; initialForm: FormState; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const { data: projects = [] } = trpc.rnd.projects.list.useQuery({ ventureId }, { enabled: !!ventureId });
  const upsert = trpc.rnd.kpis.upsert.useMutation({
    onSuccess: () => { toast.success(editId ? "KPI updated." : "KPI added."); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit KPI" : "Add Technical KPI"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Metric Name *</label>
            <Input value={form.metricName} onChange={e => set("metricName", e.target.value)} placeholder="e.g. Tensile Strength" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Target Value *</label>
              <Input value={form.targetValue} onChange={e => set("targetValue", e.target.value)} placeholder="e.g. ≥ 180" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Unit</label>
              <Input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="e.g. MPa, %, kg" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Actual Value</label>
            <Input value={form.actualValue} onChange={e => set("actualValue", e.target.value)} placeholder="Leave blank if not yet measured" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Status *</label>
            <Select value={form.status} onValueChange={v => set("status", v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {KPI_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {projects.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Link to R&D Project (optional)</label>
              <Select value={form.projectId?.toString() ?? "none"} onValueChange={v => set("projectId", v === "none" ? undefined : Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.projectName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Notes</label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Context, methodology, data source…" rows={2} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.metricName.trim() || !form.targetValue.trim() || upsert.isPending}
            onClick={() => upsert.mutate({ id: editId, ventureId, ...form })}
            style={{ background: "#3B85BA" }}
          >
            {upsert.isPending ? "Saving…" : editId ? "Save" : "Add KPI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RndKpis() {
  const { selectedVentureId } = useSelectedVenture();
  const [modalOpen, setModalOpen] = useState(false);
  const [editKpi, setEditKpi] = useState<{ id: number; form: FormState } | null>(null);

  const { data: kpis = [], refetch } = trpc.rnd.kpis.list.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );

  const { data: vrlFeed } = trpc.rnd.vrlContribution.get.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );

  const deleteKpi = trpc.rnd.kpis.delete.useMutation({
    onSuccess: () => { toast.success("KPI deleted."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const onTrack = kpis.filter(k => k.status === "on_track").length;
  const atRisk  = kpis.filter(k => k.status === "at_risk").length;
  const failed  = kpis.filter(k => k.status === "failed").length;

  const openAdd = () => { setEditKpi(null); setModalOpen(true); };
  const openEdit = (kpi: typeof kpis[0]) => {
    setEditKpi({
      id: kpi.id,
      form: {
        metricName:  kpi.metricName,
        targetValue: kpi.targetValue,
        actualValue: kpi.actualValue ?? "",
        unit:        kpi.unit ?? "",
        status:      kpi.status as any,
        notes:       kpi.notes ?? "",
        projectId:   kpi.projectId ?? undefined,
      },
    });
    setModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <ModuleHeader
        icon={<BarChart3 size={20} />}
        title="Technical KPIs"
        purpose="Track target vs. actual engineering performance. On-track KPIs feed into the VRL TRL dimension score."
        action={<Button size="sm" className="gap-2" style={{ background: "#3B85BA" }} onClick={openAdd}><Plus size={14} /> Add KPI</Button>}
      />

      <div className="space-y-6">
        <VentureSelector />

        {!selectedVentureId ? (
          <NoVentureState />
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "On Track",       value: onTrack,       color: "#16a34a", Icon: CheckCircle2 },
                { label: "At Risk",        value: atRisk,        color: "#F69111", Icon: AlertTriangle },
                { label: "Failed",         value: failed,        color: "#dc2626", Icon: XCircle },
                { label: "VRL TRL Score",  value: vrlFeed ? `${vrlFeed.trlScore}/100` : "—", color: "#3B85BA", Icon: BarChart3 },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <card.Icon size={14} style={{ color: card.color }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{card.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* KPI table */}
            {kpis.length === 0 ? (
              <EmptyState
                icon={<BarChart3 size={32} />}
                title="No KPIs tracked yet"
                description="Add technical KPIs to monitor engineering targets. On-track KPIs feed directly into the VRL TRL dimension score."
                action={<Button size="sm" onClick={openAdd} style={{ background: "#3B85BA" }}><Plus size={14} className="mr-1" /> Add KPI</Button>}
              />
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ background: "#fafafa", borderColor: "#f3f4f6" }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Metric</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Target</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Actual</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Unit</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Notes</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.map(kpi => {
                      const sc = statusCfg(kpi.status);
                      return (
                        <tr key={kpi.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#f3f4f6" }}>
                          <td className="px-4 py-3 font-medium text-gray-900">{kpi.metricName}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-700">{kpi.targetValue}{kpi.unit ? ` ${kpi.unit}` : ""}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono font-bold" style={{ color: kpi.actualValue ? sc.color : "#9ca3af" }}>
                              {kpi.actualValue ? `${kpi.actualValue}${kpi.unit ? ` ${kpi.unit}` : ""}` : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{kpi.unit ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] gap-1" style={{ borderColor: sc.color, color: sc.color, background: sc.bg }}>
                              <sc.Icon size={9} />{sc.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate">{kpi.notes ?? "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(kpi)}>
                                <Pencil size={12} />
                              </Button>
                              <Button
                                variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                onClick={() => { if (confirm("Delete this KPI?")) deleteKpi.mutate({ id: kpi.id }); }}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <KpiModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditKpi(null); }}
        ventureId={selectedVentureId ?? ""}
        editId={editKpi?.id}
        initialForm={editKpi?.form ?? EMPTY_FORM}
        onSaved={refetch}
      />
    </div>
  );
}
