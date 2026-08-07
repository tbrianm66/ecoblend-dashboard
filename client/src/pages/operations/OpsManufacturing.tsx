// ============================================================
// Operations — Manufacturing Planning  /operations/manufacturing
// Production runs, batch yield targets, and scrap/rejection rates
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
  ClipboardList, Plus, Pencil, Trash2,
  TrendingUp, AlertTriangle, CheckCircle2, Gauge,
} from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

// ── Constants ─────────────────────────────────────────────────────────────────

const PHASES = [
  { value: "pilot",      label: "Pilot",       desc: "Small-scale validation run",      color: "#7c3aed", bg: "#ede9fe" },
  { value: "scale_up",   label: "Scale-Up",    desc: "Increased production volume",     color: "#3B85BA", bg: "#dbeafe" },
  { value: "commercial", label: "Commercial",  desc: "Full commercial production rate", color: "#16a34a", bg: "#f0fdf4" },
];

const EMPTY_FORM = {
  phaseName:             "pilot" as const,
  targetYieldPercentage: "",
  actualYieldPercentage: "",
  scrapRate:             "",
  plannedStartDate:      "",
  completionDate:        "",
  notes:                 "",
};
type FormState = typeof EMPTY_FORM;

function phaseCfg(p: string) { return PHASES.find(x => x.value === p) ?? PHASES[0]; }

function yieldBar(target: string | null, actual: string | null) {
  const t = parseFloat(target ?? "0");
  const a = parseFloat(actual ?? "0");
  if (!t) return null;
  const pct = Math.min(100, (a / t) * 100);
  const color = pct >= 95 ? "#16a34a" : pct >= 80 ? "#F69111" : "#dc2626";
  return { pct, color };
}

// ── Plan Modal ────────────────────────────────────────────────────────────────

