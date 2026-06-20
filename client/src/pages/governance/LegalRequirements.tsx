// ============================================================================
// GOVERNANCE — Contract Requirements & Governance Readiness Tracker
// Not legal advice. Labels: "contract requirement", "legal review required",
// "solicitor review status", "risk flag", "readiness status".
// British English throughout.
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileText, AlertTriangle, CheckCircle2, Clock, XCircle, Shield,
  Building2, Database, Users, Heart, FlaskConical, Briefcase,
  Scale, Plus, Pencil, Trash2, RefreshCw, Filter, ChevronDown, ChevronUp,
  AlertCircle, Info, Lock, Globe,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const BUSINESS_LAYERS = [
  { key: "fhv",            label: "FHV / Holding Company",         icon: Building2,   color: "#7c3aed" },
  { key: "ecorace_studio", label: "EcoRACE Studio",                icon: Briefcase,   color: "#3B85BA" },
  { key: "ecoblend_os",    label: "EcoBLEND OS / IO",              icon: Database,    color: "#056CF2" },
  { key: "spv",            label: "SPV Ventures",                   icon: Globe,       color: "#56A837" },
  { key: "rd_partner",     label: "R&D / University / Partner",    icon: FlaskConical,color: "#F69111" },
  { key: "employment",     label: "Employment / Consultants",      icon: Users,       color: "#0891b2" },
  { key: "charity",        label: "Charity / Beneficiary",         icon: Heart,       color: "#ec4899" },
];

const PRIORITY_STAGES = [
  { key: "stage_1", label: "Stage 1 — Minimum Viable Governance",  short: "Stage 1", color: "#dc2626" },
  { key: "stage_2", label: "Stage 2 — Investment Readiness",        short: "Stage 2", color: "#F69111" },
  { key: "stage_3", label: "Stage 3 — SPV Execution",              short: "Stage 3", color: "#3B85BA" },
  { key: "stage_4", label: "Stage 4 — Charity Partnership",        short: "Stage 4", color: "#ec4899" },
  { key: "stage_5", label: "Stage 5 — Mature Mission-Lock",        short: "Stage 5", color: "#7c3aed" },
];

const CONTRACT_STATUSES = [
  { value: "not_started",   label: "Not Started",    color: "#9ca3af" },
  { value: "draft_required",label: "Draft Required", color: "#6b7280" },
  { value: "with_solicitor",label: "With Solicitor", color: "#3B85BA" },
  { value: "under_review",  label: "Under Review",   color: "#F69111" },
  { value: "approved",      label: "Approved",       color: "#0891b2" },
  { value: "signed",        label: "Signed",         color: "#56A837" },
  { value: "active",        label: "Active",         color: "#16a34a" },
  { value: "renewal_due",   label: "Renewal Due",    color: "#d97706" },
  { value: "expired",       label: "Expired",        color: "#ef4444" },
  { value: "superseded",    label: "Superseded",     color: "#6b7280" },
];

const RISK_RATINGS = [
  { value: "low",      label: "Low",      color: "#56A837" },
  { value: "medium",   label: "Medium",   color: "#F69111" },
  { value: "high",     label: "High",     color: "#dc2626" },
  { value: "critical", label: "Critical", color: "#7f1d1d" },
];

const ALERT_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  missing_required:                  { label: "Missing Required",          color: "#dc2626", bg: "#fef2f2" },
  overdue_review:                    { label: "Overdue Review",            color: "#d97706", bg: "#fffbeb" },
  expiry_soon:                       { label: "Expiry Within 90 Days",     color: "#F69111", bg: "#fff7ed" },
  charity_board_approval_missing:    { label: "Charity Board Approval",    color: "#7f1d1d", bg: "#fef2f2" },
  charity_logo_permission_missing:   { label: "Logo Permission Missing",   color: "#7f1d1d", bg: "#fef2f2" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function layerCfg(key: string) {
  return BUSINESS_LAYERS.find((l) => l.key === key) ?? BUSINESS_LAYERS[0];
}
function stageCfg(key: string) {
  return PRIORITY_STAGES.find((s) => s.key === key) ?? PRIORITY_STAGES[0];
}
function statusCfg(val: string) {
  return CONTRACT_STATUSES.find((s) => s.value === val) ?? CONTRACT_STATUSES[0];
}
function riskCfg(val: string) {
  return RISK_RATINGS.find((r) => r.value === val) ?? RISK_RATINGS[1];
}

function RiskBadge({ rating }: { rating: string }) {
  const cfg = riskCfg(rating);
  return (
    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
      style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusCfg(status);
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ color: cfg.color, background: `${cfg.color}18` }}>
      {cfg.label}
    </span>
  );
}

