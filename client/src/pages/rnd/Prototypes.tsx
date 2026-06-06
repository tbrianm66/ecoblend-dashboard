// ============================================================================
// MODULE 5 — Prototype Testing & Product Milestones
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wrench, Plus, Pencil, Trash2, CheckCircle2, Clock, AlertTriangle, Pause, FlaskConical } from "lucide-react";
import {
  ModuleHeader, VentureSelector, EmptyState, NoVentureState,
} from "@/components/discovery/primitives";

// ── Constants ─────────────────────────────────────────────────────────────────
const MILESTONE_TYPES = [
  { value: "concierge_mvp",   label: "Concierge MVP" },
  { value: "wizard_of_oz",    label: "Wizard of Oz" },
  { value: "smoke_test",      label: "Smoke Test" },
  { value: "prototype",       label: "Prototype" },
  { value: "pilot",           label: "Pilot" },
  { value: "production",      label: "Production" },
  { value: "other",           label: "Other" },
];

const MVP_FORMATS = [
  { value: "concierge",    label: "Concierge" },
  { value: "wizard_of_oz", label: "Wizard of Oz" },
  { value: "smoke_test",   label: "Smoke Test" },
  { value: "landing_page", label: "Landing Page" },
  { value: "prototype",    label: "Physical Prototype" },
];

const STATUSES: { value: string; label: string; icon: any; color: string; bg: string }[] = [
  { value: "planned",     label: "Planned",     icon: Clock,         color: "#3b82f6", bg: "#eff6ff" },
  { value: "in_progress", label: "In Progress", icon: FlaskConical,  color: "#f59e0b", bg: "#fffbeb" },
  { value: "completed",   label: "Completed",   icon: CheckCircle2,  color: "#16a34a", bg: "#f0fdf4" },
  { value: "blocked",     label: "Blocked",     icon: Pause,         color: "#dc2626", bg: "#fef2f2" },
];

const OUTCOMES = [
  { value: "validated",    label: "Validated" },
  { value: "invalidated",  label: "Invalidated" },
  { value: "inconclusive", label: "Inconclusive" },
];

