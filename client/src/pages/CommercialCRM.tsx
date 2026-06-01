/**
 * Commercial CRM — Go-to-Market Execution
 * Tabs: Overview | Contacts | Leads | Deal Pipeline | Activities | Pipeline Config
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users, TrendingUp, Target, Activity, Settings, Plus, Pencil, Trash2,
  DollarSign, Phone, Mail, Linkedin, BarChart3, CheckCircle2, XCircle, Clock
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Contact = {
  id: number; firstName: string; lastName: string; company?: string | null;
  jobTitle?: string | null; email?: string | null; phone?: string | null;
  linkedinUrl?: string | null; contactType?: string | null; status?: string | null;
  source?: string | null; notes?: string | null;
};
type Lead = {
  id: number; title: string; company?: string | null; source?: string | null;
  status?: string | null; score?: number | null; estimatedValue?: number | null;
  assignedTo?: string | null; nextAction?: string | null; notes?: string | null;
};
type Deal = {
  id: number; title: string; company?: string | null; value?: number | null;
  status?: string | null; probability?: number | null; stageId?: string | null;
  assignedTo?: string | null; notes?: string | null; expectedCloseAt?: number | null;
};
type Activity = {
  id: number; type: string; subject: string; description?: string | null;
  outcome?: string | null; status?: string | null; assignedTo?: string | null;
  dueAt?: number | null; completedAt?: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CONTACT_TYPES = ["prospect", "customer", "partner", "supplier", "other"];
const LEAD_STATUSES = ["new", "contacted", "qualified", "unqualified", "converted"];
const DEAL_STATUSES = ["open", "won", "lost", "on_hold"];
const ACTIVITY_TYPES = ["call", "email", "meeting", "demo", "proposal", "follow_up", "note", "task"];
const SOURCES = ["referral", "linkedin", "event", "inbound", "cold_outreach", "partner", "other"];

const statusColor: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-green-100 text-green-700",
  unqualified: "bg-red-100 text-red-700",
  converted: "bg-purple-100 text-purple-700",
  open: "bg-blue-100 text-blue-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
  on_hold: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function fmt(n: number | null | undefined) {
  if (!n) return "£0";
  return "£" + n.toLocaleString();
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: summary } = trpc.commercialCrm.summary.get.useQuery({});

  const kpis = [
    { label: "Total Contacts", value: summary?.totalContacts ?? 0, icon: Users, color: "#3B85BA" },
    { label: "Qualified Leads", value: summary?.qualifiedLeads ?? 0, sub: `of ${summary?.totalLeads ?? 0} total`, icon: Target, color: "#56A837" },
    { label: "Pipeline Value", value: fmt(summary?.totalPipelineValue), icon: DollarSign, color: "#F69111" },
    { label: "Win Rate", value: `${summary?.winRate ?? 0}%`, sub: `Avg deal ${fmt(summary?.avgDealSize)}`, icon: TrendingUp, color: "#8b5cf6" },
  ];

  const stages = [
    { label: "Open Deals", value: summary?.openDeals ?? 0, color: "#3B85BA" },
    { label: "Won", value: summary?.wonDeals ?? 0, color: "#56A837" },
    { label: "Lost", value: summary?.lostDeals ?? 0, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{k.label}</span>
                <k.icon size={16} style={{ color: k.color }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
              {k.sub && <div className="text-xs text-gray-400 mt-0.5">{k.sub}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Stage Breakdown */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Deal Stage Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stages.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24">{s.label}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(s.value / Math.max(summary?.totalDeals ?? 1, 1)) * 100}%`,
                      background: s.color,
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-600 w-6 text-right">{s.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Won Revenue */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Total Won Revenue</span>
              <span className="text-lg font-bold text-green-600">{fmt(summary?.totalWonValue)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Open Pipeline</span>
              <span className="text-lg font-bold text-blue-600">{fmt(summary?.totalPipelineValue)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Average Deal Size</span>
              <span className="text-lg font-bold text-gray-700">{fmt(summary?.avgDealSize)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Contacts Tab ─────────────────────────────────────────────────────────────
function ContactsTab() {
  const utils = trpc.useUtils();
  const { data: contacts = [], isLoading } = trpc.commercialCrm.contacts.list.useQuery({});
  const upsert = trpc.commercialCrm.contacts.upsert.useMutation({
    onSuccess: () => { utils.commercialCrm.contacts.list.invalidate(); toast.success("Contact saved"); setOpen(false); },
    onError: () => toast.error("Failed to save contact"),
  });
  const del = trpc.commercialCrm.contacts.delete.useMutation({
    onSuccess: () => { utils.commercialCrm.contacts.list.invalidate(); toast.success("Contact deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", company: "", jobTitle: "", email: "", phone: "", linkedinUrl: "", contactType: "prospect", source: "", notes: "" });

  const openNew = () => { setEditing(null); setForm({ firstName: "", lastName: "", company: "", jobTitle: "", email: "", phone: "", linkedinUrl: "", contactType: "prospect", source: "", notes: "" }); setOpen(true); };
  const openEdit = (c: Contact) => { setEditing(c); setForm({ firstName: c.firstName, lastName: c.lastName, company: c.company ?? "", jobTitle: c.jobTitle ?? "", email: c.email ?? "", phone: c.phone ?? "", linkedinUrl: c.linkedinUrl ?? "", contactType: c.contactType ?? "prospect", source: c.source ?? "", notes: c.notes ?? "" }); setOpen(true); };

  const save = () => {
    if (!form.firstName || !form.lastName) return toast.error("First and last name required");
    upsert.mutate({ ...form, ...(editing ? { id: editing.id } : {}) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">{contacts.length} Contacts</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs"><Plus size={13} /> Add Contact</Button>
      </div>

      {isLoading ? <div className="text-sm text-gray-400">Loading...</div> : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Name", "Company", "Role", "Email", "Type", "Source", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map((c: Contact) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.firstName} {c.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{c.company ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.jobTitle ?? "—"}</td>
                  <td className="px-4 py-3">
                    {c.email ? <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline text-xs flex items-center gap-1"><Mail size={11} />{c.email}</a> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${statusColor[c.contactType ?? ""] ?? "bg-gray-100 text-gray-600"}`}>{c.contactType ?? "—"}</Badge></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.source ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-gray-100"><Pencil size={13} className="text-gray-400" /></button>
                      <button onClick={() => del.mutate({ id: c.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={13} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No contacts yet. Add your first contact to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Contact" : "Add Contact"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">First Name *</Label><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Jane" /></div>
            <div><Label className="text-xs">Last Name *</Label><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Smith" /></div>
            <div><Label className="text-xs">Company</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
            <div><Label className="text-xs">Job Title</Label><Input value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} /></div>
            <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label className="text-xs">Contact Type</Label>
              <Select value={form.contactType} onValueChange={v => setForm(f => ({ ...f, contactType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Source</Label>
              <Select value={form.source || "other"} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">LinkedIn URL</Label><Input value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/..." /></div>
            <div className="col-span-2"><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Leads Tab ────────────────────────────────────────────────────────────────
function LeadsTab() {
  const utils = trpc.useUtils();
  const { data: leads = [], isLoading } = trpc.commercialCrm.leads.list.useQuery({});
  const upsert = trpc.commercialCrm.leads.upsert.useMutation({
    onSuccess: () => { utils.commercialCrm.leads.list.invalidate(); toast.success("Lead saved"); setOpen(false); },
    onError: () => toast.error("Failed to save lead"),
  });
  const del = trpc.commercialCrm.leads.delete.useMutation({
    onSuccess: () => { utils.commercialCrm.leads.list.invalidate(); toast.success("Lead deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState({ title: "", company: "", source: "inbound", status: "new", score: 50, estimatedValue: 0, assignedTo: "", nextAction: "", notes: "" });

  const openNew = () => { setEditing(null); setForm({ title: "", company: "", source: "inbound", status: "new", score: 50, estimatedValue: 0, assignedTo: "", nextAction: "", notes: "" }); setOpen(true); };
  const openEdit = (l: Lead) => { setEditing(l); setForm({ title: l.title, company: l.company ?? "", source: l.source ?? "inbound", status: l.status ?? "new", score: l.score ?? 50, estimatedValue: l.estimatedValue ?? 0, assignedTo: l.assignedTo ?? "", nextAction: l.nextAction ?? "", notes: l.notes ?? "" }); setOpen(true); };

  const save = () => {
    if (!form.title) return toast.error("Lead title required");
    upsert.mutate({ ...form, ...(editing ? { id: editing.id } : {}) });
  };

  const scoreColor = (s: number) => s >= 70 ? "text-green-600" : s >= 40 ? "text-yellow-600" : "text-red-500";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">{leads.length} Leads</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs"><Plus size={13} /> Add Lead</Button>
      </div>

      {isLoading ? <div className="text-sm text-gray-400">Loading...</div> : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Title", "Company", "Source", "Status", "Score", "Est. Value", "Next Action", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((l: Lead) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{l.title}</td>
                  <td className="px-4 py-3 text-gray-600">{l.company ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{l.source ?? "—"}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${statusColor[l.status ?? ""] ?? "bg-gray-100 text-gray-600"}`}>{l.status ?? "—"}</Badge></td>
                  <td className="px-4 py-3 font-mono font-bold text-sm"><span className={scoreColor(l.score ?? 0)}>{l.score ?? 0}</span></td>
                  <td className="px-4 py-3 text-gray-700">{fmt(l.estimatedValue)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">{l.nextAction ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(l)} className="p-1 rounded hover:bg-gray-100"><Pencil size={13} className="text-gray-400" /></button>
                      <button onClick={() => del.mutate({ id: l.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={13} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No leads yet. Add your first lead to start tracking your pipeline.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Lead" : "Add Lead"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Lead Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Retail Partnership — Boots UK" /></div>
            <div><Label className="text-xs">Company</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
            <div><Label className="text-xs">Source</Label>
              <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Lead Score (0–100)</Label><Input type="number" min={0} max={100} value={form.score} onChange={e => setForm(f => ({ ...f, score: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Estimated Value (£)</Label><Input type="number" value={form.estimatedValue} onChange={e => setForm(f => ({ ...f, estimatedValue: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Assigned To</Label><Input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} /></div>
            <div className="col-span-2"><Label className="text-xs">Next Action</Label><Input value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))} placeholder="e.g. Send product samples" /></div>
            <div className="col-span-2"><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Deal Pipeline Tab ────────────────────────────────────────────────────────
function DealPipelineTab() {
  const utils = trpc.useUtils();
  const { data: deals = [], isLoading } = trpc.commercialCrm.deals.list.useQuery({});
  const upsert = trpc.commercialCrm.deals.upsert.useMutation({
    onSuccess: () => { utils.commercialCrm.deals.list.invalidate(); utils.commercialCrm.summary.get.invalidate(); toast.success("Deal saved"); setOpen(false); },
    onError: () => toast.error("Failed to save deal"),
  });
  const del = trpc.commercialCrm.deals.delete.useMutation({
    onSuccess: () => { utils.commercialCrm.deals.list.invalidate(); utils.commercialCrm.summary.get.invalidate(); toast.success("Deal deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState({ title: "", company: "", value: 0, probability: 50, status: "open", assignedTo: "", notes: "" });

  const openNew = () => { setEditing(null); setForm({ title: "", company: "", value: 0, probability: 50, status: "open", assignedTo: "", notes: "" }); setOpen(true); };
  const openEdit = (d: Deal) => { setEditing(d); setForm({ title: d.title, company: d.company ?? "", value: d.value ?? 0, probability: d.probability ?? 50, status: d.status ?? "open", assignedTo: d.assignedTo ?? "", notes: d.notes ?? "" }); setOpen(true); };

  const save = () => {
    if (!form.title) return toast.error("Deal title required");
    upsert.mutate({ ...form, ...(editing ? { id: editing.id } : {}) });
  };

  // Group deals by status for a Kanban-style view
  const stages = ["open", "won", "lost", "on_hold"];
  const stageLabels: Record<string, string> = { open: "Open", won: "Won", lost: "Lost", on_hold: "On Hold" };
  const stageColors: Record<string, string> = { open: "#3B85BA", won: "#56A837", lost: "#ef4444", on_hold: "#6b7280" };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">{deals.length} Deals</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs"><Plus size={13} /> Add Deal</Button>
      </div>

      {isLoading ? <div className="text-sm text-gray-400">Loading...</div> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map(stage => {
            const stageDeals = deals.filter((d: Deal) => d.status === stage);
            const stageValue = stageDeals.reduce((sum: number, d: Deal) => sum + (d.value ?? 0), 0);
            return (
              <div key={stage} className="rounded-xl border bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold" style={{ color: stageColors[stage] }}>{stageLabels[stage]}</span>
                  <span className="text-xs font-mono text-gray-500">{fmt(stageValue)}</span>
                </div>
                <div className="space-y-2">
                  {stageDeals.map((d: Deal) => (
                    <div key={d.id} className="bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(d)}>
                      <div className="font-medium text-xs text-gray-900 mb-1 truncate">{d.title}</div>
                      {d.company && <div className="text-xs text-gray-500 mb-1">{d.company}</div>}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold" style={{ color: stageColors[stage] }}>{fmt(d.value)}</span>
                        <span className="text-xs text-gray-400">{d.probability ?? 0}%</span>
                      </div>
                    </div>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">No deals</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Deal" : "Add Deal"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Deal Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Boots UK Distribution Agreement" /></div>
            <div><Label className="text-xs">Company</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
            <div><Label className="text-xs">Deal Value (£)</Label><Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Probability (%)</Label><Input type="number" min={0} max={100} value={form.probability} onChange={e => setForm(f => ({ ...f, probability: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Assigned To</Label><Input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} /></div>
            <div className="col-span-2"><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Activities Tab ───────────────────────────────────────────────────────────
function ActivitiesTab() {
  const utils = trpc.useUtils();
  const { data: activities = [], isLoading } = trpc.commercialCrm.activities.list.useQuery({});
  const upsert = trpc.commercialCrm.activities.upsert.useMutation({
    onSuccess: () => { utils.commercialCrm.activities.list.invalidate(); toast.success("Activity saved"); setOpen(false); },
    onError: () => toast.error("Failed to save activity"),
  });
  const del = trpc.commercialCrm.activities.delete.useMutation({
    onSuccess: () => { utils.commercialCrm.activities.list.invalidate(); toast.success("Activity deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState({ type: "call", subject: "", description: "", outcome: "", status: "pending", assignedTo: "" });

  const openNew = () => { setEditing(null); setForm({ type: "call", subject: "", description: "", outcome: "", status: "pending", assignedTo: "" }); setOpen(true); };
  const openEdit = (a: Activity) => { setEditing(a); setForm({ type: a.type, subject: a.subject, description: a.description ?? "", outcome: a.outcome ?? "", status: a.status ?? "pending", assignedTo: a.assignedTo ?? "" }); setOpen(true); };

  const save = () => {
    if (!form.subject) return toast.error("Subject required");
    upsert.mutate({ ...form, ...(editing ? { id: editing.id } : {}) });
  };

  const activityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      call: <Phone size={13} className="text-blue-500" />,
      email: <Mail size={13} className="text-green-500" />,
      meeting: <Users size={13} className="text-purple-500" />,
      demo: <BarChart3 size={13} className="text-orange-500" />,
    };
    return icons[type] ?? <Activity size={13} className="text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">{activities.length} Activities</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs"><Plus size={13} /> Log Activity</Button>
      </div>

      {isLoading ? <div className="text-sm text-gray-400">Loading...</div> : (
        <div className="space-y-2">
          {activities.map((a: Activity) => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border bg-white hover:shadow-sm transition-shadow">
              <div className="mt-0.5">{activityIcon(a.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm text-gray-900">{a.subject}</span>
                  <Badge className={`text-xs ${statusColor[a.status ?? ""] ?? "bg-gray-100 text-gray-600"}`}>{a.status}</Badge>
                  <span className="text-xs text-gray-400 capitalize">{a.type}</span>
                </div>
                {a.description && <p className="text-xs text-gray-500 truncate">{a.description}</p>}
                {a.outcome && <p className="text-xs text-green-600 mt-0.5">Outcome: {a.outcome}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(a)} className="p-1 rounded hover:bg-gray-100"><Pencil size={13} className="text-gray-400" /></button>
                <button onClick={() => del.mutate({ id: a.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={13} className="text-red-400" /></button>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">No activities logged yet. Start tracking your outreach and meetings.</div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Activity" : "Log Activity"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Activity Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["pending", "completed", "cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Subject *</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Discovery call with Boots buyer" /></div>
            <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="col-span-2"><Label className="text-xs">Outcome</Label><Input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} placeholder="e.g. Agreed to send samples" /></div>
            <div className="col-span-2"><Label className="text-xs">Assigned To</Label><Input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Pipeline Config Tab ──────────────────────────────────────────────────────
function PipelineConfigTab() {
  const utils = trpc.useUtils();
  const { data: pipelines = [] } = trpc.commercialCrm.pipelines.list.useQuery({});
  const upsertPipeline = trpc.commercialCrm.pipelines.upsert.useMutation({
    onSuccess: () => { utils.commercialCrm.pipelines.list.invalidate(); toast.success("Pipeline saved"); setPipelineOpen(false); },
  });
  const delPipeline = trpc.commercialCrm.pipelines.delete.useMutation({
    onSuccess: () => { utils.commercialCrm.pipelines.list.invalidate(); toast.success("Pipeline deleted"); },
  });

  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [pipelineForm, setPipelineForm] = useState({ name: "", description: "" });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">Sales Pipelines</h3>
        <Button size="sm" onClick={() => { setPipelineForm({ name: "", description: "" }); setPipelineOpen(true); }} className="gap-1.5 text-xs">
          <Plus size={13} /> Add Pipeline
        </Button>
      </div>

      <div className="space-y-3">
        {pipelines.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border bg-white hover:shadow-sm transition-shadow">
            <div>
              <div className="font-medium text-sm text-gray-900">{p.name}</div>
              {p.description && <div className="text-xs text-gray-500 mt-0.5">{p.description}</div>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => delPipeline.mutate({ id: p.id })} className="p-1.5 rounded hover:bg-red-50"><Trash2 size={13} className="text-red-400" /></button>
            </div>
          </div>
        ))}
        {pipelines.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No pipelines configured. Create a pipeline to organise your deals.</div>
        )}
      </div>

      <Dialog open={pipelineOpen} onOpenChange={setPipelineOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Pipeline</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Pipeline Name *</Label><Input value={pipelineForm.name} onChange={e => setPipelineForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. B2B Retail" /></div>
            <div><Label className="text-xs">Description</Label><Textarea value={pipelineForm.description} onChange={e => setPipelineForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setPipelineOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!pipelineForm.name) return; upsertPipeline.mutate(pipelineForm); }} disabled={upsertPipeline.isPending}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommercialCRM() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3B85BA15", color: "#3B85BA" }}>Commercial</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">Go-to-Market Execution</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>Commercial CRM</h1>
            <p className="text-sm text-gray-500 max-w-xl">Manage contacts, leads, deals, and activities across your venture portfolio — replacing HubSpot and spreadsheets.</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 bg-gray-100 p-1 rounded-xl">
            {[
              { value: "overview", label: "Overview", icon: BarChart3 },
              { value: "contacts", label: "Contacts", icon: Users },
              { value: "leads", label: "Leads", icon: Target },
              { value: "deals", label: "Deal Pipeline", icon: TrendingUp },
              { value: "activities", label: "Activities", icon: Activity },
              { value: "config", label: "Pipeline Config", icon: Settings },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5">
                <t.icon size={13} />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="contacts"><ContactsTab /></TabsContent>
          <TabsContent value="leads"><LeadsTab /></TabsContent>
          <TabsContent value="deals"><DealPipelineTab /></TabsContent>
          <TabsContent value="activities"><ActivitiesTab /></TabsContent>
          <TabsContent value="config"><PipelineConfigTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
