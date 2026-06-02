// ============================================================
// ECORACE STUDIO — Brand PR & Newsletter Module
// DB-backed: trpc.marketingBrand.pressReleases + newsletter + mediaCoverage
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Newspaper, ExternalLink, Plus, Trash2,
  Mail, Radio, TrendingUp, Loader2, Pencil, Eye
} from "lucide-react";
import { toast } from "sonner";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";


const VENTURES = [
  { id: "ecoblend", name: "EcoRace", color: "#22c55e" },
  { id: "bebus", name: "BEBUS", color: "#1d4ed8" },
  { id: "tone", name: "TONE", color: "#7c3aed" },
  { id: "real", name: "REAL", color: "#f59e0b" },
];

const PR_STATUS_COLORS: Record<string, string> = {
  Draft: "#9ca3af",
  Scheduled: "#1d4ed8",
  Published: "#22c55e",
  Archived: "#6b7280",
};

const NL_STATUS_COLORS: Record<string, string> = {
  Draft: "#9ca3af",
  Scheduled: "#1d4ed8",
  Sent: "#22c55e",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#22c55e",
  neutral: "#6b7280",
  negative: "#ef4444",
};

const EMPTY_PR = { ventureId: "ecoblend", title: "", summary: "", status: "Draft" as const, mediaOutlets: "", coverageLinks: "", reach: 0, notes: "" };
const EMPTY_NL = { ventureId: "ecoblend", subject: "", previewText: "", status: "Draft" as const, recipients: 0, openRate: 0, clickRate: 0, unsubscribes: 0, contentUrl: "", notes: "" };
const EMPTY_MEDIA = { ventureId: "ecoblend", outlet: "", headline: "", url: "", sentiment: "neutral" as const, reach: 0, notes: "" };

