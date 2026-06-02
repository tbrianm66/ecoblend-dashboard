// ============================================================================
// COMMAND CENTRE — Alerts & Approvals (active control system)
// Aggregated alert inbox with auto-generation, filters and lifecycle actions.
// ============================================================================
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, RefreshCw, Plus, Check, X, Trash2, Bell } from "lucide-react";
import {
  ModuleHeader, StatTile, SeverityBadge, AlertStatusBadge, EmptyState, FormModal,
} from "@/components/command/primitives";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { humanise, ALERT_TYPES, ALERT_SEVERITIES, ALERT_STATUSES, MODULE_SOURCES } from "@shared/commandCentre";

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function AlertsApprovals() {
  const utils = trpc.useUtils();
  const { availableVentures: ventures } = useSelectedVenture();
  const ventureName = (id: string) => ventures.find((v) => v.id === id)?.name ?? id;

  const alertsQ = trpc.commandCentreLean.alerts.list.useQuery({});
  const invalidate = () => utils.commandCentreLean.alerts.list.invalidate();

  const [fVenture, setFVenture] = useState("__all__");
  const [fSeverity, setFSeverity] = useState("__all__");
  const [fType, setFType] = useState("__all__");
  const [fStatus, setFStatus] = useState("active");

  const regenerate = trpc.commandCentreLean.alerts.regenerate.useMutation({
    onSuccess: (r) => { invalidate(); toast.success(`Auto-alerts refreshed across ${r.ventures} ventures`); },
  });
  const setStatus = trpc.commandCentreLean.alerts.setStatus.useMutation({ onSuccess: () => { invalidate(); toast.success("Alert updated"); } });
  const del = trpc.commandCentreLean.alerts.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("Alert deleted"); } });
  const upsert = trpc.commandCentreLean.alerts.upsert.useMutation({ onSuccess: () => { invalidate(); setOpen(false); toast.success("Alert saved"); } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [assignFor, setAssignFor] = useState<number | null>(null);
  const [ownerInput, setOwnerInput] = useState("");

  const all = alertsQ.data ?? [];
  const rows = useMemo(() => {
    return all
      .filter((a) => fVenture === "__all__" || a.ventureId === fVenture)
      .filter((a) => fSeverity === "__all__" || a.severity === fSeverity)
      .filter((a) => fType === "__all__" || a.alertType === fType)
      .filter((a) => fStatus === "__all__"
        ? true
        : fStatus === "active"
          ? a.status !== "resolved" && a.status !== "dismissed"
          : a.status === fStatus)
      .sort((a, b) => (SEV_ORDER[a.severity ?? "low"] - SEV_ORDER[b.severity ?? "low"]));
  }, [all, fVenture, fSeverity, fType, fStatus]);

  const active = all.filter((a) => a.status !== "resolved" && a.status !== "dismissed");
  const stats = {
    critical: active.filter((a) => a.severity === "critical").length,
    high: active.filter((a) => a.severity === "high").length,
    open: all.filter((a) => a.status === "open").length,
    resolved: all.filter((a) => a.status === "resolved").length,
  };

  const openForm = () => { setForm({ ventureId: ventures[0]?.id ?? "", alertType: "approval_required", alertTitle: "", severity: "medium", status: "open" }); setOpen(true); };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <ModuleHeader
        title="Alerts & Approvals"
        purpose="An active control system — weak evidence, overdue experiments, risk and stage-gate triggers, with owners and resolution."
        icon={<Bell size={22} />}
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => regenerate.mutate()} disabled={regenerate.isPending} data-testid="button-regenerate-alerts">
              <RefreshCw size={14} className={`mr-1 ${regenerate.isPending ? "animate-spin" : ""}`} />Regenerate
            </Button>
            <Button size="sm" onClick={openForm} style={{ background: "#56A837" }} data-testid="button-add-alert"><Plus size={14} className="mr-1" />Add Alert</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Critical" value={stats.critical} tone={stats.critical ? "red" : "green"} icon={<AlertTriangle size={18} />} />
        <StatTile label="High" value={stats.high} tone={stats.high ? "amber" : "green"} />
        <StatTile label="Open" value={stats.open} tone={stats.open ? "blue" : "grey"} />
        <StatTile label="Resolved" value={stats.resolved} tone="green" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Filter label="Venture" value={fVenture} onChange={setFVenture} options={[["__all__", "All"], ...ventures.map((v) => [v.id, v.name] as [string, string])]} />
        <Filter label="Severity" value={fSeverity} onChange={setFSeverity} options={[["__all__", "All"], ...ALERT_SEVERITIES.map((s) => [s, humanise(s)] as [string, string])]} />
        <Filter label="Type" value={fType} onChange={setFType} options={[["__all__", "All"], ...ALERT_TYPES.map((s) => [s, humanise(s)] as [string, string])]} />
        <Filter label="Status" value={fStatus} onChange={setFStatus} options={[["active", "Active"], ["__all__", "All"], ...ALERT_STATUSES.map((s) => [s, humanise(s)] as [string, string])]} />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No alerts match" description="Adjust filters or regenerate auto-alerts to surface current risks." icon={<Bell size={22} />} />
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <Card key={a.id} className="border shadow-sm" data-testid={`alert-${a.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800">{a.alertTitle}</span>
                      <SeverityBadge severity={a.severity} />
                      <AlertStatusBadge status={a.status} />
                      {a.autoGenerated && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">auto</span>}
                    </div>
                    <div className="text-xs text-gray-400 mb-1">
                      {ventureName(a.ventureId)} · {humanise(a.alertType ?? "")}{a.linkedModule ? ` · ${humanise(a.linkedModule)}` : ""}{a.owner ? ` · ${a.owner}` : ""}
                    </div>
                    {a.alertDescription && <p className="text-sm text-gray-600">{a.alertDescription}</p>}
                    {a.recommendedAction && <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Recommended:</span> {a.recommendedAction}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {assignFor === a.id ? (
                      <div className="flex items-center gap-1">
                        <Input value={ownerInput} onChange={(e) => setOwnerInput(e.target.value)} placeholder="Owner" className="h-7 w-32 text-xs" />
                        <Button size="sm" className="h-7 px-2" onClick={() => { setStatus.mutate({ id: a.id, status: a.status as any, owner: ownerInput }); setAssignFor(null); }}>Set</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {a.status === "open" && <ActionBtn label="Acknowledge" onClick={() => setStatus.mutate({ id: a.id, status: "acknowledged" })} />}
                        {(a.status === "open" || a.status === "acknowledged") && <ActionBtn label="Start" onClick={() => setStatus.mutate({ id: a.id, status: "in_progress" })} />}
                        <ActionBtn label="Assign" onClick={() => { setAssignFor(a.id); setOwnerInput(a.owner ?? ""); }} />
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {a.status !== "resolved" && <ActionBtn label="Resolve" tone="green" icon={<Check size={12} />} onClick={() => setStatus.mutate({ id: a.id, status: "resolved" })} />}
                      {a.status !== "dismissed" && <ActionBtn label="Dismiss" icon={<X size={12} />} onClick={() => setStatus.mutate({ id: a.id, status: "dismissed" })} />}
                      <button onClick={() => del.mutate({ id: a.id })} className="text-gray-300 hover:text-red-600 p-1" data-testid={`button-delete-alert-${a.id}`}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormModal open={open} onOpenChange={setOpen} title="Add Alert" submitting={upsert.isPending}
        onSubmit={() => { if (!form.alertTitle?.trim()) return toast.error("Title required"); if (!form.ventureId) return toast.error("Venture required"); upsert.mutate(form); }}>
        <Field label="Venture">
          <Select value={form.ventureId ?? ""} onValueChange={(v) => setForm({ ...form, ventureId: v })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select venture" /></SelectTrigger>
            <SelectContent>{ventures.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Title"><Input value={form.alertTitle ?? ""} onChange={(e) => setForm({ ...form, alertTitle: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={form.alertType ?? "approval_required"} onValueChange={(v) => setForm({ ...form, alertType: v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{ALERT_TYPES.map((t) => <SelectItem key={t} value={t}>{humanise(t)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Severity">
            <Select value={form.severity ?? "medium"} onValueChange={(v) => setForm({ ...form, severity: v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{ALERT_SEVERITIES.map((s) => <SelectItem key={s} value={s}>{humanise(s)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Linked module">
            <Select value={form.linkedModule ?? "command_centre"} onValueChange={(v) => setForm({ ...form, linkedModule: v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{MODULE_SOURCES.map((m) => <SelectItem key={m} value={m}>{humanise(m)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Owner"><Input value={form.owner ?? ""} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></Field>
        </div>
        <Field label="Description"><Textarea value={form.alertDescription ?? ""} onChange={(e) => setForm({ ...form, alertDescription: e.target.value })} /></Field>
        <Field label="Recommended action"><Textarea value={form.recommendedAction ?? ""} onChange={(e) => setForm({ ...form, recommendedAction: e.target.value })} /></Field>
        <Field label="Due date"><Input type="date" value={form.dueDate ?? ""} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
      </FormModal>
    </div>
  );
}

function ActionBtn({ label, onClick, tone, icon }: { label: string; onClick: () => void; tone?: "green"; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-[11px] px-2 py-1 rounded-md border hover:bg-gray-50 flex items-center gap-1"
      style={tone === "green" ? { color: "#15803d", borderColor: "rgba(86,168,55,0.4)" } : { color: "#4b5563" }}
      data-testid={`button-${label.toLowerCase()}`}>
      {icon}{label}
    </button>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40 h-9 text-sm" data-testid={`filter-${label.toLowerCase()}`}><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>{children}</div>;
}
