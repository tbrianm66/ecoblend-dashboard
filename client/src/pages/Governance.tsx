// ============================================================
// GOVERNANCE & RBAC PAGE
// Tabs: Overview · Audit Log · Permissions · Compliance · Risk Register
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield,
  ClipboardList,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  Activity,
  Lock,
  FileCheck,
  BarChart3,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const COMPLIANCE_STATUS_COLORS: Record<string, string> = {
  compliant: "#22c55e",
  non_compliant: "#ef4444",
  in_progress: "#f59e0b",
  not_started: "#6b7280",
  exempt: "#8b5cf6",
  under_review: "#3b82f6",
};

const RISK_STATUS_COLORS: Record<string, string> = {
  open: "#ef4444",
  escalated: "#dc2626",
  mitigated: "#f59e0b",
  accepted: "#6b7280",
  closed: "#22c55e",
};

const RISK_SCORE_COLOR = (score: number) => {
  if (score >= 15) return "#ef4444";
  if (score >= 9) return "#f59e0b";
  return "#22c55e";
};

function KpiCard({ label, value, sub, accent, icon }: { label: string; value: string | number; sub?: string; accent?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-1 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span style={{ color: accent || "#1a2332" }}>{icon}</span>}
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <span className="text-3xl font-bold" style={{ color: accent || "#1a2332", fontFamily: "'Prompt', sans-serif" }}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: summary } = trpc.governance.summary.get.useQuery();
  if (!summary) return <div className="p-8 text-center text-gray-400">Loading…</div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Audit Events" value={summary.auditEvents} accent="#1a2332" icon={<Activity size={14} />} />
        <KpiCard label="Active Permissions" value={summary.activePermissions} accent="#3b82f6" icon={<Users size={14} />} />
        <KpiCard label="Active Policies" value={summary.activePolicies} accent="#8b5cf6" icon={<Lock size={14} />} />
        <KpiCard label="Compliance Rate" value={`${summary.complianceRate}%`} accent="#22c55e" icon={<FileCheck size={14} />} />
        <KpiCard label="Open Risks" value={summary.openRisks} accent="#f59e0b" icon={<AlertTriangle size={14} />} />
        <KpiCard label="High Risks" value={summary.highRisks} sub="score ≥ 15" accent="#ef4444" icon={<XCircle size={14} />} />
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Activity size={14} /> Recent Audit Events
        </h3>
        {summary.recentAuditEvents.length === 0 ? (
          <p className="text-sm text-gray-400">No audit events recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {summary.recentAuditEvents.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#f3f4f6" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#f0f9ff", color: "#1d4ed8" }}>{e.module}</span>
                  <span className="text-sm text-gray-700">{e.action}</span>
                  {e.resourceType && <span className="text-xs text-gray-400">→ {e.resourceType} #{e.resourceId}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{e.userName || e.userId || "system"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold`}
                    style={{ background: e.status === "success" ? "#f0fdf4" : "#fef2f2", color: e.status === "success" ? "#16a34a" : "#dc2626" }}>
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Audit Log Tab ─────────────────────────────────────────────────────────────
function AuditLogTab() {
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: logs } = trpc.governance.auditLog.list.useQuery({
    module: moduleFilter || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: 200,
  });
  const { data: stats } = trpc.governance.auditLog.getStats.useQuery();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Events" value={stats?.total ?? 0} accent="#1a2332" />
        <KpiCard label="Failed" value={stats?.failed ?? 0} accent="#ef4444" />
        <KpiCard label="Blocked" value={stats?.blocked ?? 0} accent="#f59e0b" />
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Filter by module…"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="max-w-xs text-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: "#f3f4f6", background: "#f9fafb" }}>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Time</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Module</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Action</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Resource</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">User</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No audit events found.</td></tr>
            ) : (
              (logs ?? []).map((log: any) => (
                <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#f3f4f6" }}>
                  <td className="px-4 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#f0f9ff", color: "#1d4ed8" }}>{log.module}</span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-700">{log.action}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {log.resourceType ? `${log.resourceType} #${log.resourceId}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{log.userName || log.userId || "system"}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: log.status === "success" ? "#f0fdf4" : "#fef2f2", color: log.status === "success" ? "#16a34a" : "#dc2626" }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Permissions Tab ───────────────────────────────────────────────────────────
function PermissionsTab() {
  const utils = trpc.useUtils();
  const { data: permissions } = trpc.governance.permissions.list.useQuery({});
  const upsert = trpc.governance.permissions.upsert.useMutation({
    onSuccess: () => { utils.governance.permissions.list.invalidate(); toast.success("Permission saved"); setOpen(false); },
  });
  const del = trpc.governance.permissions.delete.useMutation({
    onSuccess: () => { utils.governance.permissions.list.invalidate(); toast.success("Permission removed"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ventureId: "", userId: "", role: "viewer" as any, grantedBy: "", notes: "" });

  const openNew = () => { setEditing(null); setForm({ ventureId: "", userId: "", role: "viewer", grantedBy: "", notes: "" }); setOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ ventureId: p.ventureId, userId: p.userId, role: p.role, grantedBy: p.grantedBy || "", notes: p.notes || "" }); setOpen(true); };

  const ROLE_COLORS: Record<string, string> = { owner: "#ef4444", editor: "#f59e0b", viewer: "#6b7280", advisor: "#8b5cf6", investor: "#3b82f6" };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-700">Venture Access Permissions</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#1a2332" }}>
          <Plus size={13} /> Grant Permission
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: "#f3f4f6", background: "#f9fafb" }}>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Venture</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">User ID</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Role</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Granted By</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(permissions ?? []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No permissions configured yet.</td></tr>
            ) : (
              (permissions ?? []).map((p: any) => (
                <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#f3f4f6" }}>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{p.ventureId}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{p.userId}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                      style={{ background: `${ROLE_COLORS[p.role]}15`, color: ROLE_COLORS[p.role] }}>
                      {p.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{p.grantedBy || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold`}
                      style={{ background: p.isActive ? "#f0fdf4" : "#f9fafb", color: p.isActive ? "#16a34a" : "#6b7280" }}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-gray-100"><Pencil size={12} className="text-gray-400" /></button>
                    <button onClick={() => del.mutate({ id: p.id })} className="p-1.5 rounded hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Permission" : "Grant Permission"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Venture ID</label>
              <Input value={form.ventureId} onChange={(e) => setForm(f => ({ ...f, ventureId: e.target.value }))} placeholder="e.g. ecoblend" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">User ID</label>
              <Input value={form.userId} onChange={(e) => setForm(f => ({ ...f, userId: e.target.value }))} placeholder="User open ID" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Role</label>
              <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["owner", "editor", "viewer", "advisor", "investor"].map(r => (
                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Granted By</label>
              <Input value={form.grantedBy} onChange={(e) => setForm(f => ({ ...f, grantedBy: e.target.value }))} placeholder="Granting user ID" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Notes</label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate({ ...form, id: editing?.id })} disabled={!form.ventureId || !form.userId} style={{ background: "#1a2332" }}>
              {editing ? "Update" : "Grant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Compliance Tab ────────────────────────────────────────────────────────────
function ComplianceTab() {
  const utils = trpc.useUtils();
  const { data: checks } = trpc.governance.compliance.list.useQuery({});
  const { data: stats } = trpc.governance.compliance.getStats.useQuery();
  const upsert = trpc.governance.compliance.upsert.useMutation({
    onSuccess: () => { utils.governance.compliance.list.invalidate(); utils.governance.compliance.getStats.invalidate(); toast.success("Compliance check saved"); setOpen(false); },
  });
  const del = trpc.governance.compliance.delete.useMutation({
    onSuccess: () => { utils.governance.compliance.list.invalidate(); utils.governance.compliance.getStats.invalidate(); toast.success("Deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ventureId: "", framework: "", requirement: "", status: "not_started" as any, owner: "", dueDate: "", evidenceUrl: "", notes: "" });

  const openNew = () => { setEditing(null); setForm({ ventureId: "", framework: "", requirement: "", status: "not_started", owner: "", dueDate: "", evidenceUrl: "", notes: "" }); setOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ ventureId: c.ventureId || "", framework: c.framework, requirement: c.requirement, status: c.status, owner: c.owner || "", dueDate: c.dueDate || "", evidenceUrl: c.evidenceUrl || "", notes: c.notes || "" }); setOpen(true); };

  const FRAMEWORKS = ["GDPR", "ISO9001", "ISO14001", "BCorp", "CE", "REACH", "WEEE", "RoHS", "SOC2", "Cyber Essentials"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Checks" value={stats?.total ?? 0} accent="#1a2332" />
        <KpiCard label="Compliant" value={stats?.compliant ?? 0} accent="#22c55e" />
        <KpiCard label="Non-Compliant" value={stats?.nonCompliant ?? 0} accent="#ef4444" />
        <KpiCard label="Compliance Rate" value={`${stats?.complianceRate ?? 0}%`} accent="#3b82f6" />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-700">Compliance Checks</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#1a2332" }}>
          <Plus size={13} /> Add Check
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: "#f3f4f6", background: "#f9fafb" }}>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Framework</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Requirement</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Venture</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Owner</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Due</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(checks ?? []).length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No compliance checks yet. Add your first check.</td></tr>
            ) : (
              (checks ?? []).map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#f3f4f6" }}>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#f5f3ff", color: "#7c3aed" }}>{c.framework}</span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-700 max-w-xs truncate">{c.requirement}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{c.ventureId || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{c.owner || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{c.dueDate || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                      style={{ background: `${COMPLIANCE_STATUS_COLORS[c.status]}15`, color: COMPLIANCE_STATUS_COLORS[c.status] }}>
                      {c.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100"><Pencil size={12} className="text-gray-400" /></button>
                    <button onClick={() => del.mutate({ id: c.id })} className="p-1.5 rounded hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Compliance Check" : "Add Compliance Check"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Framework</label>
                <Select value={form.framework} onValueChange={(v) => setForm(f => ({ ...f, framework: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{FRAMEWORKS.map(fw => <SelectItem key={fw} value={fw}>{fw}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["not_started","in_progress","compliant","non_compliant","exempt","under_review"].map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Requirement</label>
              <Input value={form.requirement} onChange={(e) => setForm(f => ({ ...f, requirement: e.target.value }))} placeholder="Describe the compliance requirement…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Venture ID</label>
                <Input value={form.ventureId} onChange={(e) => setForm(f => ({ ...f, ventureId: e.target.value }))} placeholder="optional" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Owner</label>
                <Input value={form.owner} onChange={(e) => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="Responsible person" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Due Date</label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Evidence URL</label>
                <Input value={form.evidenceUrl} onChange={(e) => setForm(f => ({ ...f, evidenceUrl: e.target.value }))} placeholder="https://…" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Notes</label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate({ ...form, id: editing?.id })} disabled={!form.framework || !form.requirement} style={{ background: "#1a2332" }}>
              {editing ? "Update" : "Add Check"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Risk Register Tab ─────────────────────────────────────────────────────────
function RiskRegisterTab() {
  const utils = trpc.useUtils();
  const { data: risks } = trpc.governance.riskRegister.list.useQuery({});
  const { data: stats } = trpc.governance.riskRegister.getStats.useQuery();
  const upsert = trpc.governance.riskRegister.upsert.useMutation({
    onSuccess: () => { utils.governance.riskRegister.list.invalidate(); utils.governance.riskRegister.getStats.invalidate(); toast.success("Risk saved"); setOpen(false); },
  });
  const del = trpc.governance.riskRegister.delete.useMutation({
    onSuccess: () => { utils.governance.riskRegister.list.invalidate(); utils.governance.riskRegister.getStats.invalidate(); toast.success("Deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ventureId: "", title: "", category: "operational" as any, likelihood: 3, impact: 3, status: "open" as any, owner: "", mitigationPlan: "", residualRisk: 0, reviewDate: "", notes: "" });

  const openNew = () => { setEditing(null); setForm({ ventureId: "", title: "", category: "operational", likelihood: 3, impact: 3, status: "open", owner: "", mitigationPlan: "", residualRisk: 0, reviewDate: "", notes: "" }); setOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ventureId: r.ventureId || "", title: r.title, category: r.category, likelihood: r.likelihood, impact: r.impact, status: r.status, owner: r.owner || "", mitigationPlan: r.mitigationPlan || "", residualRisk: r.residualRisk || 0, reviewDate: r.reviewDate || "", notes: r.notes || "" }); setOpen(true); };

  const riskScore = form.likelihood * form.impact;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Total Risks" value={stats?.total ?? 0} accent="#1a2332" />
        <KpiCard label="Open" value={stats?.open ?? 0} accent="#ef4444" />
        <KpiCard label="Escalated" value={stats?.escalated ?? 0} accent="#dc2626" />
        <KpiCard label="Mitigated" value={stats?.mitigated ?? 0} accent="#f59e0b" />
        <KpiCard label="High Risk" value={stats?.highRisk ?? 0} sub="score ≥ 15" accent="#ef4444" />
        <KpiCard label="Avg Score" value={stats?.avgScore ?? 0} sub="out of 25" accent="#6b7280" />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-700">Risk Register</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#1a2332" }}>
          <Plus size={13} /> Add Risk
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: "#f3f4f6", background: "#f9fafb" }}>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Risk</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Category</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">L × I</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Score</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Owner</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(risks ?? []).length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No risks registered yet.</td></tr>
            ) : (
              (risks ?? []).map((r: any) => (
                <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#f3f4f6" }}>
                  <td className="px-4 py-2.5 text-sm text-gray-700 max-w-xs">
                    <div className="font-medium truncate">{r.title}</div>
                    {r.ventureId && <div className="text-xs text-gray-400 font-mono">{r.ventureId}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded capitalize" style={{ background: "#f5f3ff", color: "#7c3aed" }}>{r.category}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{r.likelihood} × {r.impact}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-sm font-bold" style={{ color: RISK_SCORE_COLOR(r.riskScore ?? 0) }}>{r.riskScore ?? 0}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{r.owner || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                      style={{ background: `${RISK_STATUS_COLORS[r.status]}15`, color: RISK_STATUS_COLORS[r.status] }}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-gray-100"><Pencil size={12} className="text-gray-400" /></button>
                    <button onClick={() => del.mutate({ id: r.id })} className="p-1.5 rounded hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Risk" : "Add Risk"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Risk Title</label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Describe the risk…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["strategic","operational","financial","legal","technical","reputational","environmental"].map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["open","mitigated","accepted","closed","escalated"].map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Likelihood (1–5)</label>
                <Input type="number" min={1} max={5} value={form.likelihood} onChange={(e) => setForm(f => ({ ...f, likelihood: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Impact (1–5)</label>
                <Input type="number" min={1} max={5} value={form.impact} onChange={(e) => setForm(f => ({ ...f, impact: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="rounded-lg p-3 text-sm" style={{ background: `${RISK_SCORE_COLOR(riskScore)}10`, border: `1px solid ${RISK_SCORE_COLOR(riskScore)}30` }}>
              <span className="font-semibold" style={{ color: RISK_SCORE_COLOR(riskScore) }}>Risk Score: {riskScore}/25</span>
              <span className="text-gray-500 ml-2 text-xs">{riskScore >= 15 ? "HIGH" : riskScore >= 9 ? "MEDIUM" : "LOW"}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Owner</label>
                <Input value={form.owner} onChange={(e) => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="Risk owner" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Review Date</label>
                <Input type="date" value={form.reviewDate} onChange={(e) => setForm(f => ({ ...f, reviewDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Mitigation Plan</label>
              <Textarea value={form.mitigationPlan} onChange={(e) => setForm(f => ({ ...f, mitigationPlan: e.target.value }))} rows={2} placeholder="Describe mitigation actions…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate({ ...form, id: editing?.id })} disabled={!form.title} style={{ background: "#1a2332" }}>
              {editing ? "Update" : "Add Risk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Governance() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-3 mb-1">
          <Shield size={20} style={{ color: "#1a2332" }} />
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Governance & RBAC
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          Audit log, venture-scoped permissions, compliance framework tracking, and risk register.
        </p>
      </div>

      <div className="p-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto bg-transparent p-0">
            {[
              { value: "overview", label: "Overview", icon: <BarChart3 size={13} /> },
              { value: "audit", label: "Audit Log", icon: <Activity size={13} /> },
              { value: "permissions", label: "Permissions", icon: <Users size={13} /> },
              { value: "compliance", label: "Compliance", icon: <FileCheck size={13} /> },
              { value: "risks", label: "Risk Register", icon: <AlertTriangle size={13} /> },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:border-gray-900 border-gray-200 text-gray-600 hover:border-gray-400 transition-all"
              >
                {tab.icon} {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="audit"><AuditLogTab /></TabsContent>
          <TabsContent value="permissions"><PermissionsTab /></TabsContent>
          <TabsContent value="compliance"><ComplianceTab /></TabsContent>
          <TabsContent value="risks"><RiskRegisterTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