export default function BrandPR() {
  const [tab, setTab] = useState("press");
  const [prOpen, setPrOpen] = useState(false);
  const [nlOpen, setNlOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [editingPr, setEditingPr] = useState<number | null>(null);
  const [editingNl, setEditingNl] = useState<number | null>(null);
  const [editingMedia, setEditingMedia] = useState<number | null>(null);
  const [prForm, setPrForm] = useState(EMPTY_PR);
  const [nlForm, setNlForm] = useState(EMPTY_NL);
  const [mediaForm, setMediaForm] = useState(EMPTY_MEDIA);

  const utils = trpc.useUtils();

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: pressReleases = [], isLoading: prLoading } = trpc.marketingBrand.pressReleases.list.useQuery({});
  const { data: newsletters = [], isLoading: nlLoading } = trpc.marketingBrand.newsletter.list.useQuery({});
  const { data: media = [], isLoading: mediaLoading } = trpc.marketingBrand.mediaCoverage.list.useQuery({});
  const { data: nlSummary } = trpc.marketingBrand.newsletter.getSummary.useQuery({});
  const { data: mediaSummary } = trpc.marketingBrand.mediaCoverage.getSummary.useQuery({});

  // ── Mutations ────────────────────────────────────────────────────────────────
  const upsertPr = trpc.marketingBrand.pressReleases.upsert.useMutation({
    onSuccess: () => { utils.marketingBrand.pressReleases.list.invalidate(); toast.success("Press release saved"); setPrOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deletePr = trpc.marketingBrand.pressReleases.delete.useMutation({
    onSuccess: () => { utils.marketingBrand.pressReleases.list.invalidate(); toast.success("Deleted"); },
  });

  const upsertNl = trpc.marketingBrand.newsletter.upsert.useMutation({
    onSuccess: () => { utils.marketingBrand.newsletter.list.invalidate(); utils.marketingBrand.newsletter.getSummary.invalidate(); toast.success("Newsletter saved"); setNlOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteNl = trpc.marketingBrand.newsletter.delete.useMutation({
    onSuccess: () => { utils.marketingBrand.newsletter.list.invalidate(); toast.success("Deleted"); },
  });

  const upsertMedia = trpc.marketingBrand.mediaCoverage.upsert.useMutation({
    onSuccess: () => { utils.marketingBrand.mediaCoverage.list.invalidate(); utils.marketingBrand.mediaCoverage.getSummary.invalidate(); toast.success("Coverage saved"); setMediaOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMedia = trpc.marketingBrand.mediaCoverage.delete.useMutation({
    onSuccess: () => { utils.marketingBrand.mediaCoverage.list.invalidate(); toast.success("Deleted"); },
  });

  // ── Derived ──────────────────────────────────────────────────────────────────
  const publishedPR = useMemo(() => pressReleases.filter(p => p.status === "Published").length, [pressReleases]);
  const totalReach = useMemo(() => media.reduce((a, m) => a + (m.reach ?? 0), 0), [media]);

  const openEditPr = (p: typeof pressReleases[0]) => {
    setEditingPr(p.id);
    setPrForm({ ventureId: p.ventureId, title: p.title, summary: p.summary ?? "", status: p.status as any, mediaOutlets: p.mediaOutlets ?? "", coverageLinks: p.coverageLinks ?? "", reach: p.reach ?? 0, notes: p.notes ?? "" });
    setPrOpen(true);
  };
  const openEditNl = (n: typeof newsletters[0]) => {
    setEditingNl(n.id);
    setNlForm({ ventureId: n.ventureId, subject: n.subject, previewText: n.previewText ?? "", status: n.status as any, recipients: n.recipients ?? 0, openRate: n.openRate ?? 0, clickRate: n.clickRate ?? 0, unsubscribes: n.unsubscribes ?? 0, contentUrl: n.contentUrl ?? "", notes: n.notes ?? "" });
    setNlOpen(true);
  };
  const openEditMedia = (m: typeof media[0]) => {
    setEditingMedia(m.id);
    setMediaForm({ ventureId: m.ventureId, outlet: m.outlet, headline: m.headline, url: m.url ?? "", sentiment: (m.sentiment ?? "neutral") as any, reach: m.reach ?? 0, notes: m.notes ?? "" });
    setMediaOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#1d4ed815", color: "#1d4ed8" }}>
            Brand
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">PR & Newsletter Management</span>
        </div>
        <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Brand PR & Newsletter
        </h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
        <p className="text-sm text-gray-500 max-w-xl">
          Manage press releases, newsletter campaigns, and media coverage across all EcoBlend ventures.
        </p>
      </div>

      <div className="p-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Press Releases", value: pressReleases.length.toString(), sub: `${publishedPR} published`, color: "#1d4ed8", icon: Newspaper },
            { label: "Newsletters Sent", value: (nlSummary?.sent ?? 0).toString(), sub: `${nlSummary?.total ?? 0} total`, color: "#22c55e", icon: Mail },
            { label: "Avg Open Rate", value: `${nlSummary?.avgOpenRate ?? 0}%`, sub: `${nlSummary?.avgClickRate ?? 0}% click rate`, color: "#7c3aed", icon: Eye },
            { label: "Media Reach", value: totalReach >= 1000 ? `${(totalReach / 1000).toFixed(0)}k` : totalReach.toString(), sub: `${mediaSummary?.positive ?? 0} positive / ${mediaSummary?.negative ?? 0} negative`, color: "#f59e0b", icon: Radio },
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

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="press" className="gap-1.5"><Newspaper size={13} /> Press Releases</TabsTrigger>
              <TabsTrigger value="newsletter" className="gap-1.5"><Mail size={13} /> Newsletters</TabsTrigger>
              <TabsTrigger value="media" className="gap-1.5"><Radio size={13} /> Media Coverage</TabsTrigger>
            </TabsList>
            {tab === "press" && (
              <Button size="sm" onClick={() => { setEditingPr(null); setPrForm(EMPTY_PR); setPrOpen(true); }} className="gap-1.5 text-xs" style={{ background: "#1d4ed8", color: "white" }}>
                <Plus size={13} /> New Press Release
              </Button>
            )}
            {tab === "newsletter" && (
              <Button size="sm" onClick={() => { setEditingNl(null); setNlForm(EMPTY_NL); setNlOpen(true); }} className="gap-1.5 text-xs" style={{ background: "#22c55e", color: "white" }}>
                <Plus size={13} /> New Newsletter
              </Button>
            )}
            {tab === "media" && (
              <Button size="sm" onClick={() => { setEditingMedia(null); setMediaForm(EMPTY_MEDIA); setMediaOpen(true); }} className="gap-1.5 text-xs" style={{ background: "#f59e0b", color: "white" }}>
                <Plus size={13} /> Add Coverage
              </Button>
            )}
          </div>

          {/* Press Releases Tab */}
          <TabsContent value="press">
            {prLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
            ) : pressReleases.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
                <Newspaper size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">No press releases yet. Click "New Press Release" to add one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pressReleases.map(p => {
                  const v = VENTURES.find(v => v.id === p.ventureId);
                  return (
                    <div key={p.id} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold" style={{ color: v?.color ?? "#6b7280" }}>{v?.name ?? p.ventureId}</span>
                            <Badge variant="outline" className="text-xs" style={{ borderColor: PR_STATUS_COLORS[p.status] ?? "#9ca3af", color: PR_STATUS_COLORS[p.status] ?? "#9ca3af", background: `${PR_STATUS_COLORS[p.status] ?? "#9ca3af"}15` }}>
                              {p.status}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{p.title}</h3>
                          {p.summary && <p className="text-xs text-gray-500 line-clamp-2">{p.summary}</p>}
                          {p.mediaOutlets && <p className="text-xs text-gray-400 mt-1">Outlets: {p.mediaOutlets}</p>}
                          {(p.reach ?? 0) > 0 && <p className="text-xs text-gray-400">Reach: {(p.reach ?? 0).toLocaleString()}</p>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {p.coverageLinks && (
                            <a href={p.coverageLinks} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100">
                              <ExternalLink size={13} className="text-gray-400" />
                            </a>
                          )}
                          <button onClick={() => openEditPr(p)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100">
                            <Pencil size={13} className="text-gray-400" />
                          </button>
                          <button onClick={() => deletePr.mutate({ id: p.id })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50">
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Newsletter Tab */}
          <TabsContent value="newsletter">
            {nlLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
            ) : newsletters.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
                <Mail size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">No newsletters yet. Click "New Newsletter" to add one.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                      {["Subject", "Venture", "Status", "Recipients", "Open Rate", "Click Rate", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {newsletters.map((n, i) => {
                      const v = VENTURES.find(v => v.id === n.ventureId);
                      return (
                        <tr key={n.id} style={{ borderBottom: i < newsletters.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800">{n.subject}</td>
                          <td className="px-4 py-3"><span className="text-xs font-semibold" style={{ color: v?.color ?? "#6b7280" }}>{v?.name ?? n.ventureId}</span></td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs" style={{ borderColor: NL_STATUS_COLORS[n.status] ?? "#9ca3af", color: NL_STATUS_COLORS[n.status] ?? "#9ca3af", background: `${NL_STATUS_COLORS[n.status] ?? "#9ca3af"}15` }}>
                              {n.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-700">{(n.recipients ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-mono" style={{ color: "#22c55e" }}>{n.openRate ?? 0}%</td>
                          <td className="px-4 py-3 text-sm font-mono" style={{ color: "#1d4ed8" }}>{n.clickRate ?? 0}%</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => openEditNl(n)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100">
                                <Pencil size={12} className="text-gray-400" />
                              </button>
                              <button onClick={() => deleteNl.mutate({ id: n.id })} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50">
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
          </TabsContent>

          {/* Media Coverage Tab */}
          <TabsContent value="media">
            {mediaLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
            ) : media.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
                <Radio size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">No media coverage yet. Click "Add Coverage" to add one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {media.map(m => {
                  const v = VENTURES.find(v => v.id === m.ventureId);
                  return (
                    <div key={m.id} className="bg-white rounded-xl border p-4 shadow-sm flex items-start justify-between gap-4" style={{ borderColor: "#e5e7eb" }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-500">{m.outlet}</span>
                          <span className="text-xs font-semibold" style={{ color: v?.color ?? "#6b7280" }}>{v?.name ?? m.ventureId}</span>
                          <Badge variant="outline" className="text-xs" style={{ borderColor: SENTIMENT_COLORS[m.sentiment ?? "neutral"], color: SENTIMENT_COLORS[m.sentiment ?? "neutral"], background: `${SENTIMENT_COLORS[m.sentiment ?? "neutral"]}15` }}>
                            {m.sentiment ?? "neutral"}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{m.headline}</p>
                        {(m.reach ?? 0) > 0 && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><TrendingUp size={11} /> {(m.reach ?? 0).toLocaleString()} reach</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {m.url && (
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100">
                            <ExternalLink size={13} className="text-gray-400" />
                          </a>
                        )}
                        <button onClick={() => openEditMedia(m)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100">
                          <Pencil size={13} className="text-gray-400" />
                        </button>
                        <button onClick={() => deleteMedia.mutate({ id: m.id })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50">
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Press Release Dialog */}
      <Dialog open={prOpen} onOpenChange={setPrOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingPr ? "Edit Press Release" : "New Press Release"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Title *</label>
              <Input value={prForm.title} onChange={e => setPrForm(f => ({ ...f, title: e.target.value }))} placeholder="Press release title..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Venture</label>
                <Select value={prForm.ventureId} onValueChange={v => setPrForm(f => ({ ...f, ventureId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VENTURES.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
                <Select value={prForm.status} onValueChange={v => setPrForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Draft", "Scheduled", "Published", "Archived"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Summary</label>
              <Textarea value={prForm.summary} onChange={e => setPrForm(f => ({ ...f, summary: e.target.value }))} rows={3} placeholder="Brief summary..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Media Outlets</label>
              <Input value={prForm.mediaOutlets} onChange={e => setPrForm(f => ({ ...f, mediaOutlets: e.target.value }))} placeholder="e.g. BBC, Guardian, TechCrunch" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Coverage URL</label>
                <Input value={prForm.coverageLinks} onChange={e => setPrForm(f => ({ ...f, coverageLinks: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Reach</label>
                <Input type="number" value={prForm.reach} onChange={e => setPrForm(f => ({ ...f, reach: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!prForm.title.trim()) return toast.error("Title required"); upsertPr.mutate({ id: editingPr ?? undefined, ...prForm }); }} disabled={upsertPr.isPending} style={{ background: "#1d4ed8", color: "white" }}>
              {upsertPr.isPending ? <Loader2 className="animate-spin" size={14} /> : editingPr ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Newsletter Dialog */}
      <Dialog open={nlOpen} onOpenChange={setNlOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingNl ? "Edit Newsletter" : "New Newsletter"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Subject *</label>
              <Input value={nlForm.subject} onChange={e => setNlForm(f => ({ ...f, subject: e.target.value }))} placeholder="Newsletter subject line..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Venture</label>
                <Select value={nlForm.ventureId} onValueChange={v => setNlForm(f => ({ ...f, ventureId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VENTURES.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
                <Select value={nlForm.status} onValueChange={v => setNlForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Draft", "Scheduled", "Sent"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Recipients</label>
                <Input type="number" value={nlForm.recipients} onChange={e => setNlForm(f => ({ ...f, recipients: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Open Rate %</label>
                <Input type="number" value={nlForm.openRate} onChange={e => setNlForm(f => ({ ...f, openRate: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Click Rate %</label>
                <Input type="number" value={nlForm.clickRate} onChange={e => setNlForm(f => ({ ...f, clickRate: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Preview Text</label>
              <Input value={nlForm.previewText} onChange={e => setNlForm(f => ({ ...f, previewText: e.target.value }))} placeholder="Short preview text..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNlOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!nlForm.subject.trim()) return toast.error("Subject required"); upsertNl.mutate({ id: editingNl ?? undefined, ...nlForm }); }} disabled={upsertNl.isPending} style={{ background: "#22c55e", color: "white" }}>
              {upsertNl.isPending ? <Loader2 className="animate-spin" size={14} /> : editingNl ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Coverage Dialog */}
      <Dialog open={mediaOpen} onOpenChange={setMediaOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingMedia ? "Edit Coverage" : "Add Media Coverage"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Headline *</label>
              <Input value={mediaForm.headline} onChange={e => setMediaForm(f => ({ ...f, headline: e.target.value }))} placeholder="Article headline..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Outlet *</label>
                <Input value={mediaForm.outlet} onChange={e => setMediaForm(f => ({ ...f, outlet: e.target.value }))} placeholder="e.g. BBC, Guardian" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Venture</label>
                <Select value={mediaForm.ventureId} onValueChange={v => setMediaForm(f => ({ ...f, ventureId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VENTURES.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Sentiment</label>
                <Select value={mediaForm.sentiment} onValueChange={v => setMediaForm(f => ({ ...f, sentiment: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["positive", "neutral", "negative"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Reach</label>
                <Input type="number" value={mediaForm.reach} onChange={e => setMediaForm(f => ({ ...f, reach: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">URL</label>
              <Input value={mediaForm.url} onChange={e => setMediaForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!mediaForm.headline.trim() || !mediaForm.outlet.trim()) return toast.error("Headline and outlet required"); upsertMedia.mutate({ id: editingMedia ?? undefined, ...mediaForm }); }} disabled={upsertMedia.isPending} style={{ background: "#f59e0b", color: "white" }}>
              {upsertMedia.isPending ? <Loader2 className="animate-spin" size={14} /> : editingMedia ? "Save" : "Add Coverage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
