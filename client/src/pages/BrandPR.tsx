// ============================================================
// ECORACE STUDIO — Brand PR & Newsletter Module
// Tracks press releases, newsletter campaigns, media coverage,
// and PR status per portfolio brand.
// ============================================================

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVentures } from "@/contexts/VentureContext";
import {
  Newspaper, Send, Eye, ExternalLink, Plus, Trash2,
  Mail, Radio, TrendingUp, Calendar, Edit3, X, Check
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type PRStatus = "Draft" | "Scheduled" | "Published" | "Archived";
type NewsletterStatus = "Draft" | "Scheduled" | "Sent";
type MediaType = "Article" | "Interview" | "Podcast" | "Video" | "Social" | "Press Mention";

interface PressRelease {
  id: string;
  brandId: string;
  title: string;
  summary: string;
  status: PRStatus;
  date: string;
  outlet?: string;
  url?: string;
}

interface NewsletterCampaign {
  id: string;
  brandId: string;
  subject: string;
  preview: string;
  status: NewsletterStatus;
  scheduledDate: string;
  openRate?: number;
  clickRate?: number;
  recipients?: number;
}

interface MediaCoverage {
  id: string;
  brandId: string;
  headline: string;
  outlet: string;
  type: MediaType;
  date: string;
  url?: string;
  sentiment: "Positive" | "Neutral" | "Negative";
}

// ── Default Data ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "ecoblend-pr-v1";

function loadData<T>(key: string, defaults: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaults;
  } catch { return defaults; }
}

function saveData<T>(key: string, data: T[]) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

const defaultPressReleases: PressRelease[] = [
  {
    id: "pr1", brandId: "ecoblend",
    title: "EcoComp Launches Advanced Bio-Composite Formulation for OEM Partners",
    summary: "EcoComp announces its first commercial-grade bio-composite material range, targeting Tier 1 OEM manufacturers in transport and sports sectors.",
    status: "Draft", date: "2026-04-15", outlet: "Composites World",
  },
  {
    id: "pr2", brandId: "real",
    title: "REAL Applies F1 Safety Science to Consumer Sports Protection",
    summary: "REAL reveals its founding vision: bringing Formula 1-grade energy-absorption technology to everyday athletes through sustainable composite materials.",
    status: "Draft", date: "2026-05-01",
  },
  {
    id: "pr3", brandId: "tone",
    title: "TONE Redefines Sustainable Creative Tools for the Entertainment Industry",
    summary: "TONE introduces its eco-creative brand proposition, targeting musicians, filmmakers, and designers who demand both performance and environmental responsibility.",
    status: "Draft", date: "2026-05-15",
  },
  {
    id: "pr4", brandId: "pipe",
    title: "PIPE Enters the Eco-Water Sport Market with Sustainable Performance Gear",
    summary: "PIPE announces its founding brand vision: ocean-inspired, performance-driven, and sustainably engineered water sport equipment for the next generation of athletes.",
    status: "Draft", date: "2026-06-01",
  },
];

const defaultNewsletters: NewsletterCampaign[] = [
  {
    id: "nl1", brandId: "ecoblend",
    subject: "EcoComp Materials Bulletin — Q1 2026",
    preview: "Our first formulation portfolio is ready. Here's what we've been building in the lab...",
    status: "Draft", scheduledDate: "2026-04-01",
  },
  {
    id: "nl2", brandId: "tone",
    subject: "TONE Launch — The Eco-Creative Revolution Starts Here",
    preview: "We're building something new for the creative industry. Here's our story...",
    status: "Draft", scheduledDate: "2026-05-20",
  },
];

const defaultMediaCoverage: MediaCoverage[] = [
  {
    id: "mc1", brandId: "ecoblend",
    headline: "EcoRace Studio Enters Materials Science with EcoRace Lab",
    outlet: "GreenBiz", type: "Article", date: "2026-03-01",
    sentiment: "Positive",
  },
  {
    id: "mc2", brandId: "real",
    headline: "Can F1 Technology Make Sports Protection More Sustainable?",
    outlet: "Sports Tech World", type: "Article", date: "2026-03-10",
    sentiment: "Positive",
  },
];

