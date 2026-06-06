// ============================================================
// ECOBLEND — IP Intelligence Module (Sprint 37)
// 5 tabs: Overview · IP Registry · Patent AI Workspace · Licensing · Governance
// Covers: Patents, Trademarks, Copyrights, Design Rights, Trade Secrets
// AI Pipeline: Patent Strategist (hypotheses) + Patent Attorney (section drafts)
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield, FileText, Globe, Zap, Lightbulb, BookOpen, Lock, Palette,
  Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, Circle,
  Loader2, Wand2, FileCode2, RotateCcw, AlertTriangle, Eye, Bell, BellRing,
} from "lucide-react";
import { Streamdown } from "streamdown";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";


// ── Types ────────────────────────────────────────────────────────────────────

type IpTab = "overview" | "registry" | "workspace" | "licensing" | "governance";

const IP_TYPES = ["Patent", "Trademark", "Copyright", "DesignRight", "TradeSecret"] as const;
type IpType = typeof IP_TYPES[number];

const IP_TYPE_CONFIG: Record<IpType, { label: string; icon: React.ElementType; color: string; description: string }> = {
  Patent:      { label: "Patent",       icon: Shield,    color: "#1d4ed8", description: "Novel inventions and technical innovations" },
  Trademark:   { label: "Trademark",    icon: Zap,       color: "#7c3aed", description: "Brand names, logos, and identifiers" },
  Copyright:   { label: "Copyright",    icon: BookOpen,  color: "#0891b2", description: "Creative works, software, and databases" },
  DesignRight: { label: "Design Right", icon: Palette,   color: "#d97706", description: "Aesthetic appearance of products" },
  TradeSecret: { label: "Trade Secret", icon: Lock,      color: "#dc2626", description: "Confidential business information and know-how" },
};

const PATENT_SECTIONS = ["Abstract", "Background", "Summary", "DetailedDescription", "Claims"] as const;
type PatentSection = typeof PATENT_SECTIONS[number];

const SECTION_LABELS: Record<PatentSection, string> = {
  Abstract: "Abstract",
  Background: "Background",
  Summary: "Summary of Invention",
  DetailedDescription: "Detailed Description",
  Claims: "Claims",
};

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <div className="text-3xl font-bold font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── IP Type Badge ─────────────────────────────────────────────────────────────