function PlanModal({ open, onClose, ventureId, editId, initialForm, onSaved }: {
  open: boolean; onClose: () => void; ventureId: string;
  editId?: number; initialForm: FormState; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const upsert = trpc.operations.manufacturing.upsert.useMutation({
    onSuccess: () => { toast.success(editId ? "Plan updated." : "Plan added."); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Production Plan" : "Add Production Plan"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Phase *</label>
            <Select value={form.phaseName} onValueChange={v => set("phaseName", v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PHASES.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className="font-medium">{p.label}</span>
                    <span className="text-gray-400 ml-2 text-xs">{p.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Target Yield %</label>
              <Input type="number" min={0} max={100} step="0.01" value={form.targetYieldPercentage} onChange={e => set("targetYieldPercentage", e.target.value)} placeholder="e.g. 92.5" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Actual Yield %</label>
              <Input type="number" min={0} max={100} step="0.01" value={form.actualYieldPercentage} onChange={e => set("actualYieldPercentage", e.target.value)} placeholder="Leave blank if N/A" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Scrap Rate %</label>
              <Input type="number" min={0} max={100} step="0.01" value={form.scrapRate} onChange={e => set("scrapRate", e.target.value)} placeholder="e.g. 3.2" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Planned Start Date</label>
              <Input type="date" value={form.plannedStartDate} onChange={e => set("plannedStartDate", e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Completion Date</label>
              <Input type="date" value={form.completionDate} onChange={e => set("completionDate", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Notes</label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Batch size, production line, equipment, constraints…" rows={3} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={upsert.isPending}
            onClick={() => upsert.mutate({ id: editId, ventureId, ...form })}
            style={{ background: "#56A837" }}
          >
            {upsert.isPending ? "Saving…" : editId ? "Save Changes" : "Add Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OpsManufacturing() {
  const { selectedVentureId } = useSelectedVenture();
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan]   = useState<{ id: number; form: FormState } | null>(null);

  const { data: plans = [], refetch } = trpc.operations.manufacturing.list.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );
  const { data: summary } = trpc.operations.manufacturing.yieldSummary.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );

  const deletePlan = trpc.operations.manufacturing.delete.useMutation({
    onSuccess: () => { toast.success("Plan deleted."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const openAdd = () => { setEditPlan(null); setModalOpen(true); };
  const openEdit = (p: typeof plans[0]) => {
    setEditPlan({ id: p.id, form: {
      phaseName:             p.phaseName as any,
      targetYieldPercentage: p.targetYieldPercentage?.toString() ?? "",
      actualYieldPercentage: p.actualYieldPercentage?.toString() ?? "",
      scrapRate:             p.scrapRate?.toString() ?? "",
      plannedStartDate:      p.plannedStartDate ? new Date(p.plannedStartDate).toISOString().split("T")[0] : "",
      completionDate:        p.completionDate ? new Date(p.completionDate).toISOString().split("T")[0] : "",
      notes:                 p.notes ?? "",
    }});
    setModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <ModuleHeader
        icon={<ClipboardList size={20} />}
        title="Manufacturing Planning"
        purpose="Track production runs across pilot, scale-up, and commercial phases — with yield targets and scrap rate monitoring."
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openAdd}><Plus size={14} /> Add Plan</Button>}
      />

      <div className="space-y-6">
        <VentureSelector />

        {!selectedVentureId ? <NoVentureState /> : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Production Runs",   value: plans.length,               color: "#56A837", Icon: ClipboardList },
                { label: "Avg. Target Yield", value: `${summary?.avgTarget ?? "0"}%`, color: "#3B85BA", Icon: TrendingUp },
                { label: "Avg. Actual Yield", value: summary?.avgActual ? `${summary.avgActual}%` : "—", color: "#16a34a", Icon: CheckCircle2 },
                { label: "Avg. Scrap Rate",   value: `${summary?.avgScrap ?? "0"}%`,   color: parseFloat(summary?.avgScrap ?? "0") > 5 ? "#dc2626" : "#F69111", Icon: AlertTriangle },
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

            {/* Plans table */}
            {plans.length === 0 ? (
              <EmptyState
                icon={<ClipboardList size={32} />}
                title="No production plans yet"
                description="Add pilot, scale-up, and commercial production plans. Track yield targets and scrap rates to identify improvement opportunities."
                action={<Button size="sm" onClick={openAdd} style={{ background: "#56A837" }}><Plus size={14} className="mr-1" /> Add Plan</Button>}
              />
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ background: "#fafafa", borderColor: "#f3f4f6" }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Phase</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Target Yield</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Actual Yield</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-40">Progress</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Scrap Rate</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Start</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Target End</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map(p => {
                      const pc = phaseCfg(p.phaseName);
                      const bar = yieldBar(p.targetYieldPercentage, p.actualYieldPercentage);
                      const scrap = parseFloat(p.scrapRate ?? "0");
                      return (
                        <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#f3f4f6" }}>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: pc.color, color: pc.color, background: pc.bg }}>{pc.label}</Badge>
                            {p.notes && <p className="text-[10px] text-gray-400 mt-1 max-w-[140px] truncate">{p.notes}</p>}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono font-bold text-gray-700">{p.targetYieldPercentage ? `${p.targetYieldPercentage}%` : "—"}</td>
                          <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: bar ? bar.color : "#9ca3af" }}>
                            {p.actualYieldPercentage ? `${p.actualYieldPercentage}%` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {bar ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-2 rounded-full" style={{ width: `${bar.pct}%`, background: bar.color }} />
                                </div>
                                <span className="text-[10px] font-semibold" style={{ color: bar.color }}>{bar.pct.toFixed(0)}%</span>
                              </div>
                            ) : <span className="text-gray-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono" style={{ color: scrap > 5 ? "#dc2626" : scrap > 2 ? "#F69111" : "#16a34a" }}>
                              {p.scrapRate ? `${p.scrapRate}%` : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {p.plannedStartDate ? new Date(p.plannedStartDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {p.completionDate ? new Date(p.completionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(p)}><Pencil size={12} /></Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                onClick={() => { if (confirm("Delete this plan?")) deletePlan.mutate({ id: p.id }); }}>
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

      <PlanModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditPlan(null); }}
        ventureId={selectedVentureId ?? ""}
        editId={editPlan?.id}
        initialForm={editPlan?.form ?? EMPTY_FORM}
        onSaved={refetch}
      />
    </div>
  );
}
