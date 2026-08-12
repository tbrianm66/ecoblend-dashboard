// ============================================================
// DATA MANAGEMENT MODULE
// Sections 8 & 9 of the Master Venture OS Specification
// Tabs: Overview | Data Assets | Quality Scoring | AI Pipelines | RAG Pipelines | Fine-Tuning | Feedback Loops
// Design: Precision Industrial — consistent with EcoBlend platform palette
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import QueryErrorBanner from "@/components/QueryErrorBanner";
import {
  Database, BarChart2, Cpu, Search, Layers, MessageSquare,
  Plus, Pencil, Trash2, RefreshCw, Zap, CheckCircle, XCircle,
  AlertCircle, Clock, TrendingUp, FileText, Activity, Star,
  ThumbsUp, ThumbsDown, ChevronRight, Eye
} from "lucide-react";

// ── Colour helpers ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280", ingested: "#3B85BA", validated: "#56A837",
  published: "#22c55e", archived: "#9ca3af", error: "#ef4444",
  active: "#56A837", paused: "#F69111", deprecated: "#6b7280",
  ready: "#56A837", indexing: "#3B85BA", stale: "#F69111",
  running: "#3B85BA", success: "#56A837", failed: "#ef4444",
  cancelled: "#6b7280", timeout: "#F69111",
  open: "#F69111", reviewed: "#3B85BA", actioned: "#56A837", dismissed: "#6b7280",
  training: "#3B85BA", evaluating: "#F69111", completed: "#56A837",
  preparing: "#6b7280", labelling: "#F69111",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#6b7280";
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function KpiCard({ label, value, sub, accent, icon: Icon }: { label: string; value: string | number; sub?: string; accent?: string; icon?: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-1 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={14} style={{ color: accent ?? "#6b7280" }} />}
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <span className="text-3xl font-bold" style={{ color: accent ?? "#1a2332", fontFamily: "'Prompt', sans-serif" }}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

// ── Quality Gauge ──────────────────────────────────────────────────────────────
function QualityGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#56A837" : score >= 60 ? "#F69111" : "#ef4444";
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 0.7s" }} />
        <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="bold" fill={color}>{score.toFixed(0)}</text>
      </svg>
      <span className="text-xs text-gray-500">Overall Quality Score</span>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: overview, error: overviewError } = trpc.dmSummary.overview.useQuery({});
  if (overviewError) return <QueryErrorBanner errors={[overviewError]} message="Unable to load data management overview. Please refresh." />;

  const assetTypeData = Object.entries(overview?.assetsByType ?? {});
  const assetStatusData = Object.entries(overview?.assetsByStatus ?? {});

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Data Assets" value={overview?.totalAssets ?? 0} sub="registered" accent="#3B85BA" icon={Database} />
        <KpiCard label="Avg Quality Score" value={`${overview?.avgDataQuality ?? 0}%`} sub="across all assets" accent={overview?.avgDataQuality ?? 0 >= 80 ? "#56A837" : "#F69111"} icon={BarChart2} />
        <KpiCard label="Active AI Pipelines" value={overview?.activePipelines ?? 0} sub={`of ${overview?.totalPipelines ?? 0} total`} accent="#56A837" icon={Cpu} />
        <KpiCard label="RAG Pipelines Ready" value={overview?.readyRagPipelines ?? 0} sub={`of ${overview?.totalRagPipelines ?? 0} total`} accent="#22c55e" icon={Search} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Pipeline Runs" value={overview?.totalRuns ?? 0} sub="all time" accent="#3B85BA" icon={Activity} />
        <KpiCard label="RAG Documents" value={overview?.totalDocuments ?? 0} sub="indexed" accent="#6b7280" icon={FileText} />
        <KpiCard label="Fine-Tuning Jobs" value={overview?.completedFineTuningJobs ?? 0} sub="completed" accent="#56A837" icon={Layers} />
        <KpiCard label="Feedback Satisfaction" value={`${overview?.feedbackSatisfaction ?? 0}%`} sub={`${overview?.openFeedback ?? 0} open items`} accent="#F69111" icon={MessageSquare} />
      </div>

      {/* Asset breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-700 mb-4">Assets by Type</h3>
          <div className="space-y-2">
            {assetTypeData.length === 0 && <p className="text-xs text-gray-400">No assets registered yet.</p>}
            {assetTypeData.map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28 capitalize">{type.replace(/_/g, " ")}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-400 transition-all duration-700"
                    style={{ width: `${Math.round((count / (overview?.totalAssets || 1)) * 100)}%` }} />
                </div>
                <span className="text-xs font-mono text-gray-400 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-700 mb-4">Assets by Status</h3>
          <div className="space-y-2">
            {assetStatusData.length === 0 && <p className="text-xs text-gray-400">No assets registered yet.</p>}
            {assetStatusData.map(([status, count]) => {
              const color = STATUS_COLORS[status] ?? "#6b7280";
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 capitalize">{status}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.round((count / (overview?.totalAssets || 1)) * 100)}%`, background: color }} />
                  </div>
                  <span className="text-xs font-mono text-gray-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quality gauge */}
      <div className="bg-white rounded-xl border p-5 shadow-sm flex items-center gap-8" style={{ borderColor: "#e5e7eb" }}>
        <QualityGauge score={overview?.avgDataQuality ?? 0} />
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-1">Platform Data Quality</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            The overall quality score is the average of all assessed data assets across completeness, accuracy, freshness, consistency, uniqueness, and validity dimensions.
          </p>
          <div className="flex gap-4 mt-3">
            {[["≥ 80", "#56A837", "Good"], ["60–79", "#F69111", "Fair"], ["< 60", "#ef4444", "Poor"]].map(([range, color, label]) => (
              <div key={range} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                <span className="text-xs text-gray-500">{range} — {label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data Assets Tab ────────────────────────────────────────────────────────────
function DataAssetsTab() {
  const utils = trpc.useUtils();
  const { data: assets = [], error: assetsError } = trpc.dmAssets.list.useQuery({});
  if (assetsError) return <QueryErrorBanner errors={[assetsError]} message="Unable to load data assets. Please refresh." />;
  const upsert = trpc.dmAssets.upsert.useMutation({ onSuccess: () => { utils.dmAssets.list.invalidate(); utils.dmSummary.overview.invalidate(); toast.success("Asset saved"); setOpen(false); } });
  const del = trpc.dmAssets.delete.useMutation({ onSuccess: () => { utils.dmAssets.list.invalidate(); utils.dmSummary.overview.invalidate(); toast.success("Asset deleted"); } });
  const aiAssess = trpc.dmAssets.aiAssess.useMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => assets.filter(a =>
    (filterType === "all" || a.assetType === filterType) &&
    (filterStatus === "all" || a.status === filterStatus) &&
    (!search || a.name.toLowerCase().includes(search.toLowerCase()))
  ), [assets, filterType, filterStatus, search]);

  function openNew() { setEditing(null); setForm({ assetType: "structured", sourceType: "manual_upload", format: "csv", status: "draft" }); setOpen(true); }
  function openEdit(a: any) { setEditing(a); setForm({ ...a }); setOpen(true); }

  async function handleAiAssess() {
    if (!form.name) return toast.error("Enter a name first");
    toast.info("Running AI quality assessment…");
    try {
      const result = await aiAssess.mutateAsync({ name: form.name, description: form.description, assetType: form.assetType, format: form.format, rowCount: form.rowCount, columnCount: form.columnCount, sampleData: form.sampleData });
      setForm((f: any) => ({ ...f, overallQuality: result.overallScore }));
      toast.success(`AI quality score: ${result.overallScore.toFixed(1)}%`);
    } catch { toast.error("AI assessment failed"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Input placeholder="Search assets…" value={search} onChange={e => setSearch(e.target.value)} className="w-48 h-8 text-xs" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {["structured", "unstructured", "semi_structured", "time_series", "media"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {["draft", "ingested", "validated", "published", "archived", "error"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#3B85BA", color: "#fff" }} onClick={openNew}><Plus size={13} /> Register Asset</Button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-gray-50" style={{ borderColor: "#e5e7eb" }}>
              {["Name", "Type", "Source", "Format", "Rows", "Quality", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No data assets registered yet. Click "Register Asset" to add one.</td></tr>
            )}
            {filtered.map(a => (
              <tr key={a.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#f3f4f6" }}>
                <td className="px-4 py-3 font-medium text-gray-800">{a.name}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{a.assetType?.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{a.sourceType?.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-gray-500 uppercase">{a.format}</td>
                <td className="px-4 py-3 text-gray-500">{a.rowCount?.toLocaleString() ?? "—"}</td>
                <td className="px-4 py-3">
                  {a.overallQuality != null ? (
                    <span className="font-mono font-semibold" style={{ color: a.overallQuality >= 80 ? "#56A837" : a.overallQuality >= 60 ? "#F69111" : "#ef4444" }}>
                      {a.overallQuality.toFixed(1)}%
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100"><Pencil size={12} className="text-gray-400" /></button>
                    <button onClick={() => del.mutate({ id: a.id })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Data Asset" : "Register Data Asset"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Name *</label><Input value={form.name ?? ""} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="mt-1 text-xs" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Description</label><Textarea value={form.description ?? ""} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Asset Type</label>
              <Select value={form.assetType ?? "structured"} onValueChange={v => setForm((f: any) => ({ ...f, assetType: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["structured", "unstructured", "semi_structured", "time_series", "media"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Source Type</label>
              <Select value={form.sourceType ?? "manual_upload"} onValueChange={v => setForm((f: any) => ({ ...f, sourceType: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["manual_upload", "api_feed", "database_export", "web_scrape", "sensor", "survey", "interview"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Format</label>
              <Select value={form.format ?? "csv"} onValueChange={v => setForm((f: any) => ({ ...f, format: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["csv", "json", "xlsx", "pdf", "docx", "mp3", "mp4", "image", "parquet", "other"].map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Status</label>
              <Select value={form.status ?? "draft"} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["draft", "ingested", "validated", "published", "archived", "error"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-semibold text-gray-600">Row Count</label><Input type="number" value={form.rowCount ?? ""} onChange={e => setForm((f: any) => ({ ...f, rowCount: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Column Count</label><Input type="number" value={form.columnCount ?? ""} onChange={e => setForm((f: any) => ({ ...f, columnCount: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Size (KB)</label><Input type="number" value={form.sizeKb ?? ""} onChange={e => setForm((f: any) => ({ ...f, sizeKb: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Storage URL</label><Input value={form.storageUrl ?? ""} onChange={e => setForm((f: any) => ({ ...f, storageUrl: e.target.value }))} className="mt-1 text-xs" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Tags (comma separated)</label><Input value={form.tags ?? ""} onChange={e => setForm((f: any) => ({ ...f, tags: e.target.value }))} className="mt-1 text-xs" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Notes</label><Textarea value={form.notes ?? ""} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={handleAiAssess} disabled={aiAssess.isPending} className="gap-1.5 text-xs"><Zap size={12} />{aiAssess.isPending ? "Assessing…" : "AI Quality Check"}</Button>
            <Button size="sm" onClick={() => upsert.mutate({ ...form, id: editing?.id })} disabled={upsert.isPending} className="text-xs">Save Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Quality Scoring Tab ────────────────────────────────────────────────────────
function QualityScoringTab() {
  const utils = trpc.useUtils();
  const { data: assets = [] } = trpc.dmAssets.list.useQuery({});
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const { data: scores = [] } = trpc.dmQuality.listForAsset.useQuery(
    { assetId: selectedAssetId! },
    { enabled: selectedAssetId != null }
  );
  const upsert = trpc.dmQuality.upsert.useMutation({ onSuccess: () => { utils.dmQuality.listForAsset.invalidate(); utils.dmAssets.list.invalidate(); toast.success("Quality score saved"); setOpen(false); } });
  const del = trpc.dmQuality.delete.useMutation({ onSuccess: () => { utils.dmQuality.listForAsset.invalidate(); toast.success("Score deleted"); } });
  const aiAssess = trpc.dmAssets.aiAssess.useMutation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  async function handleAiAssess() {
    if (!selectedAsset) return;
    toast.info("Running AI quality assessment…");
    try {
      const result = await aiAssess.mutateAsync({
        name: selectedAsset.name,
        description: selectedAsset.description ?? undefined,
        assetType: selectedAsset.assetType,
        format: selectedAsset.format,
        rowCount: selectedAsset.rowCount ?? undefined,
        columnCount: selectedAsset.columnCount ?? undefined,
      });
      setForm({
        assetId: selectedAsset.id,
        completeness: result.completeness,
        accuracy: result.accuracy,
        freshness: result.freshness,
        consistency: result.consistency,
        uniqueness: result.uniqueness,
        validity: result.validity,
        issues: JSON.stringify(result.issues),
        recommendations: JSON.stringify(result.recommendations),
        assessedBy: "ai",
      });
      setOpen(true);
      toast.success(`AI assessment complete — score: ${result.overallScore.toFixed(1)}%`);
    } catch { toast.error("AI assessment failed"); }
  }

  const dims = ["completeness", "accuracy", "freshness", "consistency", "uniqueness", "validity"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedAssetId?.toString() ?? ""} onValueChange={v => setSelectedAssetId(Number(v))}>
          <SelectTrigger className="w-64 h-8 text-xs"><SelectValue placeholder="Select a data asset…" /></SelectTrigger>
          <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
        {selectedAsset && (
          <>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleAiAssess} disabled={aiAssess.isPending}><Zap size={12} />{aiAssess.isPending ? "Assessing…" : "AI Assess"}</Button>
            <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#3B85BA", color: "#fff" }} onClick={() => { setForm({ assetId: selectedAsset.id, assessedBy: "manual" }); setOpen(true); }}><Plus size={13} /> Manual Score</Button>
          </>
        )}
      </div>

      {!selectedAsset && (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          Select a data asset above to view and manage its quality scores.
        </div>
      )}

      {selectedAsset && (
        <>
          {/* Latest score summary */}
          {scores.length > 0 && (
            <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-4 mb-4">
                <QualityGauge score={scores[0].overallScore ?? 0} />
                <div>
                  <h3 className="text-sm font-bold text-gray-700">{selectedAsset.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Latest assessment · {new Date(scores[0].createdAt).toLocaleDateString()}</p>
                  <StatusBadge status={scores[0].assessedBy} />
                </div>
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                {dims.map(dim => {
                  const val = (scores[0] as any)[dim] ?? 0;
                  const color = val >= 80 ? "#56A837" : val >= 60 ? "#F69111" : "#ef4444";
                  return (
                    <div key={dim} className="text-center">
                      <div className="text-lg font-bold" style={{ color }}>{val.toFixed(0)}%</div>
                      <div className="text-xs text-gray-400 capitalize">{dim}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* History table */}
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50" style={{ borderColor: "#e5e7eb" }}>
                  {["Date", "Overall", "Completeness", "Accuracy", "Freshness", "Consistency", "Uniqueness", "Validity", "By", "Actions"].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scores.length === 0 && <tr><td colSpan={10} className="px-4 py-6 text-center text-gray-400">No quality scores yet.</td></tr>}
                {scores.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                    <td className="px-3 py-2 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 font-bold" style={{ color: (s.overallScore ?? 0) >= 80 ? "#56A837" : (s.overallScore ?? 0) >= 60 ? "#F69111" : "#ef4444" }}>{s.overallScore?.toFixed(1) ?? "—"}%</td>
                    {dims.map(d => <td key={d} className="px-3 py-2 text-gray-500">{((s as any)[d] ?? "—").toString()}{(s as any)[d] != null ? "%" : ""}</td>)}
                    <td className="px-3 py-2"><StatusBadge status={s.assessedBy} /></td>
                    <td className="px-3 py-2"><button onClick={() => del.mutate({ id: s.id })} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50"><Trash2 size={11} className="text-red-400" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Quality Score Assessment</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {dims.map(dim => (
              <div key={dim}>
                <label className="text-xs font-semibold text-gray-600 capitalize">{dim} (0-100)</label>
                <Input type="number" min={0} max={100} value={(form as any)[dim] ?? ""} onChange={e => setForm((f: any) => ({ ...f, [dim]: Number(e.target.value) }))} className="mt-1 text-xs" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600">Assessed By</label>
              <Select value={form.assessedBy ?? "manual"} onValueChange={v => setForm((f: any) => ({ ...f, assessedBy: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="ai">AI</SelectItem><SelectItem value="automated">Automated</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Notes</label><Textarea value={form.notes ?? ""} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => upsert.mutate(form)} disabled={upsert.isPending} className="text-xs">Save Score</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── AI Pipelines Tab ───────────────────────────────────────────────────────────
function AiPipelinesTab() {
  const utils = trpc.useUtils();
  const { data: pipelines = [] } = trpc.dmPipelines.list.useQuery({});
  const upsert = trpc.dmPipelines.upsert.useMutation({ onSuccess: () => { utils.dmPipelines.list.invalidate(); utils.dmSummary.overview.invalidate(); toast.success("Pipeline saved"); setOpen(false); } });
  const del = trpc.dmPipelines.delete.useMutation({ onSuccess: () => { utils.dmPipelines.list.invalidate(); toast.success("Pipeline deleted"); } });
  const genTemplate = trpc.dmPipelines.generatePromptTemplate.useMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [runsOpen, setRunsOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<any>(null);
  const { data: runs = [] } = trpc.dmPipelines.listRuns.useQuery(
    { pipelineId: selectedPipeline?.id ?? 0 },
    { enabled: !!selectedPipeline }
  );

  function openNew() { setEditing(null); setForm({ pipelineType: "generation", status: "draft", temperature: 0.7, maxTokens: 1000, version: "1.0" }); setOpen(true); }
  function openEdit(p: any) { setEditing(p); setForm({ ...p }); setOpen(true); }

  async function handleGenTemplate() {
    if (!form.pipelineType || !form.name) return toast.error("Fill in pipeline type and name first");
    toast.info("Generating prompt template…");
    try {
      const result = await genTemplate.mutateAsync({
        pipelineType: form.pipelineType,
        targetTask: form.name,
        inputDescription: form.inputSchema ?? "user input",
        outputDescription: form.outputSchema ?? "structured response",
      });
      setForm((f: any) => ({ ...f, systemPrompt: result.systemPrompt, promptTemplate: result.promptTemplate, inputSchema: result.inputSchema, outputSchema: result.outputSchema }));
      toast.success("Template generated");
    } catch { toast.error("Generation failed"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {[["All", pipelines.length], ["Active", pipelines.filter(p => p.status === "active").length], ["Draft", pipelines.filter(p => p.status === "draft").length]].map(([label, count]) => (
            <span key={label} className="text-xs text-gray-500">{label}: <strong>{count}</strong></span>
          ))}
        </div>
        <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#56A837", color: "#fff" }} onClick={openNew}><Plus size={13} /> New Pipeline</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pipelines.length === 0 && (
          <div className="col-span-2 bg-white rounded-xl border p-8 text-center text-gray-400 text-sm shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            No AI pipelines configured yet. Click "New Pipeline" to create one.
          </div>
        )}
        {pipelines.map(p => (
          <div key={p.id} className="bg-white rounded-xl border p-5 shadow-sm group" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-800">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-gray-400">{p.pipelineType} · {p.model ?? "default model"} · v{p.version}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setSelectedPipeline(p); setRunsOpen(true); }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100"><Eye size={12} className="text-gray-400" /></button>
                <button onClick={() => openEdit(p)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100"><Pencil size={12} className="text-gray-400" /></button>
                <button onClick={() => del.mutate({ id: p.id })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
              </div>
            </div>
            {p.description && <p className="text-xs text-gray-500 mb-3">{p.description}</p>}
            <div className="grid grid-cols-4 gap-2">
              {[
                ["Runs", p.totalRuns ?? 0, "#3B85BA"],
                ["Success %", p.successRate != null ? `${p.successRate.toFixed(0)}%` : "—", "#56A837"],
                ["Avg Latency", p.avgLatencyMs != null ? `${p.avgLatencyMs}ms` : "—", "#F69111"],
                ["Avg Tokens", p.avgTokensUsed ?? "—", "#6b7280"],
              ].map(([label, val, color]) => (
                <div key={label as string} className="text-center">
                  <div className="text-sm font-bold" style={{ color: color as string }}>{val}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Pipeline" : "New AI Pipeline"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Name *</label><Input value={form.name ?? ""} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="mt-1 text-xs" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Description</label><Textarea value={form.description ?? ""} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Pipeline Type</label>
              <Select value={form.pipelineType ?? "generation"} onValueChange={v => setForm((f: any) => ({ ...f, pipelineType: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["classification", "extraction", "generation", "summarisation", "embedding", "scoring", "routing"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Status</label>
              <Select value={form.status ?? "draft"} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["draft", "active", "paused", "deprecated", "error"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-semibold text-gray-600">Model</label><Input value={form.model ?? ""} onChange={e => setForm((f: any) => ({ ...f, model: e.target.value }))} placeholder="e.g. gpt-4o" className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Temperature</label><Input type="number" step={0.1} min={0} max={2} value={form.temperature ?? ""} onChange={e => setForm((f: any) => ({ ...f, temperature: Number(e.target.value) }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Max Tokens</label><Input type="number" value={form.maxTokens ?? ""} onChange={e => setForm((f: any) => ({ ...f, maxTokens: Number(e.target.value) }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Version</label><Input value={form.version ?? "1.0"} onChange={e => setForm((f: any) => ({ ...f, version: e.target.value }))} className="mt-1 text-xs" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">System Prompt</label><Textarea value={form.systemPrompt ?? ""} onChange={e => setForm((f: any) => ({ ...f, systemPrompt: e.target.value }))} className="mt-1 text-xs font-mono" rows={3} /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Prompt Template</label><Textarea value={form.promptTemplate ?? ""} onChange={e => setForm((f: any) => ({ ...f, promptTemplate: e.target.value }))} className="mt-1 text-xs font-mono" rows={3} placeholder="Use {{variable}} for dynamic inputs" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Input Schema (JSON)</label><Textarea value={form.inputSchema ?? ""} onChange={e => setForm((f: any) => ({ ...f, inputSchema: e.target.value }))} className="mt-1 text-xs font-mono" rows={2} /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Output Schema (JSON)</label><Textarea value={form.outputSchema ?? ""} onChange={e => setForm((f: any) => ({ ...f, outputSchema: e.target.value }))} className="mt-1 text-xs font-mono" rows={2} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={handleGenTemplate} disabled={genTemplate.isPending} className="gap-1.5 text-xs"><Zap size={12} />{genTemplate.isPending ? "Generating…" : "AI Generate Template"}</Button>
            <Button size="sm" onClick={() => upsert.mutate({ ...form, id: editing?.id })} disabled={upsert.isPending} className="text-xs">Save Pipeline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Runs dialog */}
      <Dialog open={runsOpen} onOpenChange={setRunsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Run History — {selectedPipeline?.name}</DialogTitle></DialogHeader>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50" style={{ borderColor: "#e5e7eb" }}>
                {["Started", "Status", "Tokens", "Latency", "Cost", "Triggered By"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No runs recorded yet.</td></tr>}
              {runs.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                  <td className="px-3 py-2 text-gray-500">{new Date(r.startedAt).toLocaleString()}</td>
                  <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2 text-gray-500">{r.tokensUsed?.toLocaleString() ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-500">{r.latencyMs != null ? `${r.latencyMs}ms` : "—"}</td>
                  <td className="px-3 py-2 text-gray-500">{r.costUsd != null ? `$${r.costUsd.toFixed(4)}` : "—"}</td>
                  <td className="px-3 py-2 text-gray-500">{r.triggeredBy ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── RAG Pipelines Tab ──────────────────────────────────────────────────────────
function RagPipelinesTab() {
  const utils = trpc.useUtils();
  const { data: rags = [] } = trpc.dmRag.list.useQuery({});
  const upsert = trpc.dmRag.upsert.useMutation({ onSuccess: () => { utils.dmRag.list.invalidate(); utils.dmSummary.overview.invalidate(); toast.success("RAG pipeline saved"); setOpen(false); } });
  const del = trpc.dmRag.delete.useMutation({ onSuccess: () => { utils.dmRag.list.invalidate(); toast.success("RAG pipeline deleted"); } });
  const addDoc = trpc.dmRag.addDocument.useMutation({ onSuccess: () => { utils.dmRag.listDocuments.invalidate(); toast.success("Document added"); setDocOpen(false); } });
  const removeDoc = trpc.dmRag.removeDocument.useMutation({ onSuccess: () => utils.dmRag.listDocuments.invalidate() });
  const markIndexed = trpc.dmRag.markDocumentIndexed.useMutation({ onSuccess: () => utils.dmRag.listDocuments.invalidate() });
  const genCtx = trpc.dmRag.generateContextTemplate.useMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [docOpen, setDocOpen] = useState(false);
  const [docForm, setDocForm] = useState<any>({});
  const [selectedRag, setSelectedRag] = useState<any>(null);
  const { data: docs = [] } = trpc.dmRag.listDocuments.useQuery(
    { ragPipelineId: selectedRag?.id ?? 0 },
    { enabled: !!selectedRag }
  );

  function openNew() { setEditing(null); setForm({ embeddingModel: "text-embedding-3-small", chunkSize: 512, chunkOverlap: 64, retrievalStrategy: "similarity", topK: 5, similarityThreshold: 0.7, status: "draft" }); setOpen(true); }
  function openEdit(r: any) { setEditing(r); setForm({ ...r }); setOpen(true); }

  async function handleGenCtx() {
    if (!form.name) return toast.error("Enter a name first");
    toast.info("Generating context template…");
    try {
      const result = await genCtx.mutateAsync({ pipelineName: form.name, retrievalStrategy: form.retrievalStrategy ?? "similarity", topK: form.topK ?? 5, useCase: form.description ?? "general retrieval" });
      setForm((f: any) => ({ ...f, contextTemplate: result.contextTemplate, systemPrompt: result.systemPrompt }));
      toast.success("Context template generated");
    } catch { toast.error("Generation failed"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {[["Total", rags.length], ["Ready", rags.filter(r => r.status === "ready").length], ["Docs", rags.reduce((a, r) => a + (r.documentCount ?? 0), 0)]].map(([l, v]) => (
            <span key={l} className="text-xs text-gray-500">{l}: <strong>{v}</strong></span>
          ))}
        </div>
        <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#22c55e", color: "#fff" }} onClick={openNew}><Plus size={13} /> New RAG Pipeline</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rags.length === 0 && (
          <div className="col-span-2 bg-white rounded-xl border p-8 text-center text-gray-400 text-sm shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            No RAG pipelines configured yet.
          </div>
        )}
        {rags.map(r => (
          <div key={r.id} className={`bg-white rounded-xl border p-5 shadow-sm cursor-pointer group transition-all ${selectedRag?.id === r.id ? "ring-2 ring-green-400" : ""}`} style={{ borderColor: "#e5e7eb" }} onClick={() => setSelectedRag(r)}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-800">{r.name}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-xs text-gray-400">{r.embeddingModel} · {r.retrievalStrategy} · top-{r.topK}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); openEdit(r); }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100"><Pencil size={12} className="text-gray-400" /></button>
                <button onClick={e => { e.stopPropagation(); del.mutate({ id: r.id }); }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[["Docs", r.documentCount ?? 0, "#3B85BA"], ["Chunks", r.chunkCount ?? 0, "#6b7280"], ["Queries", r.totalQueries ?? 0, "#56A837"]].map(([l, v, c]) => (
                <div key={l as string} className="text-center">
                  <div className="text-sm font-bold" style={{ color: c as string }}>{v}</div>
                  <div className="text-xs text-gray-400">{l}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Documents panel */}
      {selectedRag && (
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">Documents in "{selectedRag.name}"</h3>
            <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#3B85BA", color: "#fff" }} onClick={() => { setDocForm({ ragPipelineId: selectedRag.id, contentType: "text" }); setDocOpen(true); }}><Plus size={13} /> Add Document</Button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50" style={{ borderColor: "#e5e7eb" }}>
                {["Title", "Type", "Chunks", "Size", "Status", "Indexed", "Actions"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 && <tr><td colSpan={7} className="px-4 py-4 text-center text-gray-400">No documents added yet.</td></tr>}
              {docs.map(d => (
                <tr key={d.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                  <td className="px-3 py-2 font-medium text-gray-800">{d.title}</td>
                  <td className="px-3 py-2 text-gray-500 uppercase">{d.contentType}</td>
                  <td className="px-3 py-2 text-gray-500">{d.chunkCount}</td>
                  <td className="px-3 py-2 text-gray-500">{d.sizeKb != null ? `${d.sizeKb}KB` : "—"}</td>
                  <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                  <td className="px-3 py-2 text-gray-500">{d.indexedAt ? new Date(d.indexedAt).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {d.status === "pending" && <button onClick={() => markIndexed.mutate({ id: d.id, chunkCount: 10 })} className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600 hover:bg-green-100">Mark Indexed</button>}
                      <button onClick={() => removeDoc.mutate({ id: d.id, ragPipelineId: selectedRag.id })} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50"><Trash2 size={11} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RAG form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit RAG Pipeline" : "New RAG Pipeline"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Name *</label><Input value={form.name ?? ""} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="mt-1 text-xs" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Description</label><Textarea value={form.description ?? ""} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
            <div><label className="text-xs font-semibold text-gray-600">Embedding Model</label><Input value={form.embeddingModel ?? ""} onChange={e => setForm((f: any) => ({ ...f, embeddingModel: e.target.value }))} className="mt-1 text-xs" /></div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Retrieval Strategy</label>
              <Select value={form.retrievalStrategy ?? "similarity"} onValueChange={v => setForm((f: any) => ({ ...f, retrievalStrategy: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["similarity", "mmr", "hybrid", "keyword", "rerank"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-semibold text-gray-600">Chunk Size</label><Input type="number" value={form.chunkSize ?? 512} onChange={e => setForm((f: any) => ({ ...f, chunkSize: Number(e.target.value) }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Chunk Overlap</label><Input type="number" value={form.chunkOverlap ?? 64} onChange={e => setForm((f: any) => ({ ...f, chunkOverlap: Number(e.target.value) }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Top K</label><Input type="number" value={form.topK ?? 5} onChange={e => setForm((f: any) => ({ ...f, topK: Number(e.target.value) }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Similarity Threshold</label><Input type="number" step={0.05} min={0} max={1} value={form.similarityThreshold ?? 0.7} onChange={e => setForm((f: any) => ({ ...f, similarityThreshold: Number(e.target.value) }))} className="mt-1 text-xs" /></div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Status</label>
              <Select value={form.status ?? "draft"} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["draft", "indexing", "ready", "error", "stale"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-semibold text-gray-600">Rerank Model</label><Input value={form.rerankModel ?? ""} onChange={e => setForm((f: any) => ({ ...f, rerankModel: e.target.value }))} className="mt-1 text-xs" placeholder="optional" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">System Prompt</label><Textarea value={form.systemPrompt ?? ""} onChange={e => setForm((f: any) => ({ ...f, systemPrompt: e.target.value }))} className="mt-1 text-xs font-mono" rows={3} /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Context Template</label><Textarea value={form.contextTemplate ?? ""} onChange={e => setForm((f: any) => ({ ...f, contextTemplate: e.target.value }))} className="mt-1 text-xs font-mono" rows={3} placeholder="How retrieved docs are injected into the prompt" /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-600">Notes</label><Textarea value={form.notes ?? ""} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={handleGenCtx} disabled={genCtx.isPending} className="gap-1.5 text-xs"><Zap size={12} />{genCtx.isPending ? "Generating…" : "AI Generate Context"}</Button>
            <Button size="sm" onClick={() => upsert.mutate({ ...form, id: editing?.id })} disabled={upsert.isPending} className="text-xs">Save RAG Pipeline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add document dialog */}
      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Document to RAG Pipeline</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-xs font-semibold text-gray-600">Title *</label><Input value={docForm.title ?? ""} onChange={e => setDocForm((f: any) => ({ ...f, title: e.target.value }))} className="mt-1 text-xs" /></div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Content Type</label>
              <Select value={docForm.contentType ?? "text"} onValueChange={v => setDocForm((f: any) => ({ ...f, contentType: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["text", "pdf", "docx", "url", "code"].map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-semibold text-gray-600">Storage URL</label><Input value={docForm.storageUrl ?? ""} onChange={e => setDocForm((f: any) => ({ ...f, storageUrl: e.target.value }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Size (KB)</label><Input type="number" value={docForm.sizeKb ?? ""} onChange={e => setDocForm((f: any) => ({ ...f, sizeKb: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Notes</label><Textarea value={docForm.notes ?? ""} onChange={e => setDocForm((f: any) => ({ ...f, notes: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => addDoc.mutate(docForm)} disabled={addDoc.isPending} className="text-xs">Add Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Fine-Tuning Tab ────────────────────────────────────────────────────────────
function FineTuningTab() {
  const utils = trpc.useUtils();
  const { data: datasets = [], error: datasetsError } = trpc.dmFineTuning.listDatasets.useQuery({});
  const { data: jobs = [], error: jobsError } = trpc.dmFineTuning.listJobs.useQuery({});
  if (datasetsError || jobsError) return <QueryErrorBanner errors={[datasetsError, jobsError]} message="Unable to load fine-tuning data. Please refresh." />;
  const upsertDataset = trpc.dmFineTuning.upsertDataset.useMutation({ onSuccess: () => { utils.dmFineTuning.listDatasets.invalidate(); toast.success("Dataset saved"); setDsOpen(false); } });
  const deleteDataset = trpc.dmFineTuning.deleteDataset.useMutation({ onSuccess: () => utils.dmFineTuning.listDatasets.invalidate() });
  const upsertJob = trpc.dmFineTuning.upsertJob.useMutation({ onSuccess: () => { utils.dmFineTuning.listJobs.invalidate(); utils.dmSummary.overview.invalidate(); toast.success("Job saved"); setJobOpen(false); } });
  const deleteJob = trpc.dmFineTuning.deleteJob.useMutation({ onSuccess: () => utils.dmFineTuning.listJobs.invalidate() });

  const [dsOpen, setDsOpen] = useState(false);
  const [dsForm, setDsForm] = useState<any>({});
  const [editingDs, setEditingDs] = useState<any>(null);
  const [jobOpen, setJobOpen] = useState(false);
  const [jobForm, setJobForm] = useState<any>({});
  const [editingJob, setEditingJob] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Datasets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">Training Datasets</h3>
          <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#3B85BA", color: "#fff" }} onClick={() => { setEditingDs(null); setDsForm({ format: "jsonl", status: "draft", trainSplit: 0.8, valSplit: 0.1, testSplit: 0.1, totalSamples: 0, labelledSamples: 0 }); setDsOpen(true); }}><Plus size={13} /> New Dataset</Button>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50" style={{ borderColor: "#e5e7eb" }}>
                {["Name", "Task Type", "Samples", "Labelled", "Format", "Quality", "Status", "Actions"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datasets.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No datasets yet.</td></tr>}
              {datasets.map(d => (
                <tr key={d.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                  <td className="px-3 py-2 font-medium text-gray-800">{d.name}</td>
                  <td className="px-3 py-2 text-gray-500">{d.taskType ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-500">{d.totalSamples}</td>
                  <td className="px-3 py-2 text-gray-500">{d.labelledSamples} ({d.totalSamples > 0 ? Math.round((d.labelledSamples / d.totalSamples) * 100) : 0}%)</td>
                  <td className="px-3 py-2 text-gray-500 uppercase">{d.format}</td>
                  <td className="px-3 py-2">{d.qualityScore != null ? <span className="font-mono" style={{ color: d.qualityScore >= 80 ? "#56A837" : "#F69111" }}>{d.qualityScore.toFixed(0)}%</span> : "—"}</td>
                  <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingDs(d); setDsForm({ ...d }); setDsOpen(true); }} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100"><Pencil size={11} className="text-gray-400" /></button>
                      <button onClick={() => deleteDataset.mutate({ id: d.id })} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50"><Trash2 size={11} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">Fine-Tuning Jobs</h3>
          <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#56A837", color: "#fff" }} onClick={() => { setEditingJob(null); setJobForm({ status: "draft" }); setJobOpen(true); }}><Plus size={13} /> New Job</Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobs.length === 0 && (
            <div className="col-span-2 bg-white rounded-xl border p-6 text-center text-gray-400 text-sm shadow-sm" style={{ borderColor: "#e5e7eb" }}>No fine-tuning jobs yet.</div>
          )}
          {jobs.map(j => (
            <div key={j.id} className="bg-white rounded-xl border p-4 shadow-sm group" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-800">{j.name}</span>
                    <StatusBadge status={j.status} />
                  </div>
                  <p className="text-xs text-gray-400">{j.baseModel} · {j.targetTask ?? "general"}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingJob(j); setJobForm({ ...j }); setJobOpen(true); }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100"><Pencil size={12} className="text-gray-400" /></button>
                  <button onClick={() => deleteJob.mutate({ id: j.id })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[["Train Loss", j.trainLoss?.toFixed(4) ?? "—", "#3B85BA"], ["Val Loss", j.valLoss?.toFixed(4) ?? "—", "#F69111"], ["Accuracy", j.accuracy != null ? `${j.accuracy.toFixed(1)}%` : "—", "#56A837"], ["Cost", j.actualCostUsd != null ? `$${j.actualCostUsd.toFixed(2)}` : "—", "#6b7280"]].map(([l, v, c]) => (
                  <div key={l as string} className="text-center">
                    <div className="text-sm font-bold" style={{ color: c as string }}>{v}</div>
                    <div className="text-xs text-gray-400">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dataset dialog */}
      <Dialog open={dsOpen} onOpenChange={setDsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingDs ? "Edit Dataset" : "New Training Dataset"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-xs font-semibold text-gray-600">Name *</label><Input value={dsForm.name ?? ""} onChange={e => setDsForm((f: any) => ({ ...f, name: e.target.value }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Task Type</label><Input value={dsForm.taskType ?? ""} onChange={e => setDsForm((f: any) => ({ ...f, taskType: e.target.value }))} placeholder="e.g. classification, summarisation" className="mt-1 text-xs" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-semibold text-gray-600">Total Samples</label><Input type="number" value={dsForm.totalSamples ?? 0} onChange={e => setDsForm((f: any) => ({ ...f, totalSamples: Number(e.target.value) }))} className="mt-1 text-xs" /></div>
              <div><label className="text-xs font-semibold text-gray-600">Labelled Samples</label><Input type="number" value={dsForm.labelledSamples ?? 0} onChange={e => setDsForm((f: any) => ({ ...f, labelledSamples: Number(e.target.value) }))} className="mt-1 text-xs" /></div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Format</label>
              <Select value={dsForm.format ?? "jsonl"} onValueChange={v => setDsForm((f: any) => ({ ...f, format: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="jsonl">JSONL</SelectItem><SelectItem value="csv">CSV</SelectItem><SelectItem value="parquet">Parquet</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Status</label>
              <Select value={dsForm.status ?? "draft"} onValueChange={v => setDsForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["draft", "labelling", "ready", "archived"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-semibold text-gray-600">Quality Score (0-100)</label><Input type="number" min={0} max={100} value={dsForm.qualityScore ?? ""} onChange={e => setDsForm((f: any) => ({ ...f, qualityScore: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Storage URL</label><Input value={dsForm.storageUrl ?? ""} onChange={e => setDsForm((f: any) => ({ ...f, storageUrl: e.target.value }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Notes</label><Textarea value={dsForm.notes ?? ""} onChange={e => setDsForm((f: any) => ({ ...f, notes: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => upsertDataset.mutate({ ...dsForm, id: editingDs?.id })} disabled={upsertDataset.isPending} className="text-xs">Save Dataset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job dialog */}
      <Dialog open={jobOpen} onOpenChange={setJobOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingJob ? "Edit Fine-Tuning Job" : "New Fine-Tuning Job"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-xs font-semibold text-gray-600">Name *</label><Input value={jobForm.name ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, name: e.target.value }))} className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Base Model *</label><Input value={jobForm.baseModel ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, baseModel: e.target.value }))} placeholder="e.g. gpt-3.5-turbo" className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Target Task</label><Input value={jobForm.targetTask ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, targetTask: e.target.value }))} className="mt-1 text-xs" /></div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Dataset</label>
              <Select value={jobForm.datasetId?.toString() ?? ""} onValueChange={v => setJobForm((f: any) => ({ ...f, datasetId: Number(v) }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Select dataset…" /></SelectTrigger>
                <SelectContent>{datasets.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-semibold text-gray-600">Epochs</label><Input type="number" value={jobForm.epochs ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, epochs: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
              <div><label className="text-xs font-semibold text-gray-600">Batch Size</label><Input type="number" value={jobForm.batchSize ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, batchSize: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
              <div><label className="text-xs font-semibold text-gray-600">Learning Rate</label><Input type="number" step={0.0001} value={jobForm.learningRate ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, learningRate: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
              <div><label className="text-xs font-semibold text-gray-600">Est. Cost (USD)</label><Input type="number" step={0.01} value={jobForm.estimatedCostUsd ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, estimatedCostUsd: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Status</label>
              <Select value={jobForm.status ?? "draft"} onValueChange={v => setJobForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["draft", "preparing", "training", "evaluating", "completed", "failed", "cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-semibold text-gray-600">Train Loss</label><Input type="number" step={0.0001} value={jobForm.trainLoss ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, trainLoss: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
              <div><label className="text-xs font-semibold text-gray-600">Val Loss</label><Input type="number" step={0.0001} value={jobForm.valLoss ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, valLoss: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
              <div><label className="text-xs font-semibold text-gray-600">Accuracy (%)</label><Input type="number" step={0.1} min={0} max={100} value={jobForm.accuracy ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, accuracy: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
              <div><label className="text-xs font-semibold text-gray-600">Actual Cost (USD)</label><Input type="number" step={0.01} value={jobForm.actualCostUsd ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, actualCostUsd: Number(e.target.value) || undefined }))} className="mt-1 text-xs" /></div>
            </div>
            <div><label className="text-xs font-semibold text-gray-600">Fine-Tuned Model ID</label><Input value={jobForm.fineTunedModelId ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, fineTunedModelId: e.target.value }))} placeholder="Provider model ID after training" className="mt-1 text-xs" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Notes</label><Textarea value={jobForm.notes ?? ""} onChange={e => setJobForm((f: any) => ({ ...f, notes: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => upsertJob.mutate({ ...jobForm, id: editingJob?.id })} disabled={upsertJob.isPending} className="text-xs">Save Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Feedback Loops Tab ─────────────────────────────────────────────────────────
function FeedbackLoopsTab() {
  const utils = trpc.useUtils();
  const { data: feedback = [], error: feedbackError } = trpc.dmFeedback.list.useQuery({});
  if (feedbackError) return <QueryErrorBanner errors={[feedbackError]} message="Unable to load feedback data. Please refresh." />;
  const { data: pipelines = [] } = trpc.dmPipelines.list.useQuery({});
  const submit = trpc.dmFeedback.submit.useMutation({ onSuccess: () => { utils.dmFeedback.list.invalidate(); utils.dmSummary.overview.invalidate(); toast.success("Feedback submitted"); setOpen(false); } });
  const review = trpc.dmFeedback.review.useMutation({ onSuccess: () => { utils.dmFeedback.list.invalidate(); toast.success("Feedback reviewed"); setReviewOpen(false); } });
  const del = trpc.dmFeedback.delete.useMutation({ onSuccess: () => utils.dmFeedback.list.invalidate() });
  const genPlan = trpc.dmFeedback.generateImprovementPlan.useMutation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState<any>({});
  const [reviewingItem, setReviewingItem] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [planResult, setPlanResult] = useState<any>(null);
  const [planOpen, setPlanOpen] = useState(false);

  const filtered = useMemo(() => feedback.filter(f =>
    filterStatus === "all" || f.status === filterStatus
  ), [feedback, filterStatus]);

  const openFeedback = feedback.filter(f => f.status === "open").length;
  const positiveCount = feedback.filter(f => f.thumbs === "up" || (f.rating ?? 0) >= 4).length;
  const satisfaction = feedback.length > 0 ? Math.round((positiveCount / feedback.length) * 100) : 0;

  async function handleGenPlan(pipelineId: number, pipelineName: string) {
    const pipelineFeedback = feedback.filter(f => f.pipelineId === pipelineId);
    if (pipelineFeedback.length === 0) return toast.error("No feedback for this pipeline");
    toast.info("Generating improvement plan…");
    try {
      const summary = pipelineFeedback.map(f => `- [${f.feedbackType}] ${f.comment ?? ""} ${f.issueCategory ? `(${f.issueCategory})` : ""}`).join("\n");
      const result = await genPlan.mutateAsync({ pipelineId, pipelineName, feedbackSummary: summary });
      setPlanResult({ ...result, pipelineName });
      setPlanOpen(true);
    } catch { toast.error("Plan generation failed"); }
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Feedback" value={feedback.length} accent="#3B85BA" icon={MessageSquare} />
        <KpiCard label="Open Items" value={openFeedback} sub="awaiting review" accent="#F69111" icon={AlertCircle} />
        <KpiCard label="Satisfaction" value={`${satisfaction}%`} sub="positive ratings" accent={satisfaction >= 70 ? "#56A837" : "#F69111"} icon={Star} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["open", "reviewed", "actioned", "dismissed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#F69111", color: "#fff" }} onClick={() => { setForm({ feedbackType: "rating", rating: 3 }); setOpen(true); }}><Plus size={13} /> Submit Feedback</Button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-gray-50" style={{ borderColor: "#e5e7eb" }}>
              {["Date", "Type", "Pipeline", "Rating", "Issue", "Comment", "Status", "Actions"].map(h => (
                <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No feedback entries yet.</td></tr>}
            {filtered.map(f => {
              const pipeline = pipelines.find(p => p.id === f.pipelineId);
              return (
                <tr key={f.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                  <td className="px-3 py-2 text-gray-500">{new Date(f.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2"><StatusBadge status={f.feedbackType} /></td>
                  <td className="px-3 py-2 text-gray-500">{pipeline?.name ?? "—"}</td>
                  <td className="px-3 py-2">
                    {f.thumbs === "up" ? <ThumbsUp size={13} className="text-green-500" /> :
                      f.thumbs === "down" ? <ThumbsDown size={13} className="text-red-400" /> :
                        f.rating != null ? <span className="flex items-center gap-0.5">{f.rating}<Star size={10} className="text-yellow-400" /></span> : "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{f.issueCategory?.replace(/_/g, " ") ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-500 max-w-xs truncate">{f.comment ?? "—"}</td>
                  <td className="px-3 py-2"><StatusBadge status={f.status} /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {f.status === "open" && (
                        <button onClick={() => { setReviewingItem(f); setReviewForm({ id: f.id, status: "reviewed" }); setReviewOpen(true); }} className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100">Review</button>
                      )}
                      {pipeline && <button onClick={() => handleGenPlan(pipeline.id, pipeline.name)} className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-600 hover:bg-purple-100"><Zap size={10} className="inline" /></button>}
                      <button onClick={() => del.mutate({ id: f.id })} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50"><Trash2 size={11} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Submit feedback dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Submit AI Output Feedback</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-600">Pipeline</label>
              <Select value={form.pipelineId?.toString() ?? ""} onValueChange={v => setForm((f: any) => ({ ...f, pipelineId: Number(v) }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Select pipeline…" /></SelectTrigger>
                <SelectContent>{pipelines.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Feedback Type</label>
              <Select value={form.feedbackType ?? "rating"} onValueChange={v => setForm((f: any) => ({ ...f, feedbackType: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["thumbs_up", "thumbs_down", "rating", "correction", "flag"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.feedbackType === "rating" && (
              <div><label className="text-xs font-semibold text-gray-600">Rating (1-5)</label><Input type="number" min={1} max={5} value={form.rating ?? 3} onChange={e => setForm((f: any) => ({ ...f, rating: Number(e.target.value) }))} className="mt-1 text-xs" /></div>
            )}
            {(form.feedbackType === "thumbs_up" || form.feedbackType === "thumbs_down") && (
              <div><label className="text-xs font-semibold text-gray-600">Thumbs</label>
                <Select value={form.thumbs ?? ""} onValueChange={v => setForm((f: any) => ({ ...f, thumbs: v }))}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="up">👍 Up</SelectItem><SelectItem value="down">👎 Down</SelectItem></SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-600">Issue Category</label>
              <Select value={form.issueCategory ?? ""} onValueChange={v => setForm((f: any) => ({ ...f, issueCategory: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Select if applicable…" /></SelectTrigger>
                <SelectContent>{["factual_error", "tone", "format", "missing_info", "hallucination", "other"].map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-semibold text-gray-600">Comment</label><Textarea value={form.comment ?? ""} onChange={e => setForm((f: any) => ({ ...f, comment: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
            <div><label className="text-xs font-semibold text-gray-600">Original AI Output</label><Textarea value={form.originalOutput ?? ""} onChange={e => setForm((f: any) => ({ ...f, originalOutput: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
            <div><label className="text-xs font-semibold text-gray-600">Corrected Output (if applicable)</label><Textarea value={form.correctedOutput ?? ""} onChange={e => setForm((f: any) => ({ ...f, correctedOutput: e.target.value }))} className="mt-1 text-xs" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => submit.mutate(form)} disabled={submit.isPending} className="text-xs">Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Review Feedback</DialogTitle></DialogHeader>
          {reviewingItem && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-600">
              <p><strong>Comment:</strong> {reviewingItem.comment ?? "—"}</p>
              <p><strong>Issue:</strong> {reviewingItem.issueCategory ?? "—"}</p>
              {reviewingItem.originalOutput && <p className="mt-1"><strong>Original output:</strong> {reviewingItem.originalOutput.slice(0, 200)}…</p>}
            </div>
          )}
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-600">Resolution Status</label>
              <Select value={reviewForm.status ?? "reviewed"} onValueChange={v => setReviewForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["reviewed", "actioned", "dismissed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-semibold text-gray-600">Improvement Action Taken</label><Textarea value={reviewForm.improvementAction ?? ""} onChange={e => setReviewForm((f: any) => ({ ...f, improvementAction: e.target.value }))} className="mt-1 text-xs" rows={3} placeholder="Describe what was changed to address this feedback…" /></div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => review.mutate(reviewForm)} disabled={review.isPending} className="text-xs">Save Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Improvement plan dialog */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>AI Improvement Plan — {planResult?.pipelineName}</DialogTitle></DialogHeader>
          {planResult && (
            <div className="space-y-4 py-2 text-xs">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Root Causes</h4>
                <ul className="space-y-1">{planResult.rootCauses.map((c: string, i: number) => <li key={i} className="flex items-start gap-2"><AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" /><span className="text-gray-600">{c}</span></li>)}</ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Immediate Actions</h4>
                <ul className="space-y-1">{planResult.immediateActions.map((a: string, i: number) => <li key={i} className="flex items-start gap-2"><CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" /><span className="text-gray-600">{a}</span></li>)}</ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Prompt Improvements</h4>
                <ul className="space-y-1">{planResult.promptImprovements.map((p: string, i: number) => <li key={i} className="flex items-start gap-2"><ChevronRight size={12} className="text-blue-400 mt-0.5 shrink-0" /><span className="text-gray-600">{p}</span></li>)}</ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Data Improvements</h4>
                <ul className="space-y-1">{planResult.dataImprovements.map((d: string, i: number) => <li key={i} className="flex items-start gap-2"><Database size={12} className="text-purple-400 mt-0.5 shrink-0" /><span className="text-gray-600">{d}</span></li>)}</ul>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <h4 className="font-semibold text-green-700 mb-1">Estimated Impact</h4>
                <p className="text-green-600">{planResult.estimatedImpact}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DataManagement() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3B85BA15", color: "#3B85BA" }}>
                Venture OS · Sections 8 & 9
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Data Management &amp; AI/RAG
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl">
              Central hub for data asset cataloguing, quality scoring, AI pipeline management, RAG pipeline configuration, fine-tuning job tracking, and feedback loop management.
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto bg-gray-100 p-1 rounded-lg">
            {[
              ["overview", "Overview", Database],
              ["assets", "Data Assets", FileText],
              ["quality", "Quality Scoring", BarChart2],
              ["pipelines", "AI Pipelines", Cpu],
              ["rag", "RAG Pipelines", Search],
              ["finetuning", "Fine-Tuning", Layers],
              ["feedback", "Feedback Loops", MessageSquare],
            ].map(([value, label, Icon]) => (
              <TabsTrigger key={value as string} value={value as string} className="flex items-center gap-1.5 text-xs px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {Icon && (() => { const I = Icon as React.ElementType; return <I size={12} />; })()}
                {label as string}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="assets"><DataAssetsTab /></TabsContent>
          <TabsContent value="quality"><QualityScoringTab /></TabsContent>
          <TabsContent value="pipelines"><AiPipelinesTab /></TabsContent>
          <TabsContent value="rag"><RagPipelinesTab /></TabsContent>
          <TabsContent value="finetuning"><FineTuningTab /></TabsContent>
          <TabsContent value="feedback"><FeedbackLoopsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