function IpTypeBadge({ type }: { type: string }) {
  const cfg = IP_TYPE_CONFIG[type as IpType];
  if (!cfg) return <Badge variant="outline">{type}</Badge>;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
    >
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

// ── Add/Edit Asset Modal ──────────────────────────────────────────────────────

function AssetModal({
  onClose,
  existing,
}: {
  onClose: () => void;
  existing?: {
    id: number; ventureId: string; ventureName?: string | null; ipType: string;
    title: string; reference?: string | null; description?: string | null;
    status: string; jurisdiction?: string | null; filedDate?: string | null;
    commercialPotential?: string | null; estimatedValue?: number | null;
    trl?: number | null; notes?: string | null;
    trademarkClass?: string | null; trademarkType?: string | null;
    copyrightWork?: string | null; author?: string | null;
    designType?: string | null; secretCategory?: string | null;
    protectionMeasures?: string | null;
  };
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    ventureId: existing?.ventureId ?? "ecoblend",
    ventureName: existing?.ventureName ?? "EcoRace",
    ipType: (existing?.ipType ?? "Patent") as IpType,
    title: existing?.title ?? "",
    reference: existing?.reference ?? "",
    description: existing?.description ?? "",
    status: existing?.status ?? "Draft",
    jurisdiction: existing?.jurisdiction ?? "UK",
    filedDate: existing?.filedDate ?? "",
    commercialPotential: (existing?.commercialPotential ?? "Medium") as "High" | "Medium" | "Low",
    estimatedValue: existing?.estimatedValue ?? 0,
    trl: existing?.trl ?? 1,
    notes: existing?.notes ?? "",
    trademarkClass: existing?.trademarkClass ?? "",
    trademarkType: existing?.trademarkType ?? "",
    copyrightWork: existing?.copyrightWork ?? "",
    author: existing?.author ?? "",
    designType: existing?.designType ?? "",
    secretCategory: existing?.secretCategory ?? "",
    protectionMeasures: existing?.protectionMeasures ?? "",
  });

  const upsert = trpc.ip.upsertAsset.useMutation({
    onSuccess: () => {
      utils.ip.listAssets.invalidate();
      utils.ip.getPortfolioSummary.invalidate();
      toast.success(existing ? "Asset updated" : "Asset added");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const statusOptions: Record<IpType, string[]> = {
    Patent:      ["Draft", "Filed", "Pending", "Granted", "Licensed", "Abandoned"],
    Trademark:   ["Unregistered", "Application", "Registered", "Opposed", "Expired"],
    Copyright:   ["Active", "Expired", "Disputed"],
    DesignRight: ["Unregistered", "Registered", "Expired"],
    TradeSecret: ["Active", "Compromised", "Retired"],
  };

  const f = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-base font-bold text-gray-900">{existing ? "Edit IP Asset" : "Add IP Asset"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          {/* IP Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">IP Type *</label>
            <div className="flex flex-wrap gap-2">
              {IP_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => f("ipType", t)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all border"
                  style={{
                    background: form.ipType === t ? IP_TYPE_CONFIG[t].color : "white",
                    color: form.ipType === t ? "white" : IP_TYPE_CONFIG[t].color,
                    borderColor: IP_TYPE_CONFIG[t].color,
                  }}
                >
                  {IP_TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Title *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.title} onChange={e => f("title", e.target.value)} placeholder="e.g. Eco-Composite Material Formulation" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Reference</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.reference} onChange={e => f("reference", e.target.value)} placeholder="e.g. EB-PAT-001" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-none" rows={3} style={{ borderColor: "#e5e7eb" }} value={form.description} onChange={e => f("description", e.target.value)} />
          </div>

          {/* Status, Jurisdiction, Filed Date */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.status} onChange={e => f("status", e.target.value)}>
                {statusOptions[form.ipType].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Jurisdiction</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.jurisdiction} onChange={e => f("jurisdiction", e.target.value)}>
                {["UK", "EU", "USPTO", "PCT", "EPO", "Global"].map(j => <option key={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Filed Date</label>
              <input type="month" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.filedDate} onChange={e => f("filedDate", e.target.value)} />
            </div>
          </div>

          {/* Commercial Potential, Estimated Value */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Commercial Potential</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.commercialPotential} onChange={e => f("commercialPotential", e.target.value)}>
                {["High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Est. Value (£)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.estimatedValue} onChange={e => f("estimatedValue", Number(e.target.value))} />
            </div>
            {form.ipType === "Patent" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TRL Level</label>
                <input type="number" min={1} max={9} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.trl} onChange={e => f("trl", Number(e.target.value))} />
              </div>
            )}
          </div>

          {/* Type-specific fields */}
          {form.ipType === "Trademark" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nice Classification</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.trademarkClass} onChange={e => f("trademarkClass", e.target.value)} placeholder="e.g. Class 1, 17" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mark Type</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.trademarkType} onChange={e => f("trademarkType", e.target.value)}>
                  {["Word", "Figurative", "Combined", "3D", "Sound", "Colour"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}
          {form.ipType === "Copyright" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Work Type</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.copyrightWork} onChange={e => f("copyrightWork", e.target.value)}>
                  {["Literary", "Artistic", "Musical", "Software", "Database", "Film", "Broadcast"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Author / Creator</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.author} onChange={e => f("author", e.target.value)} />
              </div>
            </div>
          )}
          {form.ipType === "DesignRight" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Design Right Type</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.designType} onChange={e => f("designType", e.target.value)}>
                {["Registered", "Unregistered", "Community Registered", "Community Unregistered"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          )}
          {form.ipType === "TradeSecret" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Secret Category</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.secretCategory} onChange={e => f("secretCategory", e.target.value)}>
                  {["Formula", "Process", "Method", "Know-How", "Customer List", "Business Strategy", "Technical Data"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Protection Measures</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5e7eb" }} value={form.protectionMeasures} onChange={e => f("protectionMeasures", e.target.value)} placeholder="NDA, access controls, etc." />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-none" rows={2} style={{ borderColor: "#e5e7eb" }} value={form.notes} onChange={e => f("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#e5e7eb" }}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => upsert.mutate({ id: existing?.id, ...form })}
            disabled={!form.title || upsert.isPending}
            style={{ background: "#22c55e", color: "white" }}
          >
            {upsert.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            {existing ? "Save Changes" : "Add Asset"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const utils = trpc.useUtils();
  const { data: summary, isLoading } = trpc.ip.getPortfolioSummary.useQuery();
  const { data: renewalAlerts = [] } = trpc.ip.getRenewalAlerts.useQuery();
  const notifyMutation = trpc.ip.notifyRenewalAlerts.useMutation({
    onSuccess: (res) => {
      if (res.notified) toast.success(`Owner notified of ${res.count} renewal alert${res.count > 1 ? "s" : ""}`);
      else toast.info("No renewal alerts within 90 days");
    },
    onError: (e) => toast.error(e.message),
  });
  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (!summary) return null;
  const urgencyColor = { Critical: "#dc2626", High: "#f59e0b", Medium: "#0891b2" } as Record<string, string>;
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total IP Assets" value={summary.totalAssets} sub="across all types" color="#22c55e" icon={Shield} />
        <KpiCard label="Granted Patents" value={summary.grantedPatents} sub="granted or licensed" color="#1d4ed8" icon={FileText} />
        <KpiCard label="Annual License Revenue" value={`£${((summary.annualLicenseRevenue ?? 0) / 1000).toFixed(0)}k`} sub={`${summary.activeLicenses} active licences`} color="#7c3aed" icon={Zap} />
        <KpiCard label="Est. Portfolio Value" value={`£${((summary.totalEstimatedValue ?? 0) / 1000).toFixed(0)}k`} sub="combined IP value" color="#f59e0b" icon={Globe} />
        <div
          className="rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-all"
          style={{ borderColor: renewalAlerts.length > 0 ? "#fca5a5" : "#e5e7eb", background: renewalAlerts.length > 0 ? "#fef2f2" : "white" }}
          onClick={() => notifyMutation.mutate()}
          title="Click to notify owner"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: renewalAlerts.length > 0 ? "#dc2626" : "#9ca3af" }}>Renewals Due</span>
            {renewalAlerts.length > 0 ? <BellRing size={14} style={{ color: "#dc2626" }} /> : <Bell size={14} style={{ color: "#9ca3af" }} />}
          </div>
          <div className="text-3xl font-bold font-mono" style={{ color: renewalAlerts.length > 0 ? "#dc2626" : "#22c55e" }}>
            {notifyMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : renewalAlerts.length}
          </div>
          <div className="text-xs mt-0.5" style={{ color: renewalAlerts.length > 0 ? "#dc2626" : "#9ca3af" }}>
            {renewalAlerts.length > 0 ? "within 90 days · click to notify" : "no alerts"}
          </div>
        </div>
      </div>
      {/* Renewal Alerts Panel */}
      {renewalAlerts.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BellRing size={16} style={{ color: "#dc2626" }} />
              <span className="text-sm font-bold text-red-700">Renewal Alerts — {renewalAlerts.length} asset{renewalAlerts.length > 1 ? "s" : ""} due within 90 days</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5 border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => notifyMutation.mutate()}
              disabled={notifyMutation.isPending}
            >
              <Bell size={12} />
              {notifyMutation.isPending ? "Sending…" : "Notify Owner"}
            </Button>
          </div>
          <div className="space-y-2">
            {renewalAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${urgencyColor[alert.urgency]}15`, color: urgencyColor[alert.urgency] }}>{alert.urgency}</span>
                  <span className="text-sm font-semibold text-gray-800">{alert.title}</span>
                  <span className="text-xs text-gray-400">{alert.ipType} · {alert.reference || "no ref"}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold" style={{ color: urgencyColor[alert.urgency] }}>{alert.daysLeft} days left</div>
                  <div className="text-xs text-gray-400">Due {alert.dueDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IP Type Breakdown */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <h2 className="text-base font-bold text-gray-900 mb-4">IP Portfolio Breakdown</h2>
        <div className="grid grid-cols-5 gap-3">
          {summary.byType.map(({ type, count }) => {
            const cfg = IP_TYPE_CONFIG[type as IpType];
            const Icon = cfg.icon;
            return (
              <div key={type} className="rounded-xl p-4 text-center" style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}25` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: `${cfg.color}15` }}>
                  <Icon size={18} style={{ color: cfg.color }} />
                </div>
                <div className="text-2xl font-bold font-mono" style={{ color: cfg.color }}>{count}</div>
                <div className="text-xs font-semibold text-gray-600 mt-0.5">{cfg.label}</div>
                <div className="text-xs text-gray-400 mt-1 leading-tight">{cfg.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Registered Trademarks</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "#7c3aed" }}>{summary.registeredTM}</div>
          <div className="text-xs text-gray-400 mt-0.5">brand identifiers protected</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Active Trade Secrets</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "#dc2626" }}>{summary.activeSecrets}</div>
          <div className="text-xs text-gray-400 mt-0.5">confidential assets protected</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Global Regions</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "#0891b2" }}>{summary.regions.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">{summary.regions.slice(0, 3).join(", ") || "No regions yet"}</div>
        </div>
      </div>
    </div>
  );
}

