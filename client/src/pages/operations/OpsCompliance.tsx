// ============================================================
// Operations — Quality & Compliance  /operations/compliance
// ISO / Certification compliance checklist with expiration trackers
// ============================================================
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
  ShieldCheck, Plus, Pencil, Trash2,
  CheckCircle2, Clock, AlertTriangle, FileText, CalendarX2,
} from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

// ── Constants ─────────────────────────────────────────────────────────────────

const CERT_STATUSES = [
  { value: "not_started", label: "Not Started", color: "#6b7280", bg: "#f3f4f6", Icon: Clock },
  { value: "in_audit",    label: "In Audit",    color: "#3B85BA", bg: "#dbeafe", Icon: AlertTriangle },
  { value: "certified",   label: "Certified",   color: "#16a34a", bg: "#f0fdf4", Icon: CheckCircle2 },
];

// Common ISO / certification templates
const COMMON_CERTS = [
  { name: "ISO 9001:2015",    code: "ISO 9001",   desc: "Quality Management System" },
  { name: "ISO 14001:2015",   code: "ISO 14001",  desc: "Environmental Management" },
  { name: "ISO 45001:2018",   code: "ISO 45001",  desc: "Occupational Health & Safety" },
  { name: "REACH Compliance", code: "REACH",      desc: "EU chemical substance regulation" },
  { name: "RoHS Directive",   code: "RoHS",       desc: "Restriction of Hazardous Substances" },
  { name: "CE Marking",       code: "CE",         desc: "European Conformity" },
  { name: "FSC Certification",code: "FSC",        desc: "Forest Stewardship Council" },
  { name: "B Corp Certification", code: "B Corp", desc: "Social & environmental standards" },
];

const EMPTY_FORM = {
  certificationName:  "",
  standardCode:       "",
  status:             "not_started" as const,
  expiryDate:         "",
  documentEvidenceId: "",
  notes:              "",
};
type FormState = typeof EMPTY_FORM;

function statusCfg(s: string) { return CERT_STATUSES.find(x => x.value === s) ?? CERT_STATUSES[0]; }

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Compliance Modal ──────────────────────────────────────────────────────────

