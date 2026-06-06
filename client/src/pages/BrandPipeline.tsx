/**
 * Sprint 75 — Brand Data Pipeline & Brand Asset Register
 * V4 Architecture Brief — Section 2.4 & 3.4
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, Clock, AlertCircle, XCircle, Link2, RefreshCw, Sparkles } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  pending:  "bg-amber-100 text-amber-800",
  draft:    "bg-blue-100 text-blue-800",
  missing:  "bg-red-50 text-red-500",
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  approved: <CheckCircle size={14} className="text-green-500" />,
  pending:  <Clock size={14} className="text-amber-500" />,
  draft:    <Clock size={14} className="text-blue-500" />,
  missing:  <XCircle size={14} className="text-red-400" />,
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  name_tagline: "Venture Name & Tagline", logo: "Logo Files", colour_palette: "Colour Palette",
  typography: "Typography Guide", messaging_house: "Messaging House",
  icp_definition: "ICP Definition", brand_voice: "Brand Voice Guidelines",
};

export default function BrandPipeline() {
  const [ventureId, setVentureId] = useState("ECB-001");
  const [ventureCode, setVentureCode] = useState("ECB");
  const [ventureName, setVentureName] = useState("EcoBlend");
  const [ventureStage, setVentureStage] = useState("build");
  const [activeTab, setActiveTab] = useState<"register"|"links"|"log">("register");
  const [editAsset, setEditAsset] = useState<{ assetType: string; status: string; content: string; version: string; owner: string } | null>(null);
  const [generatingHeader, setGeneratingHeader] = useState(false);
  const [generatedHeader, setGeneratedHeader] = useState("");

  const register = trpc.brandPipeline.getAssetRegister.useQuery({ ventureId }, { enabled: !!ventureId });
  const panel    = trpc.brandPipeline.getBrandPanel.useQuery({ ventureId }, { enabled: !!ventureId });
  const log      = trpc.brandPipeline.getUpdateLog.useQuery({ ventureId, limit: 20 }, { enabled: !!ventureId });
  const assetTypes = trpc.brandPipeline.getBrandAssetTypes.useQuery();
  const linkTargets = trpc.brandPipeline.getModuleLinkTargets.useQuery();

  const upsertAsset = trpc.brandPipeline.upsertAsset.useMutation({
    onSuccess: () => { toast.success("Asset updated"); register.refetch(); panel.refetch(); log.refetch(); setEditAsset(null); },
    onError: (e) => toast.error(e.message),
  });
  const autoLink = trpc.brandPipeline.autoLinkAllModules.useMutation({
    onSuccess: (data) => { toast.success(data.message); },
    onError: (e) => toast.error(e.message),
  });
  const generateHeader = trpc.brandPipeline.generateDocumentHeader.useMutation({
    onSuccess: (data) => { setGeneratedHeader(data.header); setGeneratingHeader(false); },
    onError: (e) => { toast.error(e.message); setGeneratingHeader(false); },
  });

  const p = panel.data;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#EC489915", color: "#EC4899" }}>Sprint 75</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">V4 Architecture Brief — Section 2.4 & 3.4</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>Brand Data Pipeline</h1>
            <p className="text-sm text-gray-500 max-w-xl">Brand Asset Register with automated module linking. Approved assets auto-push to all connected modules and notify lead owners.</p>
          </div>
          <div className="flex items-center gap-2">
            <Input value={ventureId} onChange={e => setVentureId(e.target.value)} className="w-28 text-xs h-8" placeholder="Venture ID" />
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => autoLink.mutate({ ventureId })} disabled={autoLink.isPending}>
              <Link2 size={13} /> {autoLink.isPending ? "Linking…" : "Auto-Link Modules"}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Brand Panel Summary */}
        {p && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Approved</div>
              <div className="text-3xl font-bold text-green-600" style={{ fontFamily: "'Prompt', sans-serif" }}>{p.approvedCount}</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Pending</div>
              <div className="text-3xl font-bold text-amber-500" style={{ fontFamily: "'Prompt', sans-serif" }}>{p.pendingCount}</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Missing</div>
              <div className="text-3xl font-bold text-red-500" style={{ fontFamily: "'Prompt', sans-serif" }}>{p.missingCount}</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Overall Status</div>
              <Badge className={`text-xs ${STATUS_COLORS[p.overallStatus === "all_approved" ? "approved" : p.overallStatus === "pending" ? "pending" : "missing"]}`}>
                {p.overallStatus.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {(["register","links","log"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50 border"}`}
              style={activeTab !== tab ? { borderColor: "#e5e7eb" } : {}}>
              {tab === "register" ? "Asset Register" : tab === "links" ? "Module Links" : "Update Log"}
            </button>
          ))}
        </div>

        {/* Asset Register */}
        {activeTab === "register" && (
          <div>
            <div className="space-y-3 mb-6">
              {(register.data ?? []).map(asset => (
                <div key={asset.id} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${asset.status === "approved" ? "#56A837" : asset.status === "missing" ? "#EF4444" : "#F69111"}` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {STATUS_ICONS[asset.status]}
                      <div>
                        <div className="font-semibold text-sm text-gray-900">{ASSET_TYPE_LABELS[asset.assetType] ?? asset.assetType}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[asset.status]}`}>{asset.status}</span>
                          {asset.version && <span className="text-xs text-gray-400">v{asset.version}</span>}
                          {asset.owner && <span className="text-xs text-gray-400">Owner: {asset.owner}</span>}
                        </div>
                        {asset.masterLocation && <div className="text-xs text-gray-400 mt-1">📁 {asset.masterLocation}</div>}
                        {asset.content && <div className="text-xs text-gray-600 mt-1 line-clamp-2">{asset.content}</div>}
                        {asset.approvedAt && <div className="text-xs text-green-500 mt-1">Approved: {new Date(asset.approvedAt).toLocaleDateString()}</div>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditAsset({ assetType: asset.assetType, status: asset.status, content: asset.content ?? "", version: asset.version ?? "V1", owner: asset.owner ?? "" })}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit form */}
            {editAsset && (
              <Card className="mb-6 border-2" style={{ borderColor: "#EC4899" }}>
                <CardHeader><CardTitle className="text-sm">{ASSET_TYPE_LABELS[editAsset.assetType]}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-xs mb-1 block">Status</Label>
                      <Select value={editAsset.status} onValueChange={v => setEditAsset(a => a ? { ...a, status: v } : null)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["missing","draft","pending","approved"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Version</Label>
                      <Input value={editAsset.version} onChange={e => setEditAsset(a => a ? { ...a, version: e.target.value } : null)} className="h-8 text-xs" placeholder="V1" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Owner</Label>
                      <Input value={editAsset.owner} onChange={e => setEditAsset(a => a ? { ...a, owner: e.target.value } : null)} className="h-8 text-xs" placeholder="Growth Lead" />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs mb-1 block">Content / Summary</Label>
                      <textarea value={editAsset.content} onChange={e => setEditAsset(a => a ? { ...a, content: e.target.value } : null)} rows={3} className="w-full text-xs border rounded-lg p-2 resize-none" style={{ borderColor: "#e5e7eb" }} placeholder="Brief content or summary of this brand asset…" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => upsertAsset.mutate({ ventureId, assetType: editAsset.assetType as any, status: editAsset.status as any, content: editAsset.content, version: editAsset.version, owner: editAsset.owner })} disabled={upsertAsset.isPending}>
                      {upsertAsset.isPending ? "Saving…" : "Save Asset"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditAsset(null)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Document Header Generator */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="font-semibold text-sm text-gray-900">AI Document Header Generator</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">Generate a standard brand-consistent document header block for all AI-drafted outputs.</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div><Label className="text-xs mb-1 block">Venture Code</Label><Input value={ventureCode} onChange={e => setVentureCode(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs mb-1 block">Venture Name</Label><Input value={ventureName} onChange={e => setVentureName(e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs mb-1 block">Stage</Label>
                  <Select value={ventureStage} onValueChange={setVentureStage}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{["discover","define","build","launch","spinout"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" className="gap-1.5 text-xs mb-3" onClick={() => { setGeneratingHeader(true); generateHeader.mutate({ ventureId, ventureCode, ventureName, ventureStage }); }} disabled={generatingHeader}>
                <Sparkles size={12} /> {generatingHeader ? "Generating…" : "Generate Header"}
              </Button>
              {generatedHeader && (
                <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-sans border" style={{ borderColor: "#e5e7eb" }}>{generatedHeader}</pre>
              )}
            </div>
          </div>
        )}

        {/* Module Links */}
        {activeTab === "links" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-sm font-semibold text-gray-900">Brand Asset → Module Link Map</h3>
              <p className="text-xs text-gray-400 mt-0.5">Approved brand assets auto-push to these modules and notify module leads</p>
            </div>
            <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
              {(linkTargets.data ?? []).map(target => (
                <div key={target.module} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-gray-700">{target.module}</span>
                    <span className="font-semibold text-sm text-gray-900">{target.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-10">
                    {target.assets.map(a => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100">{ASSET_TYPE_LABELS[a] ?? a}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Update Log */}
        {activeTab === "log" && (
          <div className="space-y-2">
            {(log.data ?? []).map(entry => (
              <div key={entry.id} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{ASSET_TYPE_LABELS[entry.assetType] ?? entry.assetType}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[entry.previousStatus] ?? "bg-gray-100 text-gray-600"}`}>{entry.previousStatus}</span>
                      <span className="text-gray-400 text-xs">→</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[entry.newStatus] ?? "bg-gray-100 text-gray-600"}`}>{entry.newStatus}</span>
                      {entry.changedBy && <span className="text-xs text-gray-400">by {entry.changedBy}</span>}
                    </div>
                    {Array.isArray(entry.downstreamFlags) && (entry.downstreamFlags as any[]).length > 0 && (
                      <div className="mt-1 text-xs text-gray-400">
                        Notified: {(entry.downstreamFlags as any[]).map((f: any) => f.name).join(", ")}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-300">{new Date(entry.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {(log.data ?? []).length === 0 && <div className="text-center py-10 text-sm text-gray-400">No brand updates logged yet.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
