/**
 * Investor CRM — Funding Execution
 * Tabs: Overview | Investors | Funding Rounds | Term Sheets | Cap Table | Investor Updates
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users, TrendingUp, DollarSign, FileText, PieChart, Bell, Plus, Pencil, Trash2,
  Building, Mail, Globe, BarChart3
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Investor = {
  id: number; name: string; investorType?: string | null; firm?: string | null;
  email?: string | null; phone?: string | null; linkedinUrl?: string | null;
  website?: string | null; investmentFocus?: string | null; typicalTicketSize?: string | null;
  relationshipStatus?: string | null; notes?: string | null;
};
type FundingRound = {
  id: number; name: string; ventureId?: string | null; roundType?: string | null;
  targetAmount?: number | null; raisedAmount?: number | null; status?: string | null;
  leadInvestor?: string | null; closingDate?: number | null; notes?: string | null;
};
type TermSheet = {
  id: number; roundId?: string | null; ventureId?: string | null; investorContactId?: string | null;
  investorName?: string | null; preMoneyVal?: number | null; investmentAmount?: number | null; equityPercent?: number | null;
  status?: string | null; keyTerms?: string | null; expiryDate?: number | null; notes?: string | null;
};
type CapTableEntry = {
  id: number; ventureId?: string | null; shareholderName: string; shareholderType?: string | null;
  shareClass?: string | null; numberOfShares?: number | null; ownershipPercent?: number | null;
  investmentAmount?: number | null; notes?: string | null;
};
type InvestorUpdate = {
  id: number; ventureId?: string | null; title: string; content?: string | null;
  updateType?: string | null; sentAt?: number | null; recipients?: string | null; status?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const INVESTOR_TYPES = ["angel", "vc", "family_office", "corporate", "accelerator", "grant", "crowdfunding", "other"];
const INVESTOR_STATUSES = ["prospect", "contacted", "interested", "committed", "passed", "portfolio"];
const ROUND_TYPES = ["pre_seed", "seed", "series_a", "series_b", "bridge", "grant", "convertible_note", "safe"];
const ROUND_STATUSES = ["planning", "open", "closing", "closed", "cancelled"];
const TERM_STATUSES = ["draft", "sent", "under_review", "accepted", "rejected", "expired"];
const HOLDER_TYPES = ["founder", "investor", "employee", "advisor", "option_pool", "other"];
const UPDATE_TYPES = ["monthly", "quarterly", "milestone", "urgent", "agm"];

const statusColor: Record<string, string> = {
  prospect: "bg-gray-100 text-gray-600",
  contacted: "bg-blue-100 text-blue-700",
  interested: "bg-yellow-100 text-yellow-700",
  committed: "bg-green-100 text-green-700",
  passed: "bg-red-100 text-red-700",
  portfolio: "bg-purple-100 text-purple-700",
  planning: "bg-gray-100 text-gray-600",
  open: "bg-blue-100 text-blue-700",
  closing: "bg-yellow-100 text-yellow-700",
  closed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-red-50 text-red-400",
};

function fmt(n: number | null | undefined) {
  if (!n) return "£0";
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}K`;
  return "£" + n.toLocaleString();
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: summary } = trpc.investorCrm.summary.get.useQuery({});

  const kpis = [
    { label: "Total Investors", value: summary?.totalInvestors ?? 0, sub: `${summary?.activeInvestors ?? 0} active`, icon: Users, color: "#3A97D3" },
    { label: "Open Rounds", value: summary?.openRounds ?? 0, sub: `${summary?.closedRounds ?? 0} closed`, icon: TrendingUp, color: "#51AF37" },
    { label: "Total Raised", value: fmt(summary?.totalRaised), icon: DollarSign, color: "#F49C13" },
    { label: "Cap Table Entries", value: summary?.capTableEntries ?? 0, icon: Building, color: "#8b5cf6" },
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
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Investor Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Prospects", count: summary?.prospectInvestors ?? 0 },
              { label: "Active", count: summary?.activeInvestors ?? 0 },
              { label: "Signed Term Sheets", count: summary?.signedTermSheets ?? 0 },
              { label: "Pending Term Sheets", count: summary?.pendingTermSheets ?? 0 },
            ].map(s => {
              const total = Math.max(summary?.totalInvestors ?? 1, 1);
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-36">{s.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${(s.count / total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-gray-600 w-5 text-right">{s.count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Funding Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Total Target (All Rounds)</span>
              <span className="text-lg font-bold text-blue-600">{fmt(summary?.totalTarget)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Total Raised</span>
              <span className="text-lg font-bold text-green-600">{fmt(summary?.totalRaised)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Pending Term Sheets</span>
              <span className="text-lg font-bold text-orange-500">{summary?.pendingTermSheets ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Investors Tab ────────────────────────────────────────────────────────────
function InvestorsTab() {
  const utils = trpc.useUtils();
  const { data: investors = [], isLoading } = trpc.investorCrm.contacts.list.useQuery({});
  const upsert = trpc.investorCrm.contacts.upsert.useMutation({
    onSuccess: () => { utils.investorCrm.contacts.list.invalidate(); utils.investorCrm.summary.get.invalidate(); toast.success("Investor saved"); setOpen(false); },
    onError: () => toast.error("Failed to save investor"),
  });
  const del = trpc.investorCrm.contacts.delete.useMutation({
    onSuccess: () => { utils.investorCrm.contacts.list.invalidate(); utils.investorCrm.summary.get.invalidate(); toast.success("Investor deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investor | null>(null);
  const [form, setForm] = useState({ name: "", investorType: "angel", firm: "", email: "", phone: "", linkedinUrl: "", website: "", investmentFocus: "", typicalTicketSize: "", relationshipStatus: "prospect", notes: "", ventureId: "" });

  const openNew = () => { setEditing(null); setForm({ name: "", investorType: "angel", firm: "", email: "", phone: "", linkedinUrl: "", website: "", investmentFocus: "", typicalTicketSize: "", relationshipStatus: "prospect", notes: "", ventureId: "" }); setOpen(true); };
  const openEdit = (inv: Investor) => { setEditing(inv); setForm({ name: inv.name, investorType: inv.investorType ?? "angel", firm: inv.firm ?? "", email: inv.email ?? "", phone: inv.phone ?? "", linkedinUrl: inv.linkedinUrl ?? "", website: inv.website ?? "", investmentFocus: inv.investmentFocus ?? "", typicalTicketSize: inv.typicalTicketSize ?? "", relationshipStatus: inv.relationshipStatus ?? "prospect", notes: inv.notes ?? "", ventureId: "" }); setOpen(true); };

  const save = () => {
    if (!form.name) return toast.error("Investor name required");
    upsert.mutate({ ...form, ...(editing ? { id: editing.id } : {}) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">{investors.length} Investors</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs"><Plus size={13} /> Add Investor</Button>
      </div>

      {isLoading ? <div className="text-sm text-gray-400">Loading...</div> : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Name", "Firm", "Type", "Focus", "Ticket Size", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {investors.map((inv: Investor) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{inv.name}</div>
                    {inv.email && <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Mail size={10} />{inv.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.firm ?? "—"}</td>
                  <td className="px-4 py-3"><Badge className="text-xs bg-gray-100 text-gray-600 capitalize">{inv.investorType ?? "—"}</Badge></td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">{inv.investmentFocus ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{inv.typicalTicketSize ?? "—"}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${statusColor[inv.relationshipStatus ?? ""] ?? "bg-gray-100 text-gray-600"}`}>{inv.relationshipStatus ?? "—"}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(inv)} className="p-1 rounded hover:bg-gray-100"><Pencil size={13} className="text-gray-400" /></button>
                      <button onClick={() => del.mutate({ id: inv.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={13} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {investors.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No investors yet. Add your first investor to start building your funding pipeline.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Investor" : "Add Investor"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Investor Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sarah Chen" /></div>
            <div><Label className="text-xs">Firm / Fund</Label><Input value={form.firm} onChange={e => setForm(f => ({ ...f, firm: e.target.value }))} placeholder="e.g. Octopus Ventures" /></div>
            <div><Label className="text-xs">Investor Type</Label>
              <Select value={form.investorType} onValueChange={v => setForm(f => ({ ...f, investorType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INVESTOR_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label className="text-xs">Focus / Thesis</Label><Input value={form.investmentFocus} onChange={e => setForm(f => ({ ...f, investmentFocus: e.target.value }))} placeholder="e.g. CleanTech, B2B SaaS" /></div>
            <div><Label className="text-xs">Typical Ticket Size</Label><Input value={form.typicalTicketSize} onChange={e => setForm(f => ({ ...f, typicalTicketSize: e.target.value }))} placeholder="e.g. £50K–£500K" /></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.relationshipStatus} onValueChange={v => setForm(f => ({ ...f, relationshipStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INVESTOR_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Website</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." /></div>
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

// ─── Funding Rounds Tab ───────────────────────────────────────────────────────
function FundingRoundsTab() {
  const utils = trpc.useUtils();
  const { data: rounds = [], isLoading } = trpc.investorCrm.rounds.list.useQuery({});
  const upsert = trpc.investorCrm.rounds.upsert.useMutation({
    onSuccess: () => { utils.investorCrm.rounds.list.invalidate(); utils.investorCrm.summary.get.invalidate(); toast.success("Round saved"); setOpen(false); },
    onError: () => toast.error("Failed to save round"),
  });
  const del = trpc.investorCrm.rounds.delete.useMutation({
    onSuccess: () => { utils.investorCrm.rounds.list.invalidate(); utils.investorCrm.summary.get.invalidate(); toast.success("Round deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FundingRound | null>(null);
  const [form, setForm] = useState({ name: "", roundType: "seed", targetAmount: 0, raisedAmount: 0, status: "planning", leadInvestor: "", notes: "" });

  const openNew = () => { setEditing(null); setForm({ name: "", roundType: "seed", targetAmount: 0, raisedAmount: 0, status: "planning", leadInvestor: "", notes: "" }); setOpen(true); };
  const openEdit = (r: FundingRound) => { setEditing(r); setForm({ name: r.name, roundType: r.roundType ?? "seed", targetAmount: r.targetAmount ?? 0, raisedAmount: r.raisedAmount ?? 0, status: r.status ?? "planning", leadInvestor: r.leadInvestor ?? "", notes: r.notes ?? "" }); setOpen(true); };

  const save = () => {
    if (!form.name) return toast.error("Round name required");
    upsert.mutate({ ...form, ventureId: "portfolio", ...(editing ? { id: editing.id } : {}) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">{rounds.length} Funding Rounds</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs"><Plus size={13} /> Add Round</Button>
      </div>

      {isLoading ? <div className="text-sm text-gray-400">Loading...</div> : (
        <div className="space-y-3">
          {rounds.map((r: FundingRound) => {
            const progress = r.targetAmount ? Math.min(100, ((r.raisedAmount ?? 0) / r.targetAmount) * 100) : 0;
            return (
              <div key={r.id} className="p-4 rounded-xl border bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{r.name}</span>
                      <Badge className={`text-xs ${statusColor[r.status ?? ""] ?? "bg-gray-100 text-gray-600"}`}>{r.status}</Badge>
                      <Badge className="text-xs bg-gray-100 text-gray-600 uppercase">{r.roundType?.replace("_", " ")}</Badge>
                    </div>
                    {r.leadInvestor && <div className="text-xs text-gray-500 mt-0.5">Lead: {r.leadInvestor}</div>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1 rounded hover:bg-gray-100"><Pencil size={13} className="text-gray-400" /></button>
                    <button onClick={() => del.mutate({ id: r.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={13} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Raised: <span className="font-bold text-green-600">{fmt(r.raisedAmount)}</span></span>
                    <span>Target: <span className="font-bold text-gray-700">{fmt(r.targetAmount)}</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-xs text-gray-400 text-right">{progress.toFixed(0)}% funded</div>
                </div>
              </div>
            );
          })}
          {rounds.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">No funding rounds yet. Create your first round to start tracking fundraising.</div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Round" : "Add Funding Round"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Round Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. EcoBlend Seed Round 2026" /></div>
            <div><Label className="text-xs">Round Type</Label>
              <Select value={form.roundType} onValueChange={v => setForm(f => ({ ...f, roundType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROUND_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROUND_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Target Amount (£)</Label><Input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Raised Amount (£)</Label><Input type="number" value={form.raisedAmount} onChange={e => setForm(f => ({ ...f, raisedAmount: Number(e.target.value) }))} /></div>
            <div className="col-span-2"><Label className="text-xs">Lead Investor</Label><Input value={form.leadInvestor} onChange={e => setForm(f => ({ ...f, leadInvestor: e.target.value }))} /></div>
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

// ─── Term Sheets Tab ──────────────────────────────────────────────────────────
function TermSheetsTab() {
  const utils = trpc.useUtils();
  const { data: termSheets = [], isLoading } = trpc.investorCrm.termSheets.list.useQuery({});
  const upsert = trpc.investorCrm.termSheets.upsert.useMutation({
    onSuccess: () => { utils.investorCrm.termSheets.list.invalidate(); utils.investorCrm.summary.get.invalidate(); toast.success("Term sheet saved"); setOpen(false); },
    onError: () => toast.error("Failed to save term sheet"),
  });
  const del = trpc.investorCrm.termSheets.delete.useMutation({
    onSuccess: () => { utils.investorCrm.termSheets.list.invalidate(); utils.investorCrm.summary.get.invalidate(); toast.success("Term sheet deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TermSheet | null>(null);
  const [form, setForm] = useState({ preMoneyVal: 0, investmentAmount: 0, equityPercent: 0, status: "draft", keyTerms: "", notes: "" });

  const openNew = () => { setEditing(null); setForm({ preMoneyVal: 0, investmentAmount: 0, equityPercent: 0, status: "draft", keyTerms: "", notes: "" }); setOpen(true); };
  const openEdit = (ts: TermSheet) => { setEditing(ts); setForm({ preMoneyVal: ts.preMoneyVal ?? 0, investmentAmount: ts.investmentAmount ?? 0, equityPercent: ts.equityPercent ?? 0, status: ts.status ?? "draft", keyTerms: ts.keyTerms ?? "", notes: ts.notes ?? "" }); setOpen(true); };

  const save = () => {
    upsert.mutate({ ...form, roundId: 0, ventureId: "portfolio", investorName: "TBD", ...(editing ? { id: editing.id } : {}) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">{termSheets.length} Term Sheets</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs"><Plus size={13} /> Add Term Sheet</Button>
      </div>

      {isLoading ? <div className="text-sm text-gray-400">Loading...</div> : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Valuation", "Investment", "Equity %", "Status", "Key Terms", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {termSheets.map((ts: TermSheet) => (
                <tr key={ts.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-900">{fmt(ts.preMoneyVal)}</td>
                  <td className="px-4 py-3 text-green-600 font-semibold">{fmt(ts.investmentAmount)}</td>
                  <td className="px-4 py-3 text-blue-600 font-mono">{ts.equityPercent ?? 0}%</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${statusColor[ts.status ?? ""] ?? "bg-gray-100 text-gray-600"}`}>{ts.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{ts.keyTerms ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(ts)} className="p-1 rounded hover:bg-gray-100"><Pencil size={13} className="text-gray-400" /></button>
                      <button onClick={() => del.mutate({ id: ts.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={13} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {termSheets.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No term sheets yet. Add a term sheet to track investment offers.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Term Sheet" : "Add Term Sheet"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Pre-Money Valuation (£)</Label><Input type="number" value={form.preMoneyVal} onChange={e => setForm(f => ({ ...f, preMoneyVal: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Investment Amount (£)</Label><Input type="number" value={form.investmentAmount} onChange={e => setForm(f => ({ ...f, investmentAmount: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Equity % Offered</Label><Input type="number" min={0} max={100} step={0.1} value={form.equityPercent} onChange={e => setForm(f => ({ ...f, equityPercent: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TERM_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Key Terms (liquidation preference, pro-rata rights, board seats, etc.)</Label><Textarea value={form.keyTerms} onChange={e => setForm(f => ({ ...f, keyTerms: e.target.value }))} rows={3} placeholder="e.g. 1x non-participating liquidation preference, 1 board seat, pro-rata rights up to £2M" /></div>
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

// ─── Cap Table Tab ────────────────────────────────────────────────────────────
function CapTableTab() {
  const utils = trpc.useUtils();
  const { data: entries = [], isLoading } = trpc.investorCrm.capTable.list.useQuery({ ventureId: "portfolio" });
  const upsert = trpc.investorCrm.capTable.upsert.useMutation({
    onSuccess: () => { utils.investorCrm.capTable.list.invalidate(); toast.success("Cap table entry saved"); setOpen(false); },
    onError: () => toast.error("Failed to save entry"),
  });
  const del = trpc.investorCrm.capTable.delete.useMutation({
    onSuccess: () => { utils.investorCrm.capTable.list.invalidate(); toast.success("Entry deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CapTableEntry | null>(null);
  const [form, setForm] = useState({ shareholderName: "", shareholderType: "founder", shareClass: "ordinary", numberOfShares: 0, ownershipPercent: 0, investmentAmount: 0, notes: "" });

  const openNew = () => { setEditing(null); setForm({ shareholderName: "", shareholderType: "founder", shareClass: "ordinary", numberOfShares: 0, ownershipPercent: 0, investmentAmount: 0, notes: "" }); setOpen(true); };
  const openEdit = (e: CapTableEntry) => { setEditing(e); setForm({ shareholderName: e.shareholderName, shareholderType: e.shareholderType ?? "founder", shareClass: e.shareClass ?? "ordinary", numberOfShares: e.numberOfShares ?? 0, ownershipPercent: e.ownershipPercent ?? 0, investmentAmount: e.investmentAmount ?? 0, notes: e.notes ?? "" }); setOpen(true); };

  const save = () => {
    if (!form.shareholderName) return toast.error("Holder name required");
    upsert.mutate({ ...form, ventureId: "portfolio", ...(editing ? { id: editing.id } : {}) });
  };

  const totalOwnership = entries.reduce((sum: number, e: CapTableEntry) => sum + (e.ownershipPercent ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">{entries.length} Shareholders</h3>
          <p className="text-xs text-gray-400">Total ownership tracked: {totalOwnership.toFixed(1)}%</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs"><Plus size={13} /> Add Entry</Button>
      </div>

      {isLoading ? <div className="text-sm text-gray-400">Loading...</div> : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Holder", "Type", "Share Class", "Shares", "Ownership %", "Investment", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((e: CapTableEntry) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{e.shareholderName}</td>
                  <td className="px-4 py-3"><Badge className="text-xs bg-gray-100 text-gray-600 capitalize">{e.shareholderType ?? "—"}</Badge></td>
                  <td className="px-4 py-3 text-xs text-gray-600 capitalize">{e.shareClass ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">{(e.numberOfShares ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, Number(e.ownershipPercent ?? 0))}%` }} />
                      </div>
                      <span className="font-mono text-xs text-blue-600">{Number(e.ownershipPercent ?? 0).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{fmt(e.investmentAmount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(e)} className="p-1 rounded hover:bg-gray-100"><Pencil size={13} className="text-gray-400" /></button>
                      <button onClick={() => del.mutate({ id: e.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={13} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No cap table entries yet. Add shareholders to track ownership.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Entry" : "Add Cap Table Entry"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Holder Name *</Label><Input value={form.shareholderName} onChange={e => setForm(f => ({ ...f, shareholderName: e.target.value }))} placeholder="e.g. James Whitfield" /></div>
            <div><Label className="text-xs">Holder Type</Label>
              <Select value={form.shareholderType} onValueChange={v => setForm(f => ({ ...f, shareholderType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{HOLDER_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Share Class</Label><Input value={form.shareClass} onChange={e => setForm(f => ({ ...f, shareClass: e.target.value }))} placeholder="e.g. Ordinary, Preference A" /></div>
            <div><Label className="text-xs">Number of Shares</Label><Input type="number" value={form.numberOfShares} onChange={e => setForm(f => ({ ...f, numberOfShares: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Ownership % </Label><Input type="number" min={0} max={100} step={0.01} value={form.ownershipPercent} onChange={e => setForm(f => ({ ...f, ownershipPercent: Number(e.target.value) }))} /></div>
            <div className="col-span-2"><Label className="text-xs">Investment Amount (£)</Label><Input type="number" value={form.investmentAmount} onChange={e => setForm(f => ({ ...f, investmentAmount: Number(e.target.value) }))} /></div>
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

// ─── Investor Updates Tab ─────────────────────────────────────────────────────
function InvestorUpdatesTab() {
  const utils = trpc.useUtils();
  const { data: updates = [], isLoading } = trpc.investorCrm.updates.list.useQuery({});
  const upsert = trpc.investorCrm.updates.upsert.useMutation({
    onSuccess: () => { utils.investorCrm.updates.list.invalidate(); toast.success("Update saved"); setOpen(false); },
    onError: () => toast.error("Failed to save update"),
  });
  const del = trpc.investorCrm.updates.delete.useMutation({
    onSuccess: () => { utils.investorCrm.updates.list.invalidate(); toast.success("Update deleted"); },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InvestorUpdate | null>(null);
  const [form, setForm] = useState({ title: "", content: "", updateType: "monthly", ventureId: "portfolio" });

  const openNew = () => { setEditing(null); setForm({ title: "", content: "", updateType: "monthly", ventureId: "portfolio" }); setOpen(true); };
  const openEdit = (u: InvestorUpdate) => { setEditing(u); setForm({ title: u.title, content: u.content ?? "", updateType: u.updateType ?? "monthly", ventureId: "portfolio" }); setOpen(true); };

  const save = () => {
    if (!form.title) return toast.error("Title required");
    upsert.mutate({ ...form, ...(editing ? { id: editing.id } : {}) });
  };

  const typeColor: Record<string, string> = {
    monthly: "bg-blue-100 text-blue-700",
    quarterly: "bg-purple-100 text-purple-700",
    milestone: "bg-green-100 text-green-700",
    urgent: "bg-red-100 text-red-700",
    agm: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">{updates.length} Investor Updates</h3>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs"><Plus size={13} /> New Update</Button>
      </div>

      {isLoading ? <div className="text-sm text-gray-400">Loading...</div> : (
        <div className="space-y-3">
              {updates.map((u: InvestorUpdate) => (
            <div key={u.id} className="p-4 rounded-xl border bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm">{u.title}</span>
                    <Badge className={`text-xs ${typeColor[u.updateType ?? "monthly"] ?? "bg-gray-100 text-gray-600"}`}>{u.updateType}</Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    {u.sentAt ? new Date(u.sentAt).toLocaleDateString() : "Draft"} · {u.recipients ?? "—"} recipients
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(u)} className="p-1 rounded hover:bg-gray-100"><Pencil size={13} className="text-gray-400" /></button>
                  <button onClick={() => del.mutate({ id: u.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={13} className="text-red-400" /></button>
                </div>
              </div>
              {u.content && <p className="text-xs text-gray-500 line-clamp-2">{u.content}</p>}
            </div>
          ))}
          {updates.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">No investor updates yet. Create your first update to keep investors informed.</div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Update" : "New Investor Update"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. EcoBlend Q1 2026 Investor Update" /></div>
            <div><Label className="text-xs">Update Type</Label>
              <Select value={form.updateType} onValueChange={v => setForm(f => ({ ...f, updateType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UPDATE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Content</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} placeholder="Key highlights, metrics, milestones, asks..." /></div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InvestorCRM() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#51AF3715", color: "#51AF37" }}>Investment</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">Funding Execution</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>Investor CRM</h1>
            <p className="text-sm text-gray-500 max-w-xl">Manage investor relationships, funding rounds, term sheets, cap table, and investor communications — replacing spreadsheets.</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 bg-gray-100 p-1 rounded-xl">
            {[
              { value: "overview", label: "Overview", icon: BarChart3 },
              { value: "investors", label: "Investors", icon: Users },
              { value: "rounds", label: "Funding Rounds", icon: TrendingUp },
              { value: "termsheets", label: "Term Sheets", icon: FileText },
              { value: "captable", label: "Cap Table", icon: PieChart },
              { value: "updates", label: "Investor Updates", icon: Bell },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5">
                <t.icon size={13} />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="investors"><InvestorsTab /></TabsContent>
          <TabsContent value="rounds"><FundingRoundsTab /></TabsContent>
          <TabsContent value="termsheets"><TermSheetsTab /></TabsContent>
          <TabsContent value="captable"><CapTableTab /></TabsContent>
          <TabsContent value="updates"><InvestorUpdatesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