function ComplianceModal({ open, onClose, ventureId, editId, initialForm, onSaved }: {
  open: boolean; onClose: () => void; ventureId: string;
  editId?: number; initialForm: FormState; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [showTemplates, setShowTemplates] = useState(!editId);
  const upsert = trpc.operations.quality.upsert.useMutation({
    onSuccess: () => { toast.success(editId ? "Certification updated." : "Certification added."); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Certification" : "Add Certification"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Quick-pick templates */}
          {!editId && showTemplates && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick-pick common certifications</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {COMMON_CERTS.map(c => (
                  <button
                    key={c.code}
                    className="text-left px-3 py-2 rounded-lg border hover:border-green-400 hover:bg-green-50 transition-colors text-xs"
                    style={{ borderColor: "#e5e7eb" }}
                    onClick={() => {
                      setForm(f => ({ ...f, certificationName: c.name, standardCode: c.code }));
                      setShowTemplates(false);
                    }}
                  >
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    <p className="text-gray-400">{c.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center">or enter custom below</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Certification Name *</label>
            <Input value={form.certificationName} onChange={e => set("certificationName", e.target.value)} placeholder="e.g. ISO 9001:2015" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Standard Code</label>
              <Input value={form.standardCode} onChange={e => set("standardCode", e.target.value)} placeholder="e.g. ISO 9001" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Status *</label>
              <Select value={form.status} onValueChange={v => set("status", v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CERT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Expiry Date</label>
              <Input type="date" value={form.expiryDate} onChange={e => set("expiryDate", e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Evidence ID (Ledger ref.)</label>
              <Input value={form.documentEvidenceId} onChange={e => set("documentEvidenceId", e.target.value)} placeholder="e.g. EV-0031" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Notes</label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Certifying body, audit firm, scope limitations, renewal plan…" rows={2} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.certificationName.trim() || upsert.isPending}
            onClick={() => upsert.mutate({ id: editId, ventureId, ...form })}
            style={{ background: "#56A837" }}
          >
            {upsert.isPending ? "Saving…" : editId ? "Save Changes" : "Add Certification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OpsCompliance() {
  const { selectedVentureId } = useSelectedVenture();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem]   = useState<{ id: number; form: FormState } | null>(null);

  const { data: certs = [], refetch } = trpc.operations.quality.list.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );

  const deleteCert = trpc.operations.quality.delete.useMutation({
    onSuccess: () => { toast.success("Certification deleted."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const certified   = certs.filter(c => c.status === "certified").length;
  const inAudit     = certs.filter(c => c.status === "in_audit").length;
  const notStarted  = certs.filter(c => c.status === "not_started").length;
  const expiringSoon = certs.filter(c => {
    const d = daysUntilExpiry(c.expiryDate);
    return d !== null && d >= 0 && d <= 90;
  }).length;

  const openAdd = () => { setEditItem(null); setModalOpen(true); };
  const openEdit = (c: typeof certs[0]) => {
    setEditItem({ id: c.id, form: {
      certificationName:  c.certificationName,
      standardCode:       c.standardCode ?? "",
      status:             c.status as any,
      expiryDate:         c.expiryDate ? new Date(c.expiryDate).toISOString().split("T")[0] : "",
      documentEvidenceId: c.documentEvidenceId ?? "",
      notes:              c.notes ?? "",
    }});
    setModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <ModuleHeader
        icon={<ShieldCheck size={20} />}
        title="Quality & Compliance"
        purpose="ISO certifications, regulatory compliance, and quality standards — with expiry tracking and evidence ledger links."
        action={<Button size="sm" className="gap-2" style={{ background: "#56A837" }} onClick={openAdd}><Plus size={14} /> Add Certification</Button>}
      />

      <div className="space-y-6">
        <VentureSelector />

        {!selectedVentureId ? <NoVentureState /> : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Certified",       value: certified,   color: "#16a34a", Icon: CheckCircle2 },
                { label: "In Audit",        value: inAudit,     color: "#3B85BA", Icon: AlertTriangle },
                { label: "Not Started",     value: notStarted,  color: "#6b7280", Icon: Clock },
                { label: "Expiring ≤90d",   value: expiringSoon, color: expiringSoon > 0 ? "#dc2626" : "#6b7280", Icon: CalendarX2 },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <c.Icon size={14} style={{ color: c.color }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{c.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Expiry warning */}
            {expiringSoon > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
                <CalendarX2 size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">{expiringSoon} certification{expiringSoon !== 1 ? "s" : ""} expiring within 90 days</p>
                  <p className="text-xs text-red-600 mt-0.5">Schedule renewal audits immediately to avoid a compliance lapse.</p>
                </div>
              </div>
            )}

            {/* Checklist */}
            {certs.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck size={32} />}
                title="No certifications tracked"
                description="Add ISO standards, regulatory certifications, and quality marks. Evidence IDs link directly to the B-03 Evidence Ledger."
                action={<Button size="sm" onClick={openAdd} style={{ background: "#56A837" }}><Plus size={14} className="mr-1" /> Add Certification</Button>}
              />
            ) : (
              <div className="space-y-3">
                {certs.map(c => {
                  const sc = statusCfg(c.status);
                  const days = daysUntilExpiry(c.expiryDate);
                  const expiryWarning = days !== null && days <= 90 && days >= 0;
                  const expired = days !== null && days < 0;
                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-xl border p-4 flex items-start justify-between"
                      style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${sc.color}` }}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: sc.bg, color: sc.color }}>
                          <sc.Icon size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-sm text-gray-900">{c.certificationName}</span>
                            {c.standardCode && <Badge variant="outline" className="text-[10px] font-mono">{c.standardCode}</Badge>}
                            <Badge variant="outline" className="text-[10px] gap-1" style={{ borderColor: sc.color, color: sc.color, background: sc.bg }}>
                              <sc.Icon size={9} />{sc.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-gray-400">
                            {c.expiryDate && (
                              <span className={expiryWarning ? "text-orange-600 font-semibold" : expired ? "text-red-600 font-semibold" : ""}>
                                {expired ? `Expired ${Math.abs(days!)}d ago` : days !== null ? `Expires in ${days}d` : ""}{" "}
                                ({new Date(c.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })})
                              </span>
                            )}
                            {c.documentEvidenceId && (
                              <span className="flex items-center gap-1">
                                <FileText size={10} /> Evidence: {c.documentEvidenceId}
                              </span>
                            )}
                          </div>
                          {c.notes && <p className="text-xs text-gray-500 mt-1">{c.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}><Pencil size={12} /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                          onClick={() => { if (confirm("Delete this certification?")) deleteCert.mutate({ id: c.id }); }}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <ComplianceModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        ventureId={selectedVentureId ?? ""}
        editId={editItem?.id}
        initialForm={editItem?.form ?? EMPTY_FORM}
        onSaved={refetch}
      />
    </div>
  );
}
