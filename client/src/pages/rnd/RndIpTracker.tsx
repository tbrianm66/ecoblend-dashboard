// ============================================================================
// R&D Hub — IP Tracker  (/rnd/ip)
// Phase 3: Section 5 — Full IP Management Dashboard
// Uses the existing ip_assets table (shared with IpManagement module)
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShieldCheck, Plus, Pencil, Trash2, FileText, Lock, Tag, Copyright,
  CheckCircle2, Clock, AlertTriangle, FileSearch, Globe,
} from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

// ── Constants ─────────────────────────────────────────────────────────────────

const IP_TYPES = [
  { value: "Patent",        label: "Patent",        icon: FileText,   color: "#3B85BA" },
  { value: "Trade Secret",  label: "Trade Secret",  icon: Lock,       color: "#7c3aed" },
  { value: "Trademark",     label: "Trademark",     icon: Tag,        color: "#F69111" },
  { value: "Copyright",     label: "Copyright",     icon: Copyright,  color: "#059669" },
  { value: "Design Right",  label: "Design Right",  icon: FileSearch, color: "#9a3412" },
];

const IP_STATUSES = [
  { value: "Draft",       label: "Draft",       color: "#6b7280", bg: "#f3f4f6", icon: Clock },
  { value: "Filed",       label: "Filed",       color: "#3B85BA", bg: "#dbeafe", icon: Globe },
  { value: "Provisional", label: "Provisional", color: "#F69111", bg: "#fff7ed", icon: AlertTriangle },
  { value: "PCT Filed",   label: "PCT Filed",   color: "#7c3aed", bg: "#ede9fe", icon: Globe },
  { value: "Granted",     label: "Granted",     color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
  { value: "Abandoned",   label: "Abandoned",   color: "#dc2626", bg: "#fef2f2", icon: FileSearch },
];

const EMPTY_FORM = {
  title:        "",
  ipType:       "Patent",
  status:       "Draft",
  reference:    "",
  jurisdiction: "UK",
  filedDate:    "",
  grantedDate:  "",
  assignedTo:   "",
  notes:        "",
};
type FormState = typeof EMPTY_FORM;

function typeCfg(type: string)     { return IP_TYPES.find(t => t.value === type)   ?? IP_TYPES[0]; }
function statusCfg(status: string) { return IP_STATUSES.find(s => s.value === status) ?? IP_STATUSES[0]; }

// ── Asset Modal ───────────────────────────────────────────────────────────────

function AssetModal({
  open, onClose, ventureId, editId, initialForm, onSaved,
}: {
  open: boolean; onClose: () => void; ventureId: string;
  editId?: number; initialForm: FormState; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const upsert = trpc.rnd.ipAssets.upsert.useMutation({
    onSuccess: () => { toast.success(editId ? "IP asset updated." : "IP asset added."); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit IP Asset" : "Add IP Asset"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Title *</label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Hemp-Flax Composite Binding Method" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">IP Type *</label>
              <Select value={form.ipType} onValueChange={v => set("ipType", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Status *</label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IP_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Reference / Filing No.</label>
              <Input value={form.reference} onChange={e => set("reference", e.target.value)} placeholder="e.g. GB2412345" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Jurisdiction</label>
              <Input value={form.jurisdiction} onChange={e => set("jurisdiction", e.target.value)} placeholder="e.g. UK, EU, US" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Filed Date</label>
              <Input type="date" value={form.filedDate} onChange={e => set("filedDate", e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Granted Date</label>
              <Input type="date" value={form.grantedDate} onChange={e => set("grantedDate", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Assigned To</label>
            <Input value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)} placeholder="e.g. EcoBlend Materials Ltd" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Notes</label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Prior art summary, claims, protection measures…" rows={3} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.title.trim() || upsert.isPending}
            onClick={() => upsert.mutate({ id: editId, ventureId, ...form })}
            style={{ background: "#3B85BA" }}
          >
            {upsert.isPending ? "Saving…" : editId ? "Save Changes" : "Add Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RndIpTracker() {
  const { selectedVentureId } = useSelectedVenture();
  const [modalOpen, setModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<{ id: number; form: FormState } | null>(null);

  const { data: assets = [], refetch } = trpc.rnd.ipAssets.list.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );

  const { data: vrlFeed } = trpc.rnd.vrlContribution.get.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );

  const deleteAsset = trpc.rnd.ipAssets.delete.useMutation({
    onSuccess: () => { toast.success("IP asset deleted."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const granted = assets.filter(a => a.status === "Granted").length;
  const pending = assets.filter(a => ["Filed", "Provisional", "PCT Filed"].includes(a.status ?? "")).length;
  const secrets = assets.filter(a => a.ipType === "Trade Secret").length;

  const openAdd = () => { setEditAsset(null); setModalOpen(true); };
  const openEdit = (asset: typeof assets[0]) => {
    setEditAsset({
      id: asset.id,
      form: {
        title:        asset.title,
        ipType:       asset.ipType ?? "Patent",
        status:       asset.status ?? "Draft",
        reference:    asset.reference ?? "",
        jurisdiction: asset.jurisdiction ?? "UK",
        filedDate:    asset.filedDate ?? "",
        grantedDate:  asset.grantedDate ?? "",
        assignedTo:   asset.assignedTo ?? "",
        notes:        asset.notes ?? "",
      },
    });
    setModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <ModuleHeader
        icon={<ShieldCheck size={20} />}
        title="IP Tracker"
        purpose="Patents, trade secrets, trademarks and copyrights — with live VRL IP score feed"
        action={<Button size="sm" className="gap-2" style={{ background: "#3B85BA" }} onClick={openAdd}><Plus size={14} /> Add IP Asset</Button>}
      />

      <div className="space-y-6">
        <VentureSelector />

        {!selectedVentureId ? (
          <NoVentureState />
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total IP Assets",   value: assets.length, color: "#3B85BA", Icon: ShieldCheck },
                { label: "Pending / Filed",   value: pending,       color: "#F69111", Icon: AlertTriangle },
                { label: "Granted",           value: granted,       color: "#16a34a", Icon: CheckCircle2 },
                { label: "Trade Secrets",     value: secrets,       color: "#7c3aed", Icon: Lock },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <card.Icon size={14} style={{ color: card.color }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{card.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* VRL IP score feed */}
            {vrlFeed && vrlFeed.assetCount > 0 && (
              <div className="bg-white rounded-xl border p-4 flex items-center gap-6" style={{ borderColor: "#e5e7eb" }}>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">VRL IP Score (computed)</span>
                  <p className="text-2xl font-bold" style={{ color: "#3B85BA" }}>
                    {vrlFeed.ipScore}<span className="text-sm font-normal text-gray-400">/100</span>
                  </p>
                </div>
                <div className="h-10 w-px bg-gray-100" />
                <p className="flex-1 text-xs text-gray-500">
                  Computed from {vrlFeed.assetCount} IP asset{vrlFeed.assetCount !== 1 ? "s" : ""} —
                  {" "}{vrlFeed.breakdown.grantedCount} granted,
                  {" "}{vrlFeed.breakdown.pctFiledCount} PCT filed,
                  {" "}{vrlFeed.breakdown.provisionalCount} provisional.
                  Use as the suggested IP dimension when submitting a VRL assessment.
                </p>
              </div>
            )}

            {/* Asset table */}
            {assets.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck size={32} />}
                title="No IP assets yet"
                description="Add your first IP asset to start building your portfolio. Granted patents and filed IP directly improve your VRL IP dimension score."
                action={<Button size="sm" onClick={openAdd} style={{ background: "#3B85BA" }}><Plus size={14} className="mr-1" /> Add IP Asset</Button>}
              />
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ background: "#fafafa", borderColor: "#f3f4f6" }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Title</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Reference</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jurisdiction</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Filed</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Assigned To</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map(asset => {
                      const tc = typeCfg(asset.ipType ?? "Patent");
                      const sc = statusCfg(asset.status ?? "Draft");
                      const TypeIcon   = tc.icon;
                      const StatusIcon = sc.icon;
                      return (
                        <tr key={asset.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#f3f4f6" }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <TypeIcon size={14} style={{ color: tc.color }} />
                              <span className="font-medium text-gray-900">{asset.title}</span>
                            </div>
                            {asset.notes && (
                              <p className="text-[10px] text-gray-400 mt-0.5 pl-5 max-w-[240px] truncate">{asset.notes}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: tc.color, color: tc.color }}>{tc.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] gap-1" style={{ borderColor: sc.color, color: sc.color, background: sc.bg }}>
                              <StatusIcon size={9} />{sc.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-500">{asset.reference ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{asset.jurisdiction ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{asset.filedDate ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{asset.assignedTo ?? "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(asset)}>
                                <Pencil size={12} />
                              </Button>
                              <Button
                                variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                onClick={() => { if (confirm("Delete this IP asset?")) deleteAsset.mutate({ id: asset.id }); }}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <AssetModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditAsset(null); }}
        ventureId={selectedVentureId ?? ""}
        editId={editAsset?.id}
        initialForm={editAsset?.form ?? EMPTY_FORM}
        onSaved={refetch}
      />
    </div>
  );
}