// ── IP Registry Tab ───────────────────────────────────────────────────────────

function RegistryTab() {
  const utils = trpc.useUtils();
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  const { data: assets = [], isLoading } = trpc.ip.listAssets.useQuery({});
  const deleteAsset = trpc.ip.deleteAsset.useMutation({
    onSuccess: () => { utils.ip.listAssets.invalidate(); utils.ip.getPortfolioSummary.invalidate(); toast.success("Asset deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = typeFilter === "All" ? assets : assets.filter(a => a.ipType === typeFilter);

  const statusColors: Record<string, string> = {
    Draft: "#9ca3af", Filed: "#f59e0b", Pending: "#1d4ed8", Granted: "#22c55e",
    Licensed: "#7c3aed", Abandoned: "#ef4444", Unregistered: "#9ca3af",
    Application: "#f59e0b", Registered: "#22c55e", Opposed: "#ef4444",
    Expired: "#ef4444", Active: "#22c55e", Disputed: "#f59e0b",
    Compromised: "#ef4444", Retired: "#9ca3af",
  };

  const potentialColors: Record<string, string> = { High: "#22c55e", Medium: "#f59e0b", Low: "#9ca3af" };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {["All", ...IP_TYPES].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{
                background: typeFilter === t ? "#22c55e" : "#f3f4f6",
                color: typeFilter === t ? "white" : "#6b7280",
              }}
            >
              {t === "All" ? "All Types" : IP_TYPE_CONFIG[t as IpType].label}
              {t !== "All" && <span className="ml-1 opacity-70">({assets.filter(a => a.ipType === t).length})</span>}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          onClick={() => { setEditingAsset(null); setShowModal(true); }}
          style={{ background: "#22c55e", color: "white" }}
          className="gap-1.5"
        >
          <Plus size={13} /> Add Asset
        </Button>
      </div>

      {isLoading && <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>}

      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
          <Shield size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">No IP assets yet. Click "Add Asset" to register your first IP.</p>
        </div>
      )}

      {/* Asset List */}
      <div className="space-y-2">
        {filtered.map(asset => {
          const cfg = IP_TYPE_CONFIG[asset.ipType as IpType];
          const Icon = cfg?.icon ?? Shield;
          const color = cfg?.color ?? "#22c55e";
          const statusColor = statusColors[asset.status] ?? "#9ca3af";
          const isExpanded = expandedId === asset.id;

          return (
            <div
              key={asset.id}
              className="bg-white rounded-xl border shadow-sm overflow-hidden"
              style={{ borderLeft: `4px solid ${color}`, borderColor: "#e5e7eb", borderLeftColor: color }}
            >
              <div
                className="flex items-start justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : asset.id)}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {asset.reference && <span className="text-xs font-mono text-gray-400">{asset.reference}</span>}
                    <IpTypeBadge type={asset.ipType} />
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${statusColor}15`, color: statusColor }}>
                      {asset.status}
                    </span>
                    {asset.commercialPotential && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${potentialColors[asset.commercialPotential] ?? "#9ca3af"}15`, color: potentialColors[asset.commercialPotential] ?? "#9ca3af" }}>
                        {asset.commercialPotential} Potential
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">{asset.title}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {asset.ventureName && <span style={{ color }}>{asset.ventureName}</span>}
                    {asset.jurisdiction && <><span>·</span><span>{asset.jurisdiction}</span></>}
                    {asset.filedDate && <><span>·</span><span>Filed {asset.filedDate}</span></>}
                    {asset.ipType === "Patent" && asset.trl && <><span>·</span><span>TRL {asset.trl}</span></>}
                    {asset.estimatedValue && asset.estimatedValue > 0 && (
                      <><span>·</span><span className="font-mono">£{(asset.estimatedValue / 1000).toFixed(0)}k est.</span></>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); setEditingAsset(asset); setShowModal(true); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <FileCode2 size={13} className="text-gray-400" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); if (confirm("Delete this IP asset?")) deleteAsset.mutate({ id: asset.id }); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-4 pt-3 border-t space-y-3" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
                  {asset.description && <p className="text-sm text-gray-600 leading-relaxed">{asset.description}</p>}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {asset.ipType === "Trademark" && asset.trademarkClass && (
                      <div><span className="text-gray-400">Nice Class:</span> <span className="font-semibold text-gray-700">{asset.trademarkClass}</span></div>
                    )}
                    {asset.ipType === "Trademark" && asset.trademarkType && (
                      <div><span className="text-gray-400">Mark Type:</span> <span className="font-semibold text-gray-700">{asset.trademarkType}</span></div>
                    )}
                    {asset.ipType === "Copyright" && asset.copyrightWork && (
                      <div><span className="text-gray-400">Work Type:</span> <span className="font-semibold text-gray-700">{asset.copyrightWork}</span></div>
                    )}
                    {asset.ipType === "Copyright" && asset.author && (
                      <div><span className="text-gray-400">Author:</span> <span className="font-semibold text-gray-700">{asset.author}</span></div>
                    )}
                    {asset.ipType === "DesignRight" && asset.designType && (
                      <div><span className="text-gray-400">Design Type:</span> <span className="font-semibold text-gray-700">{asset.designType}</span></div>
                    )}
                    {asset.ipType === "TradeSecret" && asset.secretCategory && (
                      <div><span className="text-gray-400">Category:</span> <span className="font-semibold text-gray-700">{asset.secretCategory}</span></div>
                    )}
                    {asset.ipType === "TradeSecret" && asset.protectionMeasures && (
                      <div className="col-span-2"><span className="text-gray-400">Protection:</span> <span className="font-semibold text-gray-700">{asset.protectionMeasures}</span></div>
                    )}
                    {asset.grantedDate && (
                      <div><span className="text-gray-400">Granted:</span> <span className="font-semibold text-gray-700">{asset.grantedDate}</span></div>
                    )}
                    {asset.expiryDate && (
                      <div><span className="text-gray-400">Expires:</span> <span className="font-semibold text-gray-700">{asset.expiryDate}</span></div>
                    )}
                    {asset.renewalDueDate && (
                      <div><span className="text-gray-400">Renewal Due:</span> <span className="font-semibold text-gray-700">{asset.renewalDueDate}</span></div>
                    )}
                  </div>
                  {asset.notes && <p className="text-xs text-gray-500 italic">{asset.notes}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <AssetModal
          existing={editingAsset}
          onClose={() => { setShowModal(false); setEditingAsset(null); }}
        />
      )}
    </div>
  );
}

// ── Patent AI Workspace Tab ───────────────────────────────────────────────────

function WorkspaceTab() {
  const utils = trpc.useUtils();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newVentureId, setNewVentureId] = useState("ecoblend");
  const [newJurisdiction, setNewJurisdiction] = useState("UK/EPO");

  const { data: projects = [], isLoading: projectsLoading } = trpc.ip.listPatentProjects.useQuery({});
  const createProject = trpc.ip.createPatentProject.useMutation({
    onSuccess: (data) => {
      utils.ip.listPatentProjects.invalidate();
      setSelectedProjectId(data.id);
      setShowNewProject(false);
      setNewTitle("");
      toast.success("Patent project created");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteProject = trpc.ip.deletePatentProject.useMutation({
    onSuccess: () => { utils.ip.listPatentProjects.invalidate(); setSelectedProjectId(null); toast.success("Project deleted"); },
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex gap-6 h-full">
      {/* Project Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#e5e7eb" }}>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Projects</span>
            <button onClick={() => setShowNewProject(true)} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100" title="New project">
              <Plus size={13} className="text-gray-500" />
            </button>
          </div>
          {showNewProject && (
            <div className="p-3 border-b space-y-2" style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
              <input
                className="w-full border rounded-lg px-2 py-1.5 text-xs"
                style={{ borderColor: "#e5e7eb" }}
                placeholder="Project title..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
              <select className="w-full border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: "#e5e7eb" }} value={newJurisdiction} onChange={e => setNewJurisdiction(e.target.value)}>
                {["UK/EPO", "USPTO", "PCT", "UK only", "EU only"].map(j => <option key={j}>{j}</option>)}
              </select>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-xs h-7" style={{ background: "#22c55e", color: "white" }}
                  onClick={() => createProject.mutate({ ventureId: newVentureId, title: newTitle, jurisdiction: newJurisdiction })}
                  disabled={!newTitle || createProject.isPending}
                >
                  {createProject.isPending ? <Loader2 size={11} className="animate-spin" /> : "Create"}
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowNewProject(false)}>Cancel</Button>
              </div>
            </div>
          )}
          {projectsLoading && <div className="p-4 text-center"><Loader2 size={16} className="animate-spin text-gray-400 mx-auto" /></div>}
          {!projectsLoading && projects.length === 0 && (
            <div className="p-4 text-center text-xs text-gray-400">No projects yet. Create one to start drafting.</div>
          )}
          <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
            {projects.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors group"
                style={{ background: selectedProjectId === p.id ? "#f0fdf4" : undefined }}
                onClick={() => setSelectedProjectId(p.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{p.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{
                      background: p.phase === "Ingestion" ? "#f3f4f6" : p.phase === "Strategy" ? "#fef3c7" : p.phase === "Drafting" ? "#dbeafe" : "#dcfce7",
                      color: p.phase === "Ingestion" ? "#6b7280" : p.phase === "Strategy" ? "#d97706" : p.phase === "Drafting" ? "#1d4ed8" : "#16a34a",
                    }}>{p.phase}</span>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); if (confirm("Delete this project?")) deleteProject.mutate({ id: p.id }); }}
                  className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={11} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0">
        {!selectedProject ? (
          <div className="bg-white rounded-xl border p-12 text-center shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <Wand2 size={40} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-base font-bold text-gray-700 mb-2">Patent AI Workspace</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mb-4">
              Select a project from the sidebar, or create a new one to begin the AI-assisted patent drafting workflow.
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-400 mt-6">
              {["1. Ingest Notes", "2. AI Hypotheses", "3. Draft Sections"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <span className="text-gray-200">→</span>}
                  <span className="px-2 py-1 rounded-lg bg-gray-50 font-semibold">{s}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <PatentProjectWorkspace project={selectedProject} />
        )}
      </div>
    </div>
  );
}

function PatentProjectWorkspace({ project }: { project: any }) {
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState(project.coreInventionNotes ?? "");
  const [priorArt, setPriorArt] = useState(project.priorArtNotes ?? "");
  const [activeSection, setActiveSection] = useState<PatentSection>("Abstract");
  const [draftingSection, setDraftingSection] = useState<PatentSection | null>(null);

  const { data: hypotheses = [], isLoading: hypoLoading } = trpc.ip.listHypotheses.useQuery({ projectId: project.id });

  const hypothesize = trpc.ip.hypothesize.useMutation({
    onSuccess: (data) => {
      utils.ip.listHypotheses.invalidate({ projectId: project.id });
      utils.ip.listPatentProjects.invalidate();
      toast.success(`${data.count} hypotheses generated`);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleHypo = trpc.ip.toggleHypothesis.useMutation({
    onSuccess: () => utils.ip.listHypotheses.invalidate({ projectId: project.id }),
  });

  const draftSection = trpc.ip.draftSection.useMutation({
    onSuccess: (data) => {
      utils.ip.listPatentProjects.invalidate();
      setDraftingSection(null);
      toast.success(`${SECTION_LABELS[data.section as PatentSection]} drafted`);
    },
    onError: (e) => { setDraftingSection(null); toast.error(e.message); },
  });

  const approvedHypotheses = hypotheses.filter(h => h.included).map(h => ({
    title: h.title,
    description: h.description ?? "",
    rationale: h.rationale ?? "",
    claimImpact: h.claimImpact ?? "",
  }));

  const sectionDraftMap: Record<PatentSection, string | null | undefined> = {
    Abstract: project.draftAbstract,
    Background: project.draftBackground,
    Summary: project.draftSummary,
    DetailedDescription: project.draftDetailedDesc,
    Claims: project.draftClaims,
  };

  const phase = project.phase as string;
  const sectionsComplete = Object.values(sectionDraftMap).filter(Boolean).length;
  const handleExportPdf = async () => {
    try {
      const res = await fetch(`/api/trpc/ip.exportPatentDraft?input=${encodeURIComponent(JSON.stringify({ projectId: project.id }))}`, {
        credentials: "include",
      });
      const json = await res.json();
      const md = json.result?.data?.json?.markdown || json.result?.data?.markdown || "";
      if (!md) { toast.error("No draft content to export"); return; }
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, "_")}_patent_draft.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Patent draft downloaded as Markdown");
    } catch (e) {
      toast.error("Export failed");
    }
  };
  return (
    <div className="space-y-4">
      {/* Phase indicator */}
      <div className="flex items-center gap-2">
        {["Ingestion", "Strategy", "Drafting", "Complete"].map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-0.5 bg-gray-200" />}
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: phase === p ? "#22c55e" : ["Ingestion", "Strategy", "Drafting", "Complete"].indexOf(phase) > i ? "#dcfce7" : "#f3f4f6",
                  color: phase === p ? "white" : ["Ingestion", "Strategy", "Drafting", "Complete"].indexOf(phase) > i ? "#16a34a" : "#9ca3af",
                }}
              >
                {["Ingestion", "Strategy", "Drafting", "Complete"].indexOf(phase) > i ? "✓" : i + 1}
              </div>
              <span className="text-xs font-semibold" style={{ color: phase === p ? "#22c55e" : "#9ca3af" }}>{p}</span>
            </div>
          </div>
        ))}
        <div className="ml-auto text-xs text-gray-400 font-mono">{project.jurisdiction}</div>
      </div>

      {/* Phase 1: Ingestion */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#1d4ed8", color: "white" }}>1</div>
            <span className="text-sm font-bold text-gray-800">Ingest Invention Notes</span>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Core Invention Notes <span className="text-red-400">*</span></label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none font-mono"
              rows={5}
              style={{ borderColor: "#e5e7eb" }}
              placeholder="Describe your invention in technical detail. Include the problem it solves, the technical solution, key components, and how it works. The more detail you provide, the better the AI hypotheses will be..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Prior Art References (optional)</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none font-mono"
              rows={3}
              style={{ borderColor: "#e5e7eb" }}
              placeholder="List any known prior art, competitor patents, or existing solutions that your invention improves upon..."
              value={priorArt}
              onChange={e => setPriorArt(e.target.value)}
            />
          </div>
          <Button
            onClick={() => hypothesize.mutate({ projectId: project.id, coreInventionNotes: notes, priorArtNotes: priorArt })}
            disabled={!notes.trim() || hypothesize.isPending}
            style={{ background: "#1d4ed8", color: "white" }}
            className="gap-2"
          >
            {hypothesize.isPending ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {hypothesize.isPending ? "Generating Hypotheses..." : "Analyse & Generate Hypotheses"}
          </Button>
        </div>
      </div>

      {/* Phase 2: Hypothesis Board */}
      {(phase === "Strategy" || phase === "Drafting" || phase === "Complete" || hypotheses.length > 0) && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#7c3aed", color: "white" }}>2</div>
              <span className="text-sm font-bold text-gray-800">Hypothesis Board</span>
              <span className="text-xs text-gray-400">— Select hypotheses to include in the patent draft</span>
            </div>
            <span className="text-xs font-semibold text-gray-500">{approvedHypotheses.length} selected</span>
          </div>
          {hypoLoading && <div className="p-6 text-center"><Loader2 size={16} className="animate-spin text-gray-400 mx-auto" /></div>}
          {!hypoLoading && hypotheses.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">Run "Analyse & Generate Hypotheses" above to populate this board.</div>
          )}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {hypotheses.map(h => (
              <div
                key={h.id}
                className="rounded-xl border p-4 cursor-pointer transition-all"
                style={{
                  borderColor: h.included ? "#7c3aed" : "#e5e7eb",
                  background: h.included ? "#faf5ff" : "white",
                }}
                onClick={() => toggleHypo.mutate({ id: h.id, included: !h.included })}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800 leading-tight flex-1 pr-2">{h.title}</span>
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: h.included ? "#7c3aed" : "#f3f4f6" }}
                  >
                    {h.included ? <CheckCircle2 size={12} style={{ color: "white" }} /> : <Circle size={12} className="text-gray-300" />}
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-2">{h.description}</p>
                {h.rationale && (
                  <div className="text-xs text-gray-500 mb-1">
                    <span className="font-semibold text-gray-600">Rationale: </span>{h.rationale}
                  </div>
                )}
                {h.claimImpact && (
                  <div className="text-xs" style={{ color: "#7c3aed" }}>
                    <span className="font-semibold">Claim Impact: </span>{h.claimImpact}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase 3: Patent Editor */}
      {(phase === "Drafting" || phase === "Complete" || Object.values(sectionDraftMap).some(Boolean)) && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#22c55e", color: "white" }}>3</div>
              <span className="text-sm font-bold text-gray-800">Patent Editor</span>
              {sectionsComplete > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#22c55e15", color: "#22c55e" }}>{sectionsComplete}/5 sections</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {sectionsComplete > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={handleExportPdf}
                >
                  <FileCode2 size={11} /> Export Draft
                </Button>
              )}
            <div className="flex gap-1">
              {PATENT_SECTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all"
                  style={{
                    background: activeSection === s ? "#22c55e" : "#f3f4f6",
                    color: activeSection === s ? "white" : "#6b7280",
                  }}
                >
                  {sectionDraftMap[s] ? "✓ " : ""}{s === "DetailedDescription" ? "Detailed" : s}
                </button>
              ))}
            </div>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: "#e5e7eb" }}>
            {/* Left: Draft content */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-800">{SECTION_LABELS[activeSection]}</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    setDraftingSection(activeSection);
                    draftSection.mutate({
                      projectId: project.id,
                      section: activeSection,
                      coreInventionNotes: notes || project.coreInventionNotes || "",
                      approvedHypotheses,
                      jurisdiction: project.jurisdiction ?? "UK/EPO",
                    });
                  }}
                  disabled={draftSection.isPending || !notes.trim() && !project.coreInventionNotes}
                  className="gap-1.5 text-xs h-7"
                  style={{ background: "#22c55e", color: "white" }}
                >
                  {draftingSection === activeSection && draftSection.isPending ? (
                    <><Loader2 size={11} className="animate-spin" /> Drafting...</>
                  ) : (
                    <><RotateCcw size={11} /> {sectionDraftMap[activeSection] ? "Regenerate" : "Draft Section"}</>
                  )}
                </Button>
              </div>
              {sectionDraftMap[activeSection] ? (
                <div className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed overflow-y-auto max-h-96">
                  <Streamdown>{sectionDraftMap[activeSection]!}</Streamdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText size={28} className="text-gray-300 mb-3" />
                  <p className="text-xs text-gray-400">Click "Draft Section" to generate this section using the AI Patent Attorney.</p>
                </div>
              )}
            </div>
            {/* Right: Reference panel */}
            <div className="p-5 bg-gray-50">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Reference Panel</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Core Invention Notes</div>
                  <div className="text-xs text-gray-500 leading-relaxed bg-white rounded-lg p-3 border max-h-32 overflow-y-auto" style={{ borderColor: "#e5e7eb" }}>
                    {notes || project.coreInventionNotes || <span className="text-gray-300 italic">No notes yet</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Approved Hypotheses ({approvedHypotheses.length})</div>
                  {approvedHypotheses.length === 0 ? (
                    <div className="text-xs text-gray-300 italic">None selected</div>
                  ) : (
                    <div className="space-y-2">
                      {approvedHypotheses.map((h, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-xs" style={{ borderColor: "#e5e7eb" }}>
                          <div className="font-semibold text-gray-700">{h.title}</div>
                          <div className="text-gray-500 mt-0.5">{h.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
        <AlertTriangle size={16} style={{ color: "#d97706" }} className="flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Important Disclaimer:</strong> This AI tool is an advanced drafting assistant designed to reduce attorney billable hours. It is not a replacement for a qualified patent attorney review before filing. AI-generated claims may contain subtle legal flaws under UK/EP law. Always have a registered patent attorney review the final draft before submission.
        </p>
      </div>

      {/* Draft all sections button */}
      {phase === "Strategy" && approvedHypotheses.length > 0 && (
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-gray-800">Ready to Draft</div>
              <div className="text-xs text-gray-400 mt-0.5">{approvedHypotheses.length} hypotheses approved — switch to the Patent Editor above to draft each section.</div>
            </div>
            <Button
              onClick={() => setActiveSection("Abstract")}
              style={{ background: "#22c55e", color: "white" }}
              className="gap-2"
            >
              <Eye size={14} /> Open Editor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Licensing Tab ─────────────────────────────────────────────────────────────

function LicensingTab() {
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState("All");
  const { data: licenses = [], isLoading } = trpc.ip.listLicenses.useQuery({});
  const { data: assets = [] } = trpc.ip.listAssets.useQuery({});
  const deleteLicense = trpc.ip.deleteLicense.useMutation({
    onSuccess: () => { utils.ip.listLicenses.invalidate(); utils.ip.getPortfolioSummary.invalidate(); toast.success("License deleted"); },
  });

  const filtered = statusFilter === "All" ? licenses : licenses.filter(l => l.status === statusFilter);
  const statusColors: Record<string, string> = { Active: "#22c55e", Negotiating: "#f59e0b", Expired: "#ef4444", Terminated: "#9ca3af" };

  const totalRevenue = licenses.filter(l => l.status === "Active").reduce((s, l) => s + (l.annualValue ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Total Licenses</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "#1d4ed8" }}>{licenses.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Active Licenses</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "#22c55e" }}>{licenses.filter(l => l.status === "Active").length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Annual Revenue</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "#7c3aed" }}>£{(totalRevenue / 1000).toFixed(0)}k</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {["All", "Active", "Negotiating", "Expired", "Terminated"].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{ background: statusFilter === f ? "#22c55e" : "#f3f4f6", color: statusFilter === f ? "white" : "#6b7280" }}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>}

      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
          <FileText size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">No licenses found. Add IP assets first, then create licenses against them.</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Licensee", "Country / Region", "IP Asset", "Type", "Annual Value", "Term", "Values-Aligned", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const asset = assets.find(a => a.id === l.ipAssetId);
                const statusColor = statusColors[l.status] ?? "#9ca3af";
                return (
                  <tr key={l.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{l.licensee}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{l.country} {l.region && <span className="text-gray-300">· {l.region}</span>}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{asset?.title ?? `Asset #${l.ipAssetId}`}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">{l.licenseType}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold font-mono text-gray-800">£{((l.annualValue ?? 0) / 1000).toFixed(0)}k</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{l.startDate} → {l.endDate}</td>
                    <td className="px-4 py-3 text-center">
                      {l.valuesAligned
                        ? <CheckCircle2 size={15} style={{ color: "#22c55e" }} className="mx-auto" />
                        : <Circle size={15} style={{ color: "#d1d5db" }} className="mx-auto" />}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${statusColor}15`, color: statusColor }}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { if (confirm("Delete this license?")) deleteLicense.mutate({ id: l.id }); }} className="text-red-400 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Governance Tab ────────────────────────────────────────────────────────────

function GovernanceTab() {
  return (
    <div className="space-y-6">
      {/* Governance Principles */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-sm font-bold text-gray-900 mb-4">IP Governance Principles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Centralised Ownership", desc: "All core IP is owned by EcoRace Ltd. Spin-offs receive exclusive, field-of-use licences, protecting the portfolio from single-venture failure.", color: "#22c55e" },
            { title: "Values-Aligned Licensing", desc: "External licences are only granted to partners who demonstrate alignment with EcoBlend VBS values — sustainability, social impact, and ethical governance.", color: "#1d4ed8" },
            { title: "Global Expansion", desc: "IP licensing to international partners creates a revenue stream that funds further R&D and extends the VBS's social and environmental impact globally.", color: "#7c3aed" },
          ].map(item => (
            <div key={item.title} className="rounded-lg p-4" style={{ background: `${item.color}08`, border: `1px solid ${item.color}25` }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: item.color }}>{item.title}</div>
              <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* IP Type Legal Framework */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-sm font-bold text-gray-900 mb-4">UK/EU Legal Framework by IP Type</h3>
        <div className="space-y-3">
          {[
            {
              type: "Patent" as IpType,
              duration: "20 years from filing",
              legislation: "Patents Act 1977 (UK) · EPO Convention",
              renewal: "Annual renewal fees from year 5",
              notes: "Must be novel, inventive, and industrially applicable. File before public disclosure.",
            },
            {
              type: "Trademark" as IpType,
              duration: "10 years, renewable indefinitely",
              legislation: "Trade Marks Act 1994 (UK) · EU Trade Mark Regulation 2017/1001",
              renewal: "Every 10 years",
              notes: "Must be distinctive. Use it or lose it — non-use for 5+ years risks revocation.",
            },
            {
              type: "Copyright" as IpType,
              duration: "Life of author + 70 years (literary/artistic); 50–70 years (others)",
              legislation: "Copyright, Designs and Patents Act 1988 (CDPA)",
              renewal: "Automatic — no registration required in UK",
              notes: "Arises automatically on creation. Moral rights cannot be assigned.",
            },
            {
              type: "DesignRight" as IpType,
              duration: "Registered: 25 years | Unregistered: 15 years (UK) / 3 years (EU)",
              legislation: "Registered Designs Act 1949 (UK) · EU Design Regulation 6/2002",
              renewal: "Registered: every 5 years up to 25 years",
              notes: "Protects the appearance of a product. Must be new and have individual character.",
            },
            {
              type: "TradeSecret" as IpType,
              duration: "Indefinite (as long as secrecy is maintained)",
              legislation: "Trade Secrets (Enforcement, etc.) Regulations 2018 (UK) · EU Directive 2016/943",
              renewal: "No registration — maintain through NDAs, access controls, and security measures",
              notes: "No disclosure protection. Once public, protection is lost. Requires active protection measures.",
            },
          ].map(item => {
            const cfg = IP_TYPE_CONFIG[item.type];
            const Icon = cfg.icon;
            return (
              <div key={item.type} className="flex gap-4 p-4 rounded-xl" style={{ background: `${cfg.color}05`, border: `1px solid ${cfg.color}20` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}15` }}>
                  <Icon size={16} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span className="text-xs text-gray-400 font-mono">{item.duration}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1"><span className="font-semibold text-gray-600">Legislation: </span>{item.legislation}</div>
                  <div className="text-xs text-gray-500 mb-1"><span className="font-semibold text-gray-600">Renewal: </span>{item.renewal}</div>
                  <div className="text-xs text-gray-500"><span className="font-semibold text-gray-600">Key Note: </span>{item.notes}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
        <AlertTriangle size={16} style={{ color: "#d97706" }} className="flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <strong>Legal Disclaimer:</strong> The information in this module is provided for informational purposes only and does not constitute legal advice. EcoBlend's IP portfolio should be managed in consultation with a qualified UK/EU patent attorney or IP solicitor. Filing deadlines, renewal fees, and jurisdictional requirements vary — always verify with a registered IP professional before taking any legal action.
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function IpManagement() {
  const [activeTab, setActiveTab] = useState<IpTab>("overview");

  const tabs: { id: IpTab; label: string; icon: React.ElementType }[] = [
    { id: "overview",   label: "Overview",         icon: Globe },
    { id: "registry",   label: "IP Registry",      icon: Shield },
    { id: "workspace",  label: "Patent AI Workspace", icon: Wand2 },
    { id: "licensing",  label: "Licensing",         icon: FileText },
    { id: "governance", label: "Governance",        icon: BookOpen },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#22c55e15", color: "#22c55e" }}>
            IP Intelligence
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">EcoRace Lab</span>
        </div>
        <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          IP Management
        </h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
        <p className="text-sm text-gray-500 max-w-2xl">
          Unified IP intelligence covering Patents, Trademarks, Copyrights, Design Rights, and Trade Secrets — with an AI-powered Patent Workspace for hypothesis generation and section-by-section drafting.
        </p>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 -mb-px"
                style={{
                  borderColor: activeTab === tab.id ? "#22c55e" : "transparent",
                  color: activeTab === tab.id ? "#22c55e" : "#6b7280",
                }}
              >
                <Icon size={14} />
                {tab.label}
                {tab.id === "workspace" && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#1d4ed815", color: "#1d4ed8" }}>AI</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === "overview"   && <OverviewTab />}
        {activeTab === "registry"   && <RegistryTab />}
        {activeTab === "workspace"  && <WorkspaceTab />}
        {activeTab === "licensing"  && <LicensingTab />}
        {activeTab === "governance" && <GovernanceTab />}
      </div>
    </div>
  );
}