function StageChip({ stage }: { stage: string }) {
  const cfg = stageCfg(stage);
  return (
    <span className="inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ color: cfg.color, background: `${cfg.color}18` }}>
      {cfg.short}
    </span>
  );
}

type Req  = Record<string, any>;
type Rec  = Record<string, any>;
type CP   = Record<string, any>;

// ── Record Edit Modal ─────────────────────────────────────────────────────────
function RecordModal({
  open, onClose, req, existing, onSaved,
}: { open: boolean; onClose: () => void; req: Req; existing?: Rec; onSaved: () => void }) {
  const isEdit = !!existing?.id;
  const [form, setForm] = useState<Record<string, any>>(existing ?? {
    requirementId: req.id, status: "not_started", riskRating: req.defaultRiskRating ?? "medium",
    entityName: "", owner: "", legalAdviser: "", counterpartyName: "", approvalAuthority: "",
    solicitorReviewStatus: "", notes: "", nextAction: "", documentUrl: "",
    executionDate: "", renewalDate: "", expiryDate: "", reviewDate: "",
    reservedMatterTrigger: false,
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const utils = trpc.useUtils();

  const upsert = trpc.legalRequirements.records.upsert.useMutation({
    onSuccess: () => {
      utils.legalRequirements.records.list.invalidate();
      utils.legalRequirements.alerts.invalidate();
      utils.legalRequirements.stats.invalidate();
      toast.success(isEdit ? "Record updated" : "Record created");
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    upsert.mutate({
      id:                    isEdit ? existing!.id : undefined,
      requirementId:         req.id,
      entityName:            form.entityName || undefined,
      owner:                 form.owner || undefined,
      legalAdviser:          form.legalAdviser || undefined,
      counterpartyName:      form.counterpartyName || undefined,
      approvalAuthority:     form.approvalAuthority || undefined,
      status:                form.status,
      riskRating:            form.riskRating,
      solicitorReviewStatus: form.solicitorReviewStatus || undefined,
      notes:                 form.notes || undefined,
      nextAction:            form.nextAction || undefined,
      documentUrl:           form.documentUrl || undefined,
      executionDate:         form.executionDate || undefined,
      renewalDate:           form.renewalDate || undefined,
      expiryDate:            form.expiryDate || undefined,
      reviewDate:            form.reviewDate || undefined,
      reservedMatterTrigger: Boolean(form.reservedMatterTrigger),
    });
  };

  const lyr = layerCfg(req.businessLayer);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: lyr.color }} />
            {isEdit ? "Edit Record — " : "Create Record — "}{req.name}
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1 italic">
            This is a tracking record only. Solicitor review is required for all legal documents listed here.
          </p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTRACT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-sm">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Risk Rating</label>
              <Select value={form.riskRating} onValueChange={(v) => set("riskRating", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RISK_RATINGS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-sm">{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Entity / Company</label>
              <Input value={form.entityName} onChange={(e) => set("entityName", e.target.value)} placeholder="e.g. FHV Ltd" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Owner</label>
              <Input value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="e.g. Brian" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Legal Adviser</label>
              <Input value={form.legalAdviser} onChange={(e) => set("legalAdviser", e.target.value)} placeholder="e.g. Solicitor firm name" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Counterparty</label>
              <Input value={form.counterpartyName} onChange={(e) => set("counterpartyName", e.target.value)} placeholder="e.g. Investor / Partner name" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Approval Authority</label>
              <Input value={form.approvalAuthority} onChange={(e) => set("approvalAuthority", e.target.value)} placeholder="e.g. FHV Board" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Solicitor Review Status</label>
              <Input value={form.solicitorReviewStatus} onChange={(e) => set("solicitorReviewStatus", e.target.value)} placeholder="e.g. Awaiting first draft" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Execution Date</label>
              <Input type="date" value={form.executionDate} onChange={(e) => set("executionDate", e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Expiry Date</label>
              <Input type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Renewal Date</label>
              <Input type="date" value={form.renewalDate} onChange={(e) => set("renewalDate", e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Next Review Date</label>
              <Input type="date" value={form.reviewDate} onChange={(e) => set("reviewDate", e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Document URL / Location</label>
            <Input value={form.documentUrl} onChange={(e) => set("documentUrl", e.target.value)} placeholder="e.g. Google Drive link or file reference" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Next Action</label>
            <Input value={form.nextAction} onChange={(e) => set("nextAction", e.target.value)} placeholder="e.g. Send draft to solicitor by 30 June" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="text-sm resize-none" placeholder="Internal notes, context, or risk flags…" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={Boolean(form.reservedMatterTrigger)} onChange={(e) => set("reservedMatterTrigger", e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-xs font-semibold text-gray-600">Reserved matter trigger (requires board approval)</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={upsert.isPending} style={{ background: "#56A837", color: "#fff" }}>
            {upsert.isPending ? "Saving…" : isEdit ? "Update Record" : "Create Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Requirement Row ───────────────────────────────────────────────────────────
function RequirementRow({
  req, records, onAddRecord, onEditRecord, onDeleteRecord,
}: { req: Req; records: Rec[]; onAddRecord: (req: Req) => void; onEditRecord: (req: Req, rec: Rec) => void; onDeleteRecord: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const lyr = layerCfg(req.businessLayer);
  const risk = riskCfg(req.defaultRiskRating);
  const hasRecords = records.length > 0;
  const activeRec = records.find((r) => ["signed", "active", "approved", "under_review", "with_solicitor", "draft_required"].includes(r.status));

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ borderLeft: `3px solid ${lyr.color}` }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 leading-snug">{req.name}</span>
            {req.required && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded" style={{ color: "#dc2626", background: "#fef2f2" }}>Required</span>
            )}
            {req.missionLockRelevance && <Lock size={10} className="text-purple-500 flex-shrink-0" title="Mission-lock relevance" />}
            {req.ipRelevance && <Shield size={10} className="text-blue-500 flex-shrink-0" title="IP relevance" />}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StageChip stage={req.priorityStage} />
            <RiskBadge rating={req.defaultRiskRating} />
            {activeRec ? (
              <StatusBadge status={activeRec.status} />
            ) : (
              <span className="text-[10px] text-gray-400 italic">No record</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onAddRecord(req); }}
            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
          >
            <Plus size={12} /> {hasRecords ? "Add" : "Create record"}
          </button>
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="bg-gray-50 border-t px-4 py-3 space-y-3" style={{ borderColor: "#f3f4f6" }}>
          <p className="text-xs text-gray-500 leading-relaxed">{req.description}</p>
          <div className="flex gap-4 flex-wrap text-xs text-gray-500">
            <span><strong>Category:</strong> {req.categoryLabel}</span>
            <span><strong>Layer:</strong> {lyr.label}</span>
            {req.dataRelevance && <span className="text-teal-600">● Data / GDPR</span>}
            {req.seisEisRelevance && <span className="text-amber-600">● SEIS / EIS</span>}
            {req.charityRelevance && <span className="text-pink-600">● Charity</span>}
          </div>
          {records.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking Records</p>
              {records.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 bg-white rounded-lg border px-3 py-2" style={{ borderColor: "#e5e7eb" }}>
                  <StatusBadge status={rec.status} />
                  {rec.entityName && <span className="text-xs text-gray-600">{rec.entityName}</span>}
                  {rec.owner && <span className="text-xs text-gray-400">Owner: {rec.owner}</span>}
                  {rec.nextAction && <span className="text-xs text-gray-400 flex-1 truncate italic">{rec.nextAction}</span>}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => onEditRecord(req, rec)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Pencil size={11} /></button>
                    <button onClick={() => onDeleteRecord(rec.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Charity Partner Modal ─────────────────────────────────────────────────────
function CharityModal({
  open, onClose, existing, onSaved,
}: { open: boolean; onClose: () => void; existing?: CP; onSaved: () => void }) {
  const isEdit = !!existing?.id;
  const [form, setForm] = useState<Record<string, any>>(existing ?? {
    charityName: "", charityRegistrationNumber: "", contactName: "", contactEmail: "",
    partnershipStatus: "prospective", donationFormula: "", profitDefinition: "",
    boardApprovalStatus: "not_started", logoPermissionStatus: "not_granted",
    publicClaimApprovalStatus: "not_approved", impactReportingStatus: "not_started",
    nextReviewDate: "", notes: "",
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const utils = trpc.useUtils();

  const upsert = trpc.legalRequirements.charity.upsert.useMutation({
    onSuccess: () => {
      utils.legalRequirements.charity.list.invalidate();
      utils.legalRequirements.alerts.invalidate();
      toast.success(isEdit ? "Partner updated" : "Partner added");
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!form.charityName.trim()) { toast.error("Charity name is required"); return; }
    upsert.mutate({
      id:                        isEdit ? existing!.id : undefined,
      charityName:               form.charityName,
      charityRegistrationNumber: form.charityRegistrationNumber || undefined,
      contactName:               form.contactName || undefined,
      contactEmail:              form.contactEmail || undefined,
      partnershipStatus:         form.partnershipStatus,
      donationFormula:           form.donationFormula || undefined,
      profitDefinition:          form.profitDefinition || undefined,
      boardApprovalStatus:       form.boardApprovalStatus,
      logoPermissionStatus:      form.logoPermissionStatus,
      publicClaimApprovalStatus: form.publicClaimApprovalStatus,
      impactReportingStatus:     form.impactReportingStatus,
      nextReviewDate:            form.nextReviewDate || undefined,
      notes:                     form.notes || undefined,
    });
  };

  const statusOpts = (opts: string[]) => opts.map((v) => ({ value: v, label: v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart size={16} className="text-pink-500" />
            {isEdit ? "Edit Charity Partner" : "Add Charity Partner"}
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1 italic">Legal review required before making any public charitable claims or using a charity's name / logo.</p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Charity Name *</label>
              <Input value={form.charityName} onChange={(e) => set("charityName", e.target.value)} placeholder="e.g. Challengers" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Registration Number</label>
              <Input value={form.charityRegistrationNumber} onChange={(e) => set("charityRegistrationNumber", e.target.value)} placeholder="e.g. 1234567" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Contact Name</label>
              <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Contact Email</label>
              <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Partnership Status</label>
            <Select value={form.partnershipStatus} onValueChange={(v) => set("partnershipStatus", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOpts(["prospective","in_negotiation","active","lapsed"]).map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Donation Formula</label>
            <Textarea value={form.donationFormula} onChange={(e) => set("donationFormula", e.target.value)} rows={2} className="text-sm resize-none" placeholder="e.g. 5% of annual distributable profit as defined in the Profit Definition Schedule" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Profit Definition</label>
            <Textarea value={form.profitDefinition} onChange={(e) => set("profitDefinition", e.target.value)} rows={2} className="text-sm resize-none" placeholder="e.g. Post-tax profit before charitable distributions, as reviewed by auditors" />
          </div>
          <div className="border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Approval & Permission Status</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "boardApprovalStatus",       label: "Board Approval Status",       opts: ["not_started","in_progress","approved","rejected"] },
                { key: "logoPermissionStatus",       label: "Logo / Name Permission",      opts: ["not_granted","requested","granted","expired"] },
                { key: "publicClaimApprovalStatus",  label: "Public Claim Approval",       opts: ["not_approved","under_review","approved","withdrawn"] },
                { key: "impactReportingStatus",      label: "Impact Reporting Status",     opts: ["not_started","in_progress","submitted","published"] },
              ].map(({ key, label, opts }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
                  <Select value={form[key]} onValueChange={(v) => set(key, v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOpts(opts).map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Next Review Date</label>
              <Input type="date" value={form.nextReviewDate} onChange={(e) => set("nextReviewDate", e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="text-sm resize-none" placeholder="Internal notes…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={upsert.isPending} style={{ background: "#ec4899", color: "#fff" }}>
            {upsert.isPending ? "Saving…" : isEdit ? "Update Partner" : "Add Partner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ stats, alerts, onSeed }: { stats: any; alerts: any[]; onSeed: () => void }) {
  const seeded = (stats?.totalRequired ?? 0) > 0;
  const critical = alerts.filter((a) => a.severity === "critical");
  const high = alerts.filter((a) => a.severity === "high");
  const med = alerts.filter((a) => a.severity === "medium");

  return (
    <div className="space-y-6">
      {!seeded && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Contract taxonomy not yet seeded</p>
            <p className="text-xs text-amber-700 mt-0.5">Click the button to load the 71-requirement taxonomy across 7 business layers.</p>
          </div>
          <Button onClick={onSeed} size="sm" className="flex-shrink-0" style={{ background: "#F69111", color: "#fff" }}>
            <RefreshCw size={13} className="mr-1" /> Seed Taxonomy
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Required Contracts",    value: stats?.totalRequired ?? 0,    color: "#3B85BA", icon: FileText },
          { label: "Signed / Active",       value: stats?.completedCount ?? 0,   color: "#56A837", icon: CheckCircle2 },
          { label: "Missing Critical",      value: stats?.missingCritical ?? 0,  color: "#dc2626", icon: XCircle },
          { label: "Overdue Reviews",       value: stats?.overdueReviews ?? 0,   color: "#d97706", icon: Clock },
          { label: "Expiring (90 days)",    value: stats?.upcomingRenewals ?? 0, color: "#F69111", icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "#e5e7eb" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts panel */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "#f3f4f6", background: "#fef2f2" }}>
            <AlertCircle size={15} className="text-red-500" />
            <span className="text-sm font-semibold text-red-800">{alerts.length} active alert{alerts.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y" style={{ borderColor: "#f9fafb" }}>
            {[...critical, ...high, ...med].slice(0, 15).map((a, i) => {
              const at = ALERT_TYPES[a.type] ?? { label: a.type, color: "#6b7280", bg: "#f9fafb" };
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0" style={{ color: at.color, background: at.bg }}>{at.label}</span>
                  <span className="text-xs text-gray-700">{a.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* By stage */}
      {(stats?.byStage ?? []).length > 0 && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Readiness by Priority Stage</p>
          <div className="space-y-3">
            {PRIORITY_STAGES.map((s) => {
              const d = (stats?.byStage ?? []).find((b: any) => b.stage === s.key);
              const pct = d?.total > 0 ? Math.round((d.signed / d.total) * 100) : 0;
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                    <span className="text-xs text-gray-400">{d?.signed ?? 0} / {d?.total ?? 0} signed</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* By layer */}
      {(stats?.byLayer ?? []).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BUSINESS_LAYERS.map((l) => {
            const d = (stats?.byLayer ?? []).find((b: any) => b.layer === l.key);
            const pct = d?.total > 0 ? Math.round((d.signed / d.total) * 100) : 0;
            const Icon = l.icon;
            return (
              <div key={l.key} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb", borderTop: `3px solid ${l.color}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={14} style={{ color: l.color }} />
                  <span className="text-xs font-semibold text-gray-700">{l.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{pct}%</p>
                <p className="text-xs text-gray-400">{d?.signed ?? 0} / {d?.total ?? 0} signed</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Register Tab ──────────────────────────────────────────────────────────────
function RegisterTab({
  reqs, records, onAddRecord, onEditRecord, onDeleteRecord,
}: { reqs: Req[]; records: Rec[]; onAddRecord: (req: Req) => void; onEditRecord: (req: Req, rec: Rec) => void; onDeleteRecord: (id: number) => void }) {
  const [filterLayer, setFilterLayer]   = useState("");
  const [filterStage, setFilterStage]   = useState("");
  const [filterRisk, setFilterRisk]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const recordMap = new Map<number, Rec[]>();
  for (const r of records) {
    if (!r.requirementId) continue;
    if (!recordMap.has(r.requirementId)) recordMap.set(r.requirementId, []);
    recordMap.get(r.requirementId)!.push(r);
  }

  const filtered = reqs.filter((r) => {
    if (filterLayer && r.businessLayer !== filterLayer) return false;
    if (filterStage && r.priorityStage !== filterStage) return false;
    if (filterRisk && r.defaultRiskRating !== filterRisk) return false;
    if (filterStatus) {
      const recs = recordMap.get(r.id) ?? [];
      const hasStatus = recs.some((rec) => rec.status === filterStatus);
      if (filterStatus === "not_started" && recs.length === 0) return true;
      if (!hasStatus) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !r.categoryLabel?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center" style={{ borderColor: "#e5e7eb" }}>
        <Filter size={14} className="text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contract requirements…" className="h-8 text-sm w-52" />
        <Select value={filterLayer || "__all__"} onValueChange={(v) => setFilterLayer(v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="All layers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All layers</SelectItem>
            {BUSINESS_LAYERS.map((l) => <SelectItem key={l.key} value={l.key} className="text-xs">{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStage || "__all__"} onValueChange={(v) => setFilterStage(v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All stages</SelectItem>
            {PRIORITY_STAGES.map((s) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.short}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRisk || "__all__"} onValueChange={(v) => setFilterRisk(v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="All risks" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All risks</SelectItem>
            {RISK_RATINGS.map((r) => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterLayer || filterStage || filterRisk || filterStatus || search) && (
          <button onClick={() => { setFilterLayer(""); setFilterStage(""); setFilterRisk(""); setFilterStatus(""); setSearch(""); }}
            className="text-xs text-gray-400 hover:text-gray-700 underline">Clear filters</button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} requirements</span>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400" style={{ borderColor: "#e5e7eb" }}>
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No requirements match the current filters.</p>
          </div>
        ) : (
          filtered.map((req) => (
            <RequirementRow
              key={req.id}
              req={req}
              records={recordMap.get(req.id) ?? []}
              onAddRecord={onAddRecord}
              onEditRecord={onEditRecord}
              onDeleteRecord={onDeleteRecord}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Roadmap Tab ───────────────────────────────────────────────────────────────
function RoadmapTab({ reqs, records }: { reqs: Req[]; records: Rec[] }) {
  const [openStage, setOpenStage] = useState<string>("stage_1");
  const recordMap = new Map<number, Rec[]>();
  for (const r of records) {
    if (!r.requirementId) continue;
    if (!recordMap.has(r.requirementId)) recordMap.set(r.requirementId, []);
    recordMap.get(r.requirementId)!.push(r);
  }

  const stageDescriptions: Record<string, string> = {
    stage_1: "Required immediately to establish the legal foundation, protect IP, and lock mission before any external engagement.",
    stage_2: "Required before engaging investors, issuing financial promotions, or opening the data room.",
    stage_3: "Required before each SPV fundraise, covering articles, agreements, IP licences, SEIS/EIS documentation, and mission covenant.",
    stage_4: "Required before making any public charitable claims, using charity logos/names, or reporting on beneficiary donations.",
    stage_5: "Required once meaningful assets, revenue, and investors are in place to establish mature steward-style mission governance.",
  };

  return (
    <div className="space-y-3">
      {PRIORITY_STAGES.map((s) => {
        const stageReqs = reqs.filter((r) => r.priorityStage === s.key);
        const signed = stageReqs.filter((r) => (recordMap.get(r.id) ?? []).some((rec) => ["signed", "active"].includes(rec.status))).length;
        const pct = stageReqs.length > 0 ? Math.round((signed / stageReqs.length) * 100) : 0;
        const isOpen = openStage === s.key;

        return (
          <div key={s.key} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            <div
              className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
              style={{ borderLeft: `4px solid ${s.color}` }}
              onClick={() => setOpenStage(isOpen ? "" : s.key)}
            >
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stageDescriptions[s.key]}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-400">{signed} / {stageReqs.length} signed</span>
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color: s.color }}>{pct}%</span>
                {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </div>
            </div>

            {isOpen && (
              <div className="border-t px-5 py-4 space-y-2" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
                {stageReqs.map((req) => {
                  const recs = recordMap.get(req.id) ?? [];
                  const activeRec = recs.find((r) => !["expired", "superseded"].includes(r.status));
                  const lyr = layerCfg(req.businessLayer);
                  return (
                    <div key={req.id} className="flex items-center gap-3 py-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: lyr.color }} />
                      <span className="text-sm text-gray-800 flex-1">{req.name}</span>
                      <RiskBadge rating={req.defaultRiskRating} />
                      {activeRec ? (
                        <StatusBadge status={activeRec.status} />
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">No record</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Business Layers Tab ───────────────────────────────────────────────────────
function LayersTab({ reqs, records, onAddRecord, onEditRecord, onDeleteRecord }: { reqs: Req[]; records: Rec[]; onAddRecord: (req: Req) => void; onEditRecord: (req: Req, rec: Rec) => void; onDeleteRecord: (id: number) => void }) {
  const [openLayer, setOpenLayer] = useState<string>("fhv");
  const recordMap = new Map<number, Rec[]>();
  for (const r of records) {
    if (!r.requirementId) continue;
    if (!recordMap.has(r.requirementId)) recordMap.set(r.requirementId, []);
    recordMap.get(r.requirementId)!.push(r);
  }

  return (
    <div className="space-y-3">
      {BUSINESS_LAYERS.map((l) => {
        const layerReqs = reqs.filter((r) => r.businessLayer === l.key);
        const signed = layerReqs.filter((r) => (recordMap.get(r.id) ?? []).some((rec) => ["signed", "active"].includes(rec.status))).length;
        const pct = layerReqs.length > 0 ? Math.round((signed / layerReqs.length) * 100) : 0;
        const isOpen = openLayer === l.key;
        const Icon = l.icon;

        return (
          <div key={l.key} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            <div
              className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
              style={{ borderLeft: `4px solid ${l.color}` }}
              onClick={() => setOpenLayer(isOpen ? "" : l.key)}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${l.color}15` }}>
                <Icon size={16} style={{ color: l.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{l.label}</p>
                <p className="text-xs text-gray-500">{layerReqs.length} contract requirements · {signed} signed</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: l.color }} />
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color: l.color }}>{pct}%</span>
                {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </div>
            </div>

            {isOpen && (
              <div className="border-t px-5 py-4 space-y-2" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
                {layerReqs.map((req) => (
                  <RequirementRow
                    key={req.id}
                    req={req}
                    records={recordMap.get(req.id) ?? []}
                    onAddRecord={onAddRecord}
                    onEditRecord={onEditRecord}
                    onDeleteRecord={onDeleteRecord}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Charity Engagement Tab ────────────────────────────────────────────────────
function CharityTab({ charities, onAdd, onEdit, onDelete }: { charities: CP[]; onAdd: () => void; onEdit: (cp: CP) => void; onDelete: (id: number) => void }) {
  const approvalColor = (s: string) => s === "approved" || s === "granted" ? "#56A837" : s === "not_started" || s === "not_granted" ? "#9ca3af" : "#F69111";
  const approvalLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2 flex-1">
          <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">Legal review required before making any public charitable claims or using a charity's logo or name. Board approval and logo / name permission must both be recorded as approved before public claims are permitted.</p>
        </div>
        <Button onClick={onAdd} style={{ background: "#ec4899", color: "#fff" }} className="flex-shrink-0 gap-1.5">
          <Plus size={14} /> Add Partner
        </Button>
      </div>

      {charities.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400" style={{ borderColor: "#e5e7eb" }}>
          <Heart size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No charity partners recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {charities.map((cp) => {
            const isBlocked = cp.publicClaimApprovalStatus !== "approved" && (cp.boardApprovalStatus !== "approved" || cp.logoPermissionStatus !== "granted");
            return (
              <div key={cp.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: isBlocked ? "#fca5a5" : "#e5e7eb", borderLeft: "4px solid #ec4899" }}>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{cp.charityName}</h3>
                      {cp.charityRegistrationNumber && <p className="text-xs text-gray-400">Reg. {cp.charityRegistrationNumber}</p>}
                      {cp.contactName && <p className="text-xs text-gray-500 mt-0.5">{cp.contactName}{cp.contactEmail && ` · ${cp.contactEmail}`}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => onEdit(cp)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Pencil size={13} /></button>
                      <button onClick={() => onDelete(cp.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {isBlocked && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                      <XCircle size={13} className="text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-700 font-semibold">Public claims blocked — board approval or logo permission not yet recorded as approved.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: "boardApprovalStatus",       label: "Board Approval" },
                      { key: "logoPermissionStatus",       label: "Logo / Name Permission" },
                      { key: "publicClaimApprovalStatus",  label: "Public Claim" },
                      { key: "impactReportingStatus",      label: "Impact Reporting" },
                    ].map(({ key, label }) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                        <span className="text-xs font-semibold" style={{ color: approvalColor(cp[key] ?? "") }}>
                          {approvalLabel(cp[key] ?? "unknown")}
                        </span>
                      </div>
                    ))}
                  </div>

                  {cp.donationFormula && (
                    <div className="mt-3 pt-3 border-t text-xs text-gray-600" style={{ borderColor: "#f3f4f6" }}>
                      <span className="font-semibold text-gray-500">Donation formula: </span>{cp.donationFormula}
                    </div>
                  )}
                  {cp.notes && (
                    <p className="mt-2 text-xs text-gray-400 italic">{cp.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type TabKey = "dashboard" | "register" | "roadmap" | "layers" | "charity";

export default function LegalRequirements() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [recordModal, setRecordModal] = useState<{ req: Req; rec?: Rec } | null>(null);
  const [charityModal, setCharityModal] = useState<{ cp?: CP } | null>(null);

  const utils = trpc.useUtils();

  const reqsQ    = trpc.legalRequirements.requirements.list.useQuery();
  const recordsQ = trpc.legalRequirements.records.list.useQuery();
  const charityQ = trpc.legalRequirements.charity.list.useQuery();
  const alertsQ  = trpc.legalRequirements.alerts.useQuery();
  const statsQ   = trpc.legalRequirements.stats.useQuery();

  const seedMutation = trpc.legalRequirements.requirements.seed.useMutation({
    onSuccess: (res) => {
      utils.legalRequirements.requirements.list.invalidate();
      utils.legalRequirements.stats.invalidate();
      utils.legalRequirements.alerts.invalidate();
      toast.success(res.seeded ? `Taxonomy seeded — ${res.count} requirements loaded` : "Taxonomy already seeded");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteRecord = trpc.legalRequirements.records.delete.useMutation({
    onSuccess: () => {
      utils.legalRequirements.records.list.invalidate();
      utils.legalRequirements.stats.invalidate();
      utils.legalRequirements.alerts.invalidate();
      toast.success("Record deleted");
    },
  });

  const deleteCharity = trpc.legalRequirements.charity.delete.useMutation({
    onSuccess: () => {
      utils.legalRequirements.charity.list.invalidate();
      utils.legalRequirements.alerts.invalidate();
      toast.success("Partner removed");
    },
  });

  const reqs     = reqsQ.data ?? [];
  const records  = recordsQ.data ?? [];
  const charities = charityQ.data ?? [];
  const alerts   = alertsQ.data ?? [];
  const stats    = statsQ.data;

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: "dashboard", label: "Dashboard",          icon: Scale },
    { key: "register",  label: "Contract Register",  icon: FileText },
    { key: "roadmap",   label: "Priority Roadmap",   icon: CheckCircle2 },
    { key: "layers",    label: "Business Layers",    icon: Building2 },
    { key: "charity",   label: "Charity Engagement", icon: Heart },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Scale size={18} style={{ color: "#7c3aed" }} />
            <span className="text-xs font-semibold uppercase tracking-widest text-purple-600">Governance · Contract Requirements</span>
          </div>
          {alerts.filter((a) => a.severity === "critical").length > 0 && (
            <Badge className="text-xs px-3 py-1" style={{ background: "#fef2f2", color: "#dc2626", border: "none" }}>
              {alerts.filter((a) => a.severity === "critical").length} critical alerts
            </Badge>
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
          Contract Requirements & Governance Readiness
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Contract requirement tracker across 7 business layers and 5 priority stages.
          This is a governance readiness tool — solicitor review is required for all legal documents.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: activeTab === tab.key ? "white" : "transparent",
                color: activeTab === tab.key ? "#1a2332" : "#6b7280",
                boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.key === "charity" && charities.filter((c) => c.publicClaimApprovalStatus !== "approved" && (c.boardApprovalStatus !== "approved" || c.logoPermissionStatus !== "granted")).length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {activeTab === "dashboard" && (
          <DashboardTab
            stats={stats}
            alerts={alerts}
            onSeed={() => seedMutation.mutate()}
          />
        )}
        {activeTab === "register" && (
          <RegisterTab
            reqs={reqs}
            records={records}
            onAddRecord={(req) => setRecordModal({ req })}
            onEditRecord={(req, rec) => setRecordModal({ req, rec })}
            onDeleteRecord={(id) => deleteRecord.mutate({ id })}
          />
        )}
        {activeTab === "roadmap" && (
          <RoadmapTab reqs={reqs} records={records} />
        )}
        {activeTab === "layers" && (
          <LayersTab
            reqs={reqs}
            records={records}
            onAddRecord={(req) => setRecordModal({ req })}
            onEditRecord={(req, rec) => setRecordModal({ req, rec })}
            onDeleteRecord={(id) => deleteRecord.mutate({ id })}
          />
        )}
        {activeTab === "charity" && (
          <CharityTab
            charities={charities}
            onAdd={() => setCharityModal({})}
            onEdit={(cp) => setCharityModal({ cp })}
            onDelete={(id) => deleteCharity.mutate({ id })}
          />
        )}
      </div>

      {/* Record modal */}
      {recordModal && (
        <RecordModal
          open={true}
          onClose={() => setRecordModal(null)}
          req={recordModal.req}
          existing={recordModal.rec}
          onSaved={() => setRecordModal(null)}
        />
      )}

      {/* Charity modal */}
      {charityModal !== null && (
        <CharityModal
          open={true}
          onClose={() => setCharityModal(null)}
          existing={charityModal.cp}
          onSaved={() => setCharityModal(null)}
        />
      )}
    </div>
  );
}