// ── Colour helpers ────────────────────────────────────────────────────────────

const STATUS_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  Draft:     { bg: "#f9fafb", text: "#9ca3af", border: "#e5e7eb" },
  Scheduled: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  Published: { bg: "#f0fdf4", text: "#51AF37", border: "#bbf7d0" },
  Archived:  { bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" },
  Sent:      { bg: "#eff6ff", text: "#3A97D3", border: "#bfdbfe" },
};

const SENTIMENT_COLOURS: Record<string, string> = {
  Positive: "#51AF37",
  Neutral:  "#9ca3af",
  Negative: "#ef4444",
};

const MEDIA_TYPE_ICONS: Record<MediaType, React.ComponentType<{ size?: number; className?: string }>> = {
  Article:       Newspaper,
  Interview:     Radio,
  Podcast:       Radio,
  Video:         Eye,
  Social:        TrendingUp,
  "Press Mention": Newspaper,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle, count, onAdd }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  count: number;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#51AF3715", color: "#51AF37" }}>
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{title}</h2>
          <p className="text-xs text-gray-400">{subtitle} · {count} item{count !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onAdd}
        style={{ borderColor: "#51AF37", color: "#51AF37" }}>
        <Plus size={13} /> Add
      </Button>
    </div>
  );
}

function BrandPill({ brandId, ventures }: { brandId: string; ventures: { id: string; name: string; color: string }[] }) {
  const v = ventures.find(v => v.id === brandId);
  if (!v) return null;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${v.color}15`, color: v.color, border: `1px solid ${v.color}30` }}>
      {v.name}
    </span>
  );
}

// ── Add Modal ─────────────────────────────────────────────────────────────────

function AddModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
            <X size={16} style={{ color: "#6b7280" }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BrandPR() {
  const { ventures: allVentures } = useVentures();
  const ventures = allVentures.filter(v => !v.isInternalLab);

  const [pressReleases, setPressReleases] = useState<PressRelease[]>(() =>
    loadData(STORAGE_KEY + "-pr", defaultPressReleases));
  const [newsletters, setNewsletters] = useState<NewsletterCampaign[]>(() =>
    loadData(STORAGE_KEY + "-nl", defaultNewsletters));
  const [mediaCoverage, setMediaCoverage] = useState<MediaCoverage[]>(() =>
    loadData(STORAGE_KEY + "-mc", defaultMediaCoverage));

  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [addingPR, setAddingPR] = useState(false);
  const [addingNL, setAddingNL] = useState(false);
  const [addingMC, setAddingMC] = useState(false);

  // Form state
  const [prForm, setPrForm] = useState({ brandId: ventures[0]?.id || "", title: "", summary: "", date: "", outlet: "", url: "" });
  const [nlForm, setNlForm] = useState({ brandId: ventures[0]?.id || "", subject: "", preview: "", scheduledDate: "" });
  const [mcForm, setMcForm] = useState({ brandId: ventures[0]?.id || "", headline: "", outlet: "", type: "Article" as MediaType, date: "", url: "", sentiment: "Positive" as MediaCoverage["sentiment"] });

  const filteredPR = filterBrand === "all" ? pressReleases : pressReleases.filter(p => p.brandId === filterBrand);
  const filteredNL = filterBrand === "all" ? newsletters : newsletters.filter(n => n.brandId === filterBrand);
  const filteredMC = filterBrand === "all" ? mediaCoverage : mediaCoverage.filter(m => m.brandId === filterBrand);

  function savePR() {
    if (!prForm.title || !prForm.date) { toast.error("Title and date are required"); return; }
    const updated = [...pressReleases, { ...prForm, id: `pr${Date.now()}`, status: "Draft" as PRStatus }];
    setPressReleases(updated);
    saveData(STORAGE_KEY + "-pr", updated);
    setAddingPR(false);
    toast.success("Press release added");
  }

  function saveNL() {
    if (!nlForm.subject || !nlForm.scheduledDate) { toast.error("Subject and date are required"); return; }
    const updated = [...newsletters, { ...nlForm, id: `nl${Date.now()}`, status: "Draft" as NewsletterStatus }];
    setNewsletters(updated);
    saveData(STORAGE_KEY + "-nl", updated);
    setAddingNL(false);
    toast.success("Newsletter campaign added");
  }

  function saveMC() {
    if (!mcForm.headline || !mcForm.outlet || !mcForm.date) { toast.error("Headline, outlet, and date are required"); return; }
    const updated = [...mediaCoverage, { ...mcForm, id: `mc${Date.now()}` }];
    setMediaCoverage(updated);
    saveData(STORAGE_KEY + "-mc", updated);
    setAddingMC(false);
    toast.success("Media coverage added");
  }

  function deletePR(id: string) {
    const updated = pressReleases.filter(p => p.id !== id);
    setPressReleases(updated);
    saveData(STORAGE_KEY + "-pr", updated);
    toast.success("Press release removed");
  }

  function deleteNL(id: string) {
    const updated = newsletters.filter(n => n.id !== id);
    setNewsletters(updated);
    saveData(STORAGE_KEY + "-nl", updated);
    toast.success("Newsletter removed");
  }

  function deleteMC(id: string) {
    const updated = mediaCoverage.filter(m => m.id !== id);
    setMediaCoverage(updated);
    saveData(STORAGE_KEY + "-mc", updated);
    toast.success("Coverage removed");
  }

  function cycleStatus(id: string, current: PRStatus) {
    const cycle: PRStatus[] = ["Draft", "Scheduled", "Published", "Archived"];
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    const updated = pressReleases.map(p => p.id === id ? { ...p, status: next } : p);
    setPressReleases(updated);
    saveData(STORAGE_KEY + "-pr", updated);
    toast.success(`Status → ${next}`);
  }

  function cycleNLStatus(id: string, current: NewsletterStatus) {
    const cycle: NewsletterStatus[] = ["Draft", "Scheduled", "Sent"];
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    const updated = newsletters.map(n => n.id === id ? { ...n, status: next } : n);
    setNewsletters(updated);
    saveData(STORAGE_KEY + "-nl", updated);
    toast.success(`Status → ${next}`);
  }

  // ── KPI summary ──────────────────────────────────────────────────────────
  const publishedPR = pressReleases.filter(p => p.status === "Published").length;
  const sentNL = newsletters.filter(n => n.status === "Sent").length;
  const positiveCoverage = mediaCoverage.filter(m => m.sentiment === "Positive").length;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <Newspaper size={16} style={{ color: "#51AF37" }} />
          <span className="vos-badge vos-badge-success" style={{ fontSize: "0.65rem" }}>Brand PR</span>
        </div>
        <h1 className="vos-page-title mb-1">Brand PR & Newsletter Hub</h1>
        <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
          Manage press releases, newsletter campaigns, and media coverage tracking across all EcoRace Studio portfolio brands.
        </p>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Press Releases", value: pressReleases.length, sub: `${publishedPR} published`, color: "#51AF37" },
            { label: "Newsletters", value: newsletters.length, sub: `${sentNL} sent`, color: "#3A97D3" },
            { label: "Media Coverage", value: mediaCoverage.length, sub: `${positiveCoverage} positive`, color: "#8b5cf6" },
            { label: "Brands Active", value: ventures.filter(v => v.status === "Active").length, sub: "in portfolio", color: "#F49C13" },
          ].map(k => (
            <div key={k.label} className="vos-metric">
              <span className="vos-metric-label">{k.label}</span>
              <span className="vos-metric-value" style={{ color: k.color }}>{k.value}</span>
              <span className="vos-metric-sub">{k.sub}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Brand filter */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mr-1">Filter:</span>
          <button
            onClick={() => setFilterBrand("all")}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
            style={{
              background: filterBrand === "all" ? "#1a2332" : "#f3f4f6",
              color: filterBrand === "all" ? "white" : "#6b7280",
            }}
          >
            All Brands
          </button>
          {ventures.map(v => (
            <button
              key={v.id}
              onClick={() => setFilterBrand(v.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{
                background: filterBrand === v.id ? v.color : `${v.color}15`,
                color: filterBrand === v.id ? "white" : v.color,
                border: `1px solid ${v.color}30`,
              }}
            >
              {v.name}
            </button>
          ))}
        </div>

        {/* ── Section 1: Press Releases ── */}
        <div className="mb-10">
          <SectionHeader
            icon={Newspaper}
            title="Press Releases"
            subtitle="Official announcements and brand communications"
            count={filteredPR.length}
            onAdd={() => setAddingPR(true)}
          />
          {filteredPR.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm border border-dashed rounded-xl" style={{ borderColor: "#e5e7eb" }}>
              No press releases yet. Click Add to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPR.map(pr => {
                const sc = STATUS_COLOURS[pr.status];
                return (
                  <div key={pr.id} className="bg-white rounded-xl border p-5 shadow-sm group" style={{ borderColor: "#e5e7eb" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <BrandPill brandId={pr.brandId} ventures={ventures} />
                        <button
                          onClick={() => cycleStatus(pr.id, pr.status)}
                          className="text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-all hover:opacity-80"
                          style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                          title="Click to advance status"
                        >
                          {pr.status}
                        </button>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {pr.url && (
                          <a href={pr.url} target="_blank" rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                            <ExternalLink size={13} style={{ color: "#6b7280" }} />
                          </a>
                        )}
                        <button onClick={() => deletePR(pr.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50">
                          <Trash2 size={13} style={{ color: "#ef4444" }} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1.5 leading-snug" style={{ fontFamily: "'Prompt', sans-serif" }}>
                      {pr.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{pr.summary}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {pr.date}</span>
                      {pr.outlet && <span className="flex items-center gap-1"><Newspaper size={11} /> {pr.outlet}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section 2: Newsletter Campaigns ── */}
        <div className="mb-10">
          <SectionHeader
            icon={Mail}
            title="Newsletter Campaigns"
            subtitle="Email marketing and subscriber communications"
            count={filteredNL.length}
            onAdd={() => setAddingNL(true)}
          />
          {filteredNL.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm border border-dashed rounded-xl" style={{ borderColor: "#e5e7eb" }}>
              No newsletter campaigns yet. Click Add to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredNL.map(nl => {
                const sc = STATUS_COLOURS[nl.status];
                return (
                  <div key={nl.id} className="bg-white rounded-xl border p-5 shadow-sm group" style={{ borderColor: "#e5e7eb" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <BrandPill brandId={nl.brandId} ventures={ventures} />
                        <button
                          onClick={() => cycleNLStatus(nl.id, nl.status)}
                          className="text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80"
                          style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                          title="Click to advance status"
                        >
                          {nl.status}
                        </button>
                      </div>
                      <button onClick={() => deleteNL(nl.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={13} style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
                      {nl.subject}
                    </h3>
                    <p className="text-xs text-gray-400 italic mb-3">"{nl.preview}"</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {nl.scheduledDate}</span>
                      {nl.recipients && <span className="flex items-center gap-1"><Send size={11} /> {nl.recipients.toLocaleString()} recipients</span>}
                      {nl.openRate !== undefined && (
                        <span className="flex items-center gap-1 font-semibold" style={{ color: "#51AF37" }}>
                          <Eye size={11} /> {nl.openRate}% open
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section 3: Media Coverage ── */}
        <div className="mb-10">
          <SectionHeader
            icon={Radio}
            title="Media Coverage"
            subtitle="Articles, interviews, podcasts, and press mentions"
            count={filteredMC.length}
            onAdd={() => setAddingMC(true)}
          />
          {filteredMC.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm border border-dashed rounded-xl" style={{ borderColor: "#e5e7eb" }}>
              No media coverage recorded yet. Click Add to log coverage.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredMC.map(mc => {
                const TypeIcon = MEDIA_TYPE_ICONS[mc.type];
                const sentColor = SENTIMENT_COLOURS[mc.sentiment];
                return (
                  <div key={mc.id} className="bg-white rounded-xl border p-4 shadow-sm group flex items-start gap-4" style={{ borderColor: "#e5e7eb" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                      <TypeIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <BrandPill brandId={mc.brandId} ventures={ventures} />
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${sentColor}15`, color: sentColor }}>
                          {mc.sentiment}
                        </span>
                        <span className="text-xs text-gray-400 px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6" }}>{mc.type}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-0.5 leading-snug">{mc.headline}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="font-semibold" style={{ color: "#374151" }}>{mc.outlet}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> {mc.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {mc.url && (
                        <a href={mc.url} target="_blank" rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                          <ExternalLink size={13} style={{ color: "#6b7280" }} />
                        </a>
                      )}
                      <button onClick={() => deleteMC(mc.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50">
                        <Trash2 size={13} style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Press Release Modal ── */}
      {addingPR && (
        <AddModal title="Add Press Release" onClose={() => setAddingPR(false)}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Brand</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                value={prForm.brandId} onChange={e => setPrForm(f => ({ ...f, brandId: e.target.value }))}>
                {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Title *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                placeholder="Press release headline..." value={prForm.title}
                onChange={e => setPrForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Summary</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-none" rows={3} style={{ borderColor: "#e5e7eb" }}
                placeholder="Brief summary of the announcement..." value={prForm.summary}
                onChange={e => setPrForm(f => ({ ...f, summary: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Date *</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                  value={prForm.date} onChange={e => setPrForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Target Outlet</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                  placeholder="e.g. GreenBiz" value={prForm.outlet}
                  onChange={e => setPrForm(f => ({ ...f, outlet: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">URL (optional)</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                placeholder="https://..." value={prForm.url}
                onChange={e => setPrForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" className="flex-1 gap-1.5" onClick={savePR} style={{ background: "#51AF37", color: "white" }}>
                <Check size={14} /> Save Press Release
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddingPR(false)}>Cancel</Button>
            </div>
          </div>
        </AddModal>
      )}

      {/* ── Add Newsletter Modal ── */}
      {addingNL && (
        <AddModal title="Add Newsletter Campaign" onClose={() => setAddingNL(false)}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Brand</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                value={nlForm.brandId} onChange={e => setNlForm(f => ({ ...f, brandId: e.target.value }))}>
                {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Subject Line *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                placeholder="Email subject..." value={nlForm.subject}
                onChange={e => setNlForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Preview Text</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                placeholder="Short preview shown in inbox..." value={nlForm.preview}
                onChange={e => setNlForm(f => ({ ...f, preview: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Scheduled Date *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                value={nlForm.scheduledDate} onChange={e => setNlForm(f => ({ ...f, scheduledDate: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" className="flex-1 gap-1.5" onClick={saveNL} style={{ background: "#3A97D3", color: "white" }}>
                <Check size={14} /> Save Campaign
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddingNL(false)}>Cancel</Button>
            </div>
          </div>
        </AddModal>
      )}

      {/* ── Add Media Coverage Modal ── */}
      {addingMC && (
        <AddModal title="Add Media Coverage" onClose={() => setAddingMC(false)}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Brand</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                value={mcForm.brandId} onChange={e => setMcForm(f => ({ ...f, brandId: e.target.value }))}>
                {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Headline *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                placeholder="Article or coverage headline..." value={mcForm.headline}
                onChange={e => setMcForm(f => ({ ...f, headline: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Outlet *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                  placeholder="e.g. GreenBiz" value={mcForm.outlet}
                  onChange={e => setMcForm(f => ({ ...f, outlet: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Type</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                  value={mcForm.type} onChange={e => setMcForm(f => ({ ...f, type: e.target.value as MediaType }))}>
                  {["Article", "Interview", "Podcast", "Video", "Social", "Press Mention"].map(t =>
                    <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Date *</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                  value={mcForm.date} onChange={e => setMcForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Sentiment</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                  value={mcForm.sentiment} onChange={e => setMcForm(f => ({ ...f, sentiment: e.target.value as MediaCoverage["sentiment"] }))}>
                  {["Positive", "Neutral", "Negative"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">URL (optional)</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }}
                placeholder="https://..." value={mcForm.url}
                onChange={e => setMcForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" className="flex-1 gap-1.5" onClick={saveMC} style={{ background: "#8b5cf6", color: "white" }}>
                <Check size={14} /> Save Coverage
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddingMC(false)}>Cancel</Button>
            </div>
          </div>
        </AddModal>
      )}
    </div>
  );
}