function statusConfig(status: string) {
  return STATUSES.find((s) => s.value === status) ?? STATUSES[0];
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig(status);
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ── Validation Rate bar ───────────────────────────────────────────────────────
function ValidationBar({ rate }: { rate: number | null }) {
  if (rate === null || rate === undefined) return <span className="text-xs text-gray-400">—</span>;
  const pct = Math.round(rate * 100);
  const color = pct >= 60 ? "#16a34a" : pct >= 40 ? "#f59e0b" : "#dc2626";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ── Milestone Card ────────────────────────────────────────────────────────────
function MilestoneCard({
  row, onEdit, onDelete,
}: { row: any; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div>
              <p className="font-semibold text-sm text-gray-900 leading-snug">{row.milestoneTitle}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <StatusBadge status={row.status} />
                {row.milestoneType && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                    {MILESTONE_TYPES.find((t) => t.value === row.milestoneType)?.label ?? row.milestoneType}
                  </span>
                )}
                {row.mvpFormat && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">
                    {row.mvpFormat}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}><Pencil size={13} /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onDelete}><Trash2 size={13} /></Button>
          </div>
        </div>

        {row.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{row.description}</p>}
        {row.hypothesisTested && (
          <p className="text-xs text-gray-500 mb-2">
            <span className="font-medium text-gray-700">Hypothesis: </span>{row.hypothesisTested}
          </p>
        )}

        {/* Validation evidence */}
        {(row.participants > 0 || row.validationRate !== null) && (
          <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Validation rate</span>
              <span className="text-gray-700 font-medium">{row.validated}/{row.participants} participants</span>
            </div>
            <ValidationBar rate={row.validationRate} />
          </div>
        )}

        {row.outcome && (
          <div className="mt-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              row.outcome === "validated"   ? "bg-green-100 text-green-700" :
              row.outcome === "invalidated" ? "bg-red-100 text-red-700"   :
                                             "bg-yellow-100 text-yellow-700"
            }`}>
              {row.outcome.charAt(0).toUpperCase() + row.outcome.slice(1)}
            </span>
          </div>
        )}

        {row.keyLearning && (
          <p className="text-xs text-gray-500 mt-2 italic">"{row.keyLearning}"</p>
        )}

        {(row.targetDate || row.assignedTo) && (
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
            {row.targetDate && <span>Target: {row.targetDate}</span>}
            {row.completedDate && <span>Done: {row.completedDate}</span>}
            {row.assignedTo && <span>Owner: {row.assignedTo}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────────
function MilestoneModal({
  open, onClose, ventureId, initial, onSaved,
}: { open: boolean; onClose: () => void; ventureId: string; initial?: any; onSaved: () => void }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<any>(initial ?? {
    ventureId,
    milestoneTitle: "", milestoneType: "prototype", mvpFormat: "",
    stage: "", description: "", hypothesisTested: "", successCriteria: "",
    userTestCount: 0, userResponseCaptured: false,
    participants: 0, validated: 0, invalidated: 0,
    outcome: "", keyLearning: "", targetDate: "", completedDate: "",
    status: "planned", evidenceUrl: "", assignedTo: "",
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const upsert = trpc.productMilestones.upsert.useMutation({
    onSuccess: () => { onSaved(); onClose(); toast.success(isEdit ? "Milestone updated" : "Milestone added"); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.milestoneTitle?.trim()) { toast.error("Title is required"); return; }
    upsert.mutate({
      id:                   isEdit ? initial.id : undefined,
      ventureId,
      milestoneTitle:       form.milestoneTitle,
      milestoneType:        form.milestoneType || undefined,
      mvpFormat:            form.mvpFormat || undefined,
      stage:                form.stage || undefined,
      description:          form.description || undefined,
      hypothesisTested:     form.hypothesisTested || undefined,
      successCriteria:      form.successCriteria || undefined,
      userTestCount:        Number(form.userTestCount) || 0,
      userResponseCaptured: Boolean(form.userResponseCaptured),
      participants:         Number(form.participants) || 0,
      validated:            Number(form.validated) || 0,
      invalidated:          Number(form.invalidated) || 0,
      outcome:              form.outcome || undefined,
      keyLearning:          form.keyLearning || undefined,
      targetDate:           form.targetDate || undefined,
      completedDate:        form.completedDate || undefined,
      status:               form.status || "planned",
      evidenceUrl:          form.evidenceUrl || undefined,
      assignedTo:           form.assignedTo || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Title *</label>
              <Input value={form.milestoneTitle} onChange={(e) => set("milestoneTitle", e.target.value)} placeholder="e.g. Composite frame prototype v1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Type</label>
              <Select value={form.milestoneType} onValueChange={(v) => set("milestoneType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MILESTONE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">MVP Format</label>
              <Select value={form.mvpFormat || "__none__"} onValueChange={(v) => set("mvpFormat", v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select format…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {MVP_FORMATS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Stage</label>
              <Input value={form.stage} onChange={(e) => set("stage", e.target.value)} placeholder="e.g. prototype_build" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="What are you building?" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Hypothesis Tested</label>
            <Textarea value={form.hypothesisTested} onChange={(e) => set("hypothesisTested", e.target.value)} rows={2} placeholder="What assumption does this milestone test?" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Success Criteria</label>
            <Input value={form.successCriteria} onChange={(e) => set("successCriteria", e.target.value)} placeholder="e.g. 3 paid pilot LOIs at ≥£1,200/unit" />
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">User Testing Evidence</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Participants</label>
                <Input type="number" min={0} value={form.participants} onChange={(e) => set("participants", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Validated</label>
                <Input type="number" min={0} value={form.validated} onChange={(e) => set("validated", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Invalidated</label>
                <Input type="number" min={0} value={form.invalidated} onChange={(e) => set("invalidated", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Outcome</label>
              <Select value={form.outcome || "__none__"} onValueChange={(v) => set("outcome", v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select outcome…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Not yet —</SelectItem>
                  {OUTCOMES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">User Test Count</label>
              <Input type="number" min={0} value={form.userTestCount} onChange={(e) => set("userTestCount", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Key Learning</label>
            <Textarea value={form.keyLearning} onChange={(e) => set("keyLearning", e.target.value)} rows={2} placeholder="What did you learn from this milestone?" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Target Date</label>
              <Input value={form.targetDate} onChange={(e) => set("targetDate", e.target.value)} placeholder="YYYY-MM-DD" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Completed Date</label>
              <Input value={form.completedDate} onChange={(e) => set("completedDate", e.target.value)} placeholder="YYYY-MM-DD" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Assigned To</label>
              <Input value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)} placeholder="Owner name" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={upsert.isPending} style={{ background: "#56A837", color: "#fff" }}>
            {upsert.isPending ? "Saving…" : isEdit ? "Update" : "Add Milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Prototypes() {
  const { selectedVentureId: ventureId } = useSelectedVenture();
  const utils = trpc.useUtils();
  const enabled = !!ventureId;
  const v = ventureId ?? "";

  const list = trpc.productMilestones.list.useQuery({ ventureId: v }, { enabled });
  const deleteMutation = trpc.productMilestones.delete.useMutation({
    onSuccess: () => { utils.productMilestones.list.invalidate(); toast.success("Milestone deleted"); },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (row: any) => { setEditing(row); setModalOpen(true); };
  const onSaved = () => utils.productMilestones.list.invalidate();

  const rows = list.data ?? [];
  const grouped = STATUSES.map((s) => ({
    ...s,
    rows: rows.filter((r) => r.status === s.value),
  })).filter((g) => g.rows.length > 0);

  if (!ventureId) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ModuleHeader
          title="Prototype Testing"
          purpose="Track every build milestone, user test, and validated learning from concept through to production handoff."
          icon={<Wrench size={22} />}
          action={<VentureSelector />}
        />
        <NoVentureState />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <ModuleHeader
        title="Prototype Testing"
        purpose="Track every build milestone, user test, and validated learning from concept through to production handoff."
        icon={<Wrench size={22} />}
        action={<VentureSelector />}
      />

      {/* Stats bar */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATUSES.map((s) => {
            const count = rows.filter((r) => r.status === s.value).length;
            const Icon = s.icon;
            return (
              <Card key={s.value}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                    <Icon size={16} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add button */}
      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-2" style={{ background: "#56A837", color: "#fff" }}>
          <Plus size={16} /> Add Milestone
        </Button>
      </div>

      {/* Grouped lists */}
      {rows.length === 0 ? (
        <EmptyState
          icon={<Wrench size={32} />}
          title="No milestones yet"
          description="Add your first prototype or MVP build milestone to start tracking evidence."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.value}>
              <div className="flex items-center gap-2 mb-3">
                <group.icon size={14} style={{ color: group.color }} />
                <span className="text-sm font-semibold" style={{ color: group.color }}>{group.label}</span>
                <span className="text-xs text-gray-400">({group.rows.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.rows.map((row) => (
                  <MilestoneCard
                    key={row.id}
                    row={row}
                    onEdit={() => openEdit(row)}
                    onDelete={() => deleteMutation.mutate({ id: row.id })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <MilestoneModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ventureId={v}
        initial={editing}
        onSaved={onSaved}
      />
    </div>
  );
}
