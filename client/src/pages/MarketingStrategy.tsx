// ============================================================
// ECOBLEND — Marketing Strategy Module
// DB-backed: trpc.marketingBrand.campaigns + channelScores
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  PieChart, Pie,
} from "recharts";
import { Megaphone, Target, TrendingUp, Globe, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type CampaignStatus = "Live" | "Planned" | "Completed" | "Paused";

const STATUS_COLORS: Record<string, string> = {
  Live: "#22c55e",
  Planned: "#1d4ed8",
  Completed: "#9ca3af",
  Paused: "#ef4444",
};

const CHANNELS = ["OEM Direct", "Trade Shows", "Digital B2B", "D2C E-Commerce", "Social Media", "PR & Press", "Partnerships"];
const VENTURES = [
  { id: "ecoblend", name: "EcoRace", color: "#22c55e" },
  { id: "bebus", name: "BEBUS", color: "#1d4ed8" },
  { id: "tone", name: "TONE", color: "#7c3aed" },
  { id: "real", name: "REAL", color: "#f59e0b" },
];

const BRAND_DIMENSIONS = ["Visual Identity", "Tone of Voice", "Digital Presence", "Partner Messaging", "Sustainability Story", "Brand Guidelines"];

const EMPTY_FORM = {
  ventureId: "ecoblend",
  name: "",
  channel: "Digital B2B",
  status: "Planned" as CampaignStatus,
  budget: 0,
  spent: 0,
  leads: 0,
  conversions: 0,
  startDate: "",
  endDate: "",
  objective: "",
  notes: "",
};

export default function MarketingStrategy() {
  const [filterStatus, setFilterStatus] = useState<"All" | CampaignStatus>("All");
  const [selectedVenture, setSelectedVenture] = useState("ecoblend");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const utils = trpc.useUtils();

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data: campaigns = [], isLoading: campaignsLoading } = trpc.marketingBrand.campaigns.list.useQuery({});
  const { data: channelScores = [] } = trpc.marketingBrand.channelScores.list.useQuery({});
  const { data: summary } = trpc.marketingBrand.campaigns.getSummary.useQuery({});

  // ── Mutations ────────────────────────────────────────────────────────────────
  const upsert = trpc.marketingBrand.campaigns.upsert.useMutation({
    onSuccess: () => {
      utils.marketingBrand.campaigns.list.invalidate();
      utils.marketingBrand.campaigns.getSummary.invalidate();
      toast.success(editing ? "Campaign updated" : "Campaign created");
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.marketingBrand.campaigns.delete.useMutation({
    onSuccess: () => {
      utils.marketingBrand.campaigns.list.invalidate();
      utils.marketingBrand.campaigns.getSummary.invalidate();
      toast.success("Campaign deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredCampaigns = useMemo(
    () => filterStatus === "All" ? campaigns : campaigns.filter(c => c.status === filterStatus),
    [campaigns, filterStatus]
  );

  // Channel scores for the selected venture
  const ventureScores = useMemo(() => {
    const scores = channelScores.filter(s => s.ventureId === selectedVenture);
    return BRAND_DIMENSIONS.map(dim => {
      const found = scores.find(s => s.channel === dim);
      return { subject: dim, score: found?.score ?? 0, fullMark: 100 };
    });
  }, [channelScores, selectedVenture]);

  const selectedVentureInfo = VENTURES.find(v => v.id === selectedVenture) ?? VENTURES[0];

  // Channel split pie
  const channelData = useMemo(() => [
    { name: "B2B (BEBUS + EcoRace)", value: campaigns.filter(c => c.ventureId === "bebus" || c.ventureId === "ecoblend").length, color: "#1d4ed8" },
    { name: "D2C (TONE + REAL)", value: campaigns.filter(c => c.ventureId === "tone" || c.ventureId === "real").length, color: "#7c3aed" },
  ], [campaigns]);

  // Budget by venture
  const budgetData = useMemo(() => VENTURES.map(v => ({
    name: v.name,
    Budget: campaigns.filter(c => c.ventureId === v.id).reduce((a, c) => a + (c.budget ?? 0), 0),
    Spent: campaigns.filter(c => c.ventureId === v.id).reduce((a, c) => a + (c.spent ?? 0), 0),
    color: v.color,
  })), [campaigns]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (c: typeof campaigns[0]) => {
    setEditing(c.id);
    setForm({
      ventureId: c.ventureId,
      name: c.name,
      channel: c.channel,
      status: c.status as CampaignStatus,
      budget: c.budget ?? 0,
      spent: c.spent ?? 0,
      leads: c.leads ?? 0,
      conversions: c.conversions ?? 0,
      startDate: c.startDate ?? "",
      endDate: c.endDate ?? "",
      objective: c.objective ?? "",
      notes: c.notes ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Campaign name is required");
    upsert.mutate({ id: editing ?? undefined, ...form });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#f59e0b15", color: "#f59e0b" }}>
            Marketing
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">Brand Consistency & Campaign Tracker</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Marketing Strategy
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Track campaign performance and brand consistency across the portfolio. BEBUS operates as a B2B ingredient brand; TONE and REAL are D2C consumer brands.
            </p>
          </div>
          <Button size="sm" onClick={openNew} className="gap-1.5 text-xs" style={{ background: "#f59e0b", color: "white" }}>
            <Plus size={13} /> New Campaign
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Budget", value: `£${((summary?.totalBudget ?? 0) / 1000).toFixed(0)}k`, sub: `£${((summary?.totalSpent ?? 0) / 1000).toFixed(0)}k spent`, color: "#f59e0b", icon: Target },
            { label: "Live Campaigns", value: (summary?.live ?? 0).toString(), sub: `${summary?.total ?? 0} total`, color: "#22c55e", icon: Megaphone },
            { label: "Total Leads", value: (summary?.totalLeads ?? 0).toLocaleString(), sub: `${summary?.totalConversions ?? 0} conversions`, color: "#7c3aed", icon: Globe },
            { label: "Conversion Rate", value: `${summary?.conversionRate ?? 0}%`, sub: "leads → conversions", color: "#1d4ed8", icon: TrendingUp },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                  <kpi.icon size={14} style={{ color: kpi.color }} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{kpi.label}</span>
              </div>
              <div className="text-3xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Channel split + Budget bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Channel Model Split</h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [`${v} campaigns`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-2">
              {channelData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Marketing Budget by Venture</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={budgetData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `£${v / 1000}k`} />
                <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Budget" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" radius={[4, 4, 0, 0]}>
                  {budgetData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Consistency Radar */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Brand Consistency Radar</h2>
            <div className="flex gap-2">
              {VENTURES.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVenture(v.id)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{
                    background: selectedVenture === v.id ? v.color : "#f3f4f6",
                    color: selectedVenture === v.id ? "white" : "#6b7280",
                  }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={ventureScores}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <Radar name={selectedVentureInfo.name} dataKey="score" stroke={selectedVentureInfo.color} fill={selectedVentureInfo.color} fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Dimension Scores</div>
              {ventureScores.map(s => (
                <div key={s.subject}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{s.subject}</span>
                    <span className="font-mono font-bold" style={{ color: selectedVentureInfo.color }}>{s.score}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: selectedVentureInfo.color }} />
                  </div>
                </div>
              ))}
              {ventureScores.length > 0 && (
                <div className="pt-2 border-t" style={{ borderColor: "#f3f4f6" }}>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold">Overall Score</span>
                    <span className="font-mono font-bold" style={{ color: selectedVentureInfo.color }}>
                      {Math.round(ventureScores.reduce((a, s) => a + s.score, 0) / ventureScores.length)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Tracker */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Campaign Tracker</h2>
            <div className="flex gap-2">
              {(["All", "Live", "Planned", "Completed", "Paused"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{
                    background: filterStatus === f ? "#f59e0b" : "#f3f4f6",
                    color: filterStatus === f ? "white" : "#6b7280",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {campaignsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
              <Megaphone size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-400">No campaigns yet. Click "New Campaign" to add one.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    {["Campaign", "Venture", "Channel", "Budget", "Spent", "Leads", "Timeline", "Status", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((c, i) => {
                    const v = VENTURES.find(v => v.id === c.ventureId);
                    return (
                      <tr key={c.id} style={{ borderBottom: i < filteredCampaigns.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800 max-w-[180px]">{c.name}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold" style={{ color: v?.color ?? "#6b7280" }}>{v?.name ?? c.ventureId}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{c.channel}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">£{(c.budget ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono font-semibold" style={{ color: v?.color ?? "#6b7280" }}>
                            £{(c.spent ?? 0).toLocaleString()}
                          </div>
                          <div className="w-16 h-1 rounded-full bg-gray-100 mt-1 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(c.budget ?? 0) > 0 ? Math.min(((c.spent ?? 0) / (c.budget ?? 1)) * 100, 100) : 0}%`, background: v?.color ?? "#6b7280" }} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">{c.leads ?? 0}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">{c.startDate || "—"} → {c.endDate || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs" style={{ borderColor: STATUS_COLORS[c.status] ?? "#9ca3af", color: STATUS_COLORS[c.status] ?? "#9ca3af", background: `${STATUS_COLORS[c.status] ?? "#9ca3af"}15` }}>
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(c)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100">
                              <Pencil size={12} className="text-gray-400" />
                            </button>
                            <button onClick={() => remove.mutate({ id: c.id })} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50">
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* VBS Brand Model */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>VBS Centralised Brand Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Ingredient Brand (B2B)", desc: "BEBUS operates as a Tier 1 ingredient brand. The VBS manages a consistent technical brand narrative that positions BEBUS as a trusted sustainability partner to OEM customers globally.", color: "#1d4ed8" },
              { title: "D2C Consumer Brands", desc: "TONE and REAL are direct-to-consumer brands. The VBS provides centralised brand guidelines, tone of voice, and sustainability storytelling frameworks.", color: "#7c3aed" },
              { title: "EcoRace Parent Brand", desc: "EcoRace acts as the parent brand and R&D engine. Its brand identity signals scientific credibility and environmental leadership, providing a halo effect for all spin-off ventures.", color: "#22c55e" },
            ].map(item => (
              <div key={item.title} className="rounded-lg p-4" style={{ background: `${item.color}08`, border: `1px solid ${item.color}25` }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: item.color }}>{item.title}</div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Campaign Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Campaign" : "New Campaign"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Campaign Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. EV OEM Partner Outreach Q1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Venture</label>
                <Select value={form.ventureId} onValueChange={v => setForm(f => ({ ...f, ventureId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VENTURES.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Channel</label>
                <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as CampaignStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Planned", "Live", "Completed", "Paused"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Budget (£)</label>
                <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Spent (£)</label>
                <Input type="number" value={form.spent} onChange={e => setForm(f => ({ ...f, spent: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Leads</label>
                <Input type="number" value={form.leads} onChange={e => setForm(f => ({ ...f, leads: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Start Date</label>
                <Input value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} placeholder="2026-01" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">End Date</label>
                <Input value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} placeholder="2026-06" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Objective</label>
              <Input value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="Campaign objective..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={upsert.isPending} style={{ background: "#f59e0b", color: "white" }}>
              {upsert.isPending ? <Loader2 className="animate-spin" size={14} /> : editing ? "Save Changes" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
