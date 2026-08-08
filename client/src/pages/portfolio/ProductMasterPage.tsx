/**
 * Phase 4 — Product Master Page
 * Full product detail: provenance chain, variants, part numbers, traceability.
 * Route: /portfolio/products/:productRef
 */
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Package, Layers, ArrowLeft, ExternalLink, Plus, ChevronRight,
  Tag, Settings, Building2, GitBranch, ShieldCheck, Clock, CheckCircle2,
} from "lucide-react";

// ── Brand accent ──────────────────────────────────────────────────────────────
const BRAND_ACCENT: Record<string, string> = {
  TONE: "#56A837", REAL: "#3B85BA", BEBUS: "#F69111", ECOCOMP: "#8B5CF6",
};

const LIFECYCLE_STYLE: Record<string, string> = {
  Concept: "bg-gray-100 text-gray-600", Prototype: "bg-blue-100 text-blue-800",
  Pilot: "bg-purple-100 text-purple-800", Commercial: "bg-green-100 text-green-800",
  Mature: "bg-teal-100 text-teal-800", End_of_Life: "bg-amber-100 text-amber-800",
  Discontinued: "bg-red-100 text-red-700",
};

const PN_STATUS_STYLE: Record<string, string> = {
  active:      "bg-green-100 text-green-800",
  superseded:  "bg-amber-100 text-amber-800",
  cancelled:   "bg-red-100 text-red-700",
  reserved:    "bg-blue-100 text-blue-800",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="py-2.5 border-b last:border-0" style={{ borderColor: "#f0f0f0" }}>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-700">{value}</dd>
    </div>
  );
}

function ProvenanceChain({ trace, accent }: { trace: any; accent: string }) {
  const steps = [
    { label: "DOMAIN BRAND", name: trace.brand?.brandCode, sub: trace.brand?.brandName, color: accent },
    { label: "PROGRAMME",    name: trace.programme?.programmeRef, sub: trace.programme?.programmeName, color: "#8B5CF6" },
    { label: "PRODUCT FAMILY", name: trace.family?.familyCode, sub: trace.family?.familyName, color: "#3B85BA" },
    { label: "PRODUCT",      name: trace.product?.productRef, sub: trace.product?.productName, color: "#F69111" },
  ].filter(s => s.name);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: step.color }}>{step.label}</span>
            <span className="text-xs font-semibold text-gray-800 font-mono">{step.name}</span>
            {step.sub && <span className="text-[10px] text-gray-400">{step.sub}</span>}
          </div>
          {i < steps.length - 1 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
        </div>
      ))}
      {trace.venture && (
        <>
          <ChevronRight size={12} className="text-gray-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "#56A837" }}>SOURCE VENTURE</span>
            <span className="text-xs font-semibold text-gray-800">{trace.venture.ventureRef ?? trace.venture.name}</span>
            {trace.venture.candidateStatus && (
              <Badge variant="outline" className="text-[8px] px-1 py-0 self-start mt-0.5 bg-green-50 text-green-700 border-green-200">
                {trace.venture.candidateStatus?.replace(/_/g," ")}
              </Badge>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Issue Part Number Dialog ──────────────────────────────────────────────────

function IssuePartNumberDialog({ open, onClose, productId, familyId, variants, accent, utils }: {
  open: boolean; onClose: () => void;
  productId: number; familyId?: number; variants: any[]; accent: string;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [form, setForm] = useState({ productVariantId: "none", issuedBy: "", notes: "" });

  const issue = trpc.partNumbers.issue.useMutation({
    onSuccess: (pn) => {
      toast.success(`Part Number ${pn.partNumber} issued`);
      utils.partNumbers.listForProduct.invalidate();
      utils.partNumbers.listAll.invalidate();
      onClose();
      setForm({ productVariantId: "none", issuedBy: "", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!familyId) return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Cannot Issue Part Number</DialogTitle></DialogHeader>
        <p className="text-sm text-gray-600 py-2">This product has no Product Family, so no Part Number Config can be found. Assign the product to a family first.</p>
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Tag size={16} style={{ color: accent }} /> Issue Part Number</DialogTitle>
          <p className="text-xs text-gray-500 mt-1">Issues the next sequential part number from the family config. DB UNIQUE constraint prevents collisions.</p>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {variants.length > 0 && (
            <div>
              <Label className="text-xs font-medium">Product Variant (optional)</Label>
              <Select value={form.productVariantId} onValueChange={v => setForm(f => ({ ...f, productVariantId: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="No variant" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No specific variant —</SelectItem>
                  {variants.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.variantCode ? `${v.variantCode} — ` : ""}{v.variantName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs font-medium">Issued By</Label>
            <Input value={form.issuedBy} onChange={e => setForm(f => ({ ...f, issuedBy: e.target.value }))} className="mt-1" placeholder="Name or team" />
          </div>
          <div>
            <Label className="text-xs font-medium">Notes</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" placeholder="Optional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={issue.isPending}
            onClick={() => issue.mutate({ productId, familyId, productVariantId: form.productVariantId !== "none" ? parseInt(form.productVariantId) : undefined, issuedBy: form.issuedBy || undefined, notes: form.notes || undefined })}
            style={{ background: accent, color: "#fff" }}>
            {issue.isPending ? "Issuing…" : "Issue Part Number"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Raise Revision Dialog ─────────────────────────────────────────────────────

function RaiseRevisionDialog({ open, onClose, partNumberId, partNumberStr, currentRevision, accent, utils }: {
  open: boolean; onClose: () => void;
  partNumberId: number; partNumberStr: string; currentRevision: string; accent: string;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [form, setForm] = useState({ newRevision: "", changeDescription: "", changedBy: "" });

  const revise = trpc.partNumbers.revise.useMutation({
    onSuccess: (rev) => {
      toast.success(`${partNumberStr} raised to Rev ${rev.revision}`);
      utils.partNumbers.listForProduct.invalidate();
      utils.partNumbers.revisions.invalidate();
      utils.partNumbers.listAll.invalidate();
      onClose();
      setForm({ newRevision: "", changeDescription: "", changedBy: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const nextRevSuggestion = currentRevision === "Z" ? "AA" : String.fromCharCode(currentRevision.charCodeAt(0) + 1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GitBranch size={16} style={{ color: accent }} /> Raise Revision</DialogTitle>
          <p className="text-xs text-gray-500 mt-1"><strong>{partNumberStr}</strong> is currently at Rev <strong>{currentRevision}</strong>. The previous revision will be marked superseded.</p>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs font-medium">New Revision *</Label>
            <Input value={form.newRevision} onChange={e => setForm(f => ({ ...f, newRevision: e.target.value.toUpperCase() }))}
              className="mt-1 font-mono uppercase" placeholder={nextRevSuggestion} maxLength={8} />
          </div>
          <div>
            <Label className="text-xs font-medium">Change Description *</Label>
            <textarea value={form.changeDescription} onChange={e => setForm(f => ({ ...f, changeDescription: e.target.value }))}
              className="mt-1 w-full text-sm border rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-1"
              placeholder="Describe what changed and why" />
          </div>
          <div>
            <Label className="text-xs font-medium">Changed By</Label>
            <Input value={form.changedBy} onChange={e => setForm(f => ({ ...f, changedBy: e.target.value }))} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.newRevision || !form.changeDescription || revise.isPending}
            onClick={() => revise.mutate({ partNumberId, newRevision: form.newRevision, changeDescription: form.changeDescription, changedBy: form.changedBy || undefined })}
            style={{ background: accent, color: "#fff" }}>
            {revise.isPending ? "Raising…" : `Raise to Rev ${form.newRevision || "?"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Variant Dialog ────────────────────────────────────────────────────────

function AddVariantDialog({ open, onClose, productId, accent, utils }: {
  open: boolean; onClose: () => void;
  productId: number; accent: string;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [form, setForm] = useState({ variantCode: "", variantName: "", description: "", material: "", dimensions: "", performanceClass: "", releaseRevision: "A" });
  const create = trpc.productVariants.create.useMutation({
    onSuccess: () => { toast.success("Variant added"); utils.productVariants.list.invalidate(); utils.products.traceability.invalidate(); onClose(); setForm({ variantCode: "", variantName: "", description: "", material: "", dimensions: "", performanceClass: "", releaseRevision: "A" }); },
    onError: (e) => toast.error(e.message),
  });
  function f(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus size={16} style={{ color: accent }} /> New Product Variant</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-medium">Variant Code</Label><Input value={form.variantCode} onChange={e => f("variantCode", e.target.value)} className="mt-1 font-mono text-xs" placeholder="e.g. BAP-60" /></div>
            <div><Label className="text-xs font-medium">Variant Name *</Label><Input value={form.variantName} onChange={e => f("variantName", e.target.value)} className="mt-1" placeholder="e.g. 60mm Studio Panel" /></div>
          </div>
          <div><Label className="text-xs font-medium">Description</Label>
            <textarea value={form.description} onChange={e => f("description", e.target.value)} className="mt-1 w-full text-sm border rounded-md px-3 py-2 h-14 resize-none focus:outline-none focus:ring-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-medium">Material</Label><Input value={form.material} onChange={e => f("material", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs font-medium">Dimensions</Label><Input value={form.dimensions} onChange={e => f("dimensions", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-medium">Performance Class</Label><Input value={form.performanceClass} onChange={e => f("performanceClass", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs font-medium">Release Revision</Label><Input value={form.releaseRevision} onChange={e => f("releaseRevision", e.target.value.toUpperCase())} className="mt-1 font-mono uppercase" maxLength={8} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.variantName || create.isPending}
            onClick={() => create.mutate({ productId, variantCode: form.variantCode || undefined, variantName: form.variantName, description: form.description || undefined, material: form.material || undefined, dimensions: form.dimensions || undefined, performanceClass: form.performanceClass || undefined, releaseRevision: form.releaseRevision || "A" })}
            style={{ background: accent, color: "#fff" }}>
            {create.isPending ? "Adding…" : "Add Variant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ product }: { product: any }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <dl className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
        <InfoRow label="Commercial Name"    value={product.commercialName} />
        <InfoRow label="Product Type"       value={product.productType?.replace(/_/g," ")} />
        <InfoRow label="Lifecycle Status"   value={product.lifecycleStatus} />
        <InfoRow label="Release Status"     value={product.releaseStatus} />
        <InfoRow label="Product Owner"      value={product.productOwner} />
        <InfoRow label="Current Owner Entity" value={product.currentOwnerEntity} />
        <InfoRow label="Originating Entity" value={product.originatingEntity} />
      </dl>
      <dl className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
        <InfoRow label="Description"           value={product.description} />
        <InfoRow label="Technical Description" value={product.technicalDescription} />
      </dl>
    </div>
  );
}

// ── Variants Tab ──────────────────────────────────────────────────────────────

function VariantsTab({ productId, accent, utils }: { productId: number; accent: string; utils: ReturnType<typeof trpc.useUtils> }) {
  const [showAdd, setShowAdd] = useState(false);
  const variants = trpc.productVariants.list.useQuery({ productId });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-gray-500">{variants.data?.length ?? 0} variant{variants.data?.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 text-xs" style={{ background: accent, color: "#fff" }}>
          <Plus size={12} /> Add Variant
        </Button>
      </div>
      {variants.data?.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center bg-white rounded-xl border" style={{ borderColor: "#e5e7eb" }}>
          <Layers size={32} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No variants yet. Add a variant to issue controlled part numbers.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          {variants.data?.map(v => (
            <div key={v.id} className="px-5 py-4 border-b last:border-0 hover:bg-gray-50" style={{ borderColor: "#f5f5f5" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {v.variantCode && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${accent}14`, color: accent }}>{v.variantCode}</span>}
                    <span className="text-sm font-semibold text-gray-900">{v.variantName}</span>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${v.status === "Active" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600"}`}>{v.status}</Badge>
                    {v.releaseRevision && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Rev {v.releaseRevision}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                    {v.material && <span>Material: {v.material}</span>}
                    {v.dimensions && <span>Dim: {v.dimensions}</span>}
                    {v.performanceClass && <span>Perf: {v.performanceClass}</span>}
                  </div>
                  {v.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{v.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddVariantDialog open={showAdd} onClose={() => setShowAdd(false)} productId={productId} accent={accent} utils={utils} />
    </div>
  );
}

// ── Part Numbers Tab ──────────────────────────────────────────────────────────

function PartNumbersTab({ productId, familyId, variants, accent, utils }: {
  productId: number; familyId?: number; variants: any[]; accent: string;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [showIssue, setShowIssue] = useState(false);
  const [reviseTarget, setReviseTarget] = useState<{ id: number; pn: string; rev: string } | null>(null);
  const [expandRevisions, setExpandRevisions] = useState<number | null>(null);

  const partNums = trpc.partNumbers.listForProduct.useQuery({ productId });
  const revisions = trpc.partNumbers.revisions.useQuery(
    { partNumberId: expandRevisions ?? 0 },
    { enabled: !!expandRevisions }
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-gray-500">{partNums.data?.length ?? 0} part number{partNums.data?.length !== 1 ? "s" : ""} issued</p>
        <Button size="sm" onClick={() => setShowIssue(true)} className="gap-1.5 text-xs" style={{ background: accent, color: "#fff" }}>
          <Tag size={12} /> Issue Part Number
        </Button>
      </div>

      {!partNums.data?.length ? (
        <div className="flex flex-col items-center py-16 text-center bg-white rounded-xl border" style={{ borderColor: "#e5e7eb" }}>
          <Tag size={32} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No part numbers issued yet.</p>
          <Button size="sm" onClick={() => setShowIssue(true)} className="mt-3 gap-1 text-xs" style={{ background: accent, color: "#fff" }}>
            <Tag size={12} /> Issue First Part Number
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {partNums.data?.map(pn => (
            <div key={pn.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-sm font-bold font-mono" style={{ color: accent }}>{pn.partNumber}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">Rev {pn.currentRevision}</span>
                    <Badge className={`text-[9px] px-1.5 py-0 ${PN_STATUS_STYLE[pn.status ?? "active"] ?? "bg-gray-100 text-gray-600"}`}>
                      {pn.status}
                    </Badge>
                  </div>
                  <div className="flex gap-3 text-[10px] text-gray-400">
                    {pn.issuedBy && <span>Issued by {pn.issuedBy}</span>}
                    {pn.issuedAt && <span>{new Date(pn.issuedAt).toLocaleDateString()}</span>}
                    {pn.notes && <span>— {pn.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpandRevisions(expandRevisions === pn.id ? null : pn.id)}
                    className="text-[10px] px-2.5 py-1.5 rounded border hover:bg-gray-50 flex items-center gap-1"
                    style={{ borderColor: "#e5e7eb", color: "#6b7280" }}>
                    <GitBranch size={11} /> Revisions
                  </button>
                  <button onClick={() => setReviseTarget({ id: pn.id, pn: pn.partNumber, rev: pn.currentRevision })}
                    className="text-[10px] px-2.5 py-1.5 rounded font-medium flex items-center gap-1"
                    style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}>
                    <GitBranch size={11} /> Raise Revision
                  </button>
                </div>
              </div>

              {expandRevisions === pn.id && revisions.data && (
                <div className="border-t px-5 py-3" style={{ borderColor: "#f0f0f0", background: "#fafafa" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Revision History</p>
                  <div className="space-y-1.5">
                    {revisions.data.map(r => (
                      <div key={r.id} className="flex items-start gap-3 text-xs">
                        <span className="font-mono font-bold w-6 shrink-0" style={{ color: accent }}>Rev {r.revision}</span>
                        <span className="text-gray-600 flex-1">{r.changeDescription}</span>
                        <span className="text-gray-400 shrink-0">{r.changedBy}</span>
                        <span className="text-gray-400 shrink-0">{r.changedAt ? new Date(r.changedAt).toLocaleDateString() : ""}</span>
                        {r.supersededByRevision && <span className="text-amber-600 text-[10px] shrink-0">→ {r.supersededByRevision}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <IssuePartNumberDialog open={showIssue} onClose={() => setShowIssue(false)}
        productId={productId} familyId={familyId} variants={variants} accent={accent} utils={utils} />
      {reviseTarget && (
        <RaiseRevisionDialog open={!!reviseTarget} onClose={() => setReviseTarget(null)}
          partNumberId={reviseTarget.id} partNumberStr={reviseTarget.pn} currentRevision={reviseTarget.rev}
          accent={accent} utils={utils} />
      )}
    </div>
  );
}

// ── Traceability Tab ──────────────────────────────────────────────────────────

function TraceabilityTab({ trace, accent }: { trace: any; accent: string }) {
  const levels = [
    { label: "DOMAIN BRAND",      entity: trace.brand,       ref: trace.brand?.brandCode,    name: trace.brand?.brandName,       color: accent },
    { label: "SOURCE VENTURE",    entity: trace.venture,     ref: trace.venture?.ventureRef ?? trace.venture?.id, name: trace.venture?.name, color: "#56A837" },
    { label: "PRODUCTISATION",    entity: trace.productisationDecisions?.[0], ref: trace.productisationDecisions?.[0]?.approvalReference, name: trace.productisationDecisions?.[0]?.decision, color: "#3B85BA" },
    { label: "PRODUCT PROGRAMME", entity: trace.programme,   ref: trace.programme?.programmeRef, name: trace.programme?.programmeName, color: "#8B5CF6" },
    { label: "PRODUCT FAMILY",    entity: trace.family,      ref: trace.family?.familyCode,  name: trace.family?.familyName,       color: "#3B85BA" },
    { label: "PRODUCT",           entity: trace.product,     ref: trace.product?.productRef, name: trace.product?.productName,     color: "#F69111" },
    { label: "VARIANTS",          entity: trace.variants,    ref: `${trace.variants?.length ?? 0} variant(s)`, name: trace.variants?.map((v: any) => v.variantCode || v.variantName).join(", "), color: "#9ca3af" },
    { label: "PART NUMBERS",      entity: trace.partNumbers, ref: `${trace.partNumbers?.length ?? 0} issued`, name: trace.partNumbers?.map((pn: any) => pn.partNumber).join(", "), color: accent },
  ].filter(l => l.entity && (Array.isArray(l.entity) ? l.entity.length > 0 : true));

  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: "#f0f0f0", background: "#fafafa" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">End-to-End Provenance Chain</p>
        <p className="text-xs text-gray-500 mt-0.5">Traceable from Part Number → Variant → Product → Family → Programme → Venture → Evidence</p>
      </div>
      {levels.map((level, i) => (
        <div key={i} className="px-5 py-4 border-b last:border-0 flex items-start gap-4" style={{ borderColor: "#f5f5f5" }}>
          <div className="w-3 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full border-2 mt-0.5" style={{ borderColor: level.color, background: `${level.color}18` }} />
            {i < levels.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ background: `${level.color}25`, minHeight: "16px" }} />}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: level.color }}>{level.label}</span>
            <div className="flex items-center gap-2 mt-0.5">
              {level.ref && <span className="text-xs font-mono font-bold text-gray-800">{level.ref}</span>}
              {level.name && level.name !== level.ref && <span className="text-xs text-gray-500 truncate">— {level.name}</span>}
            </div>
          </div>
          <CheckCircle2 size={13} style={{ color: level.color }} className="shrink-0 mt-1" />
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductMasterPage() {
  const params = useParams<{ productRef: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const product = trpc.products.get.useQuery({ productRef: params.productRef?.toUpperCase() });
  const trace = trpc.products.traceability.useQuery(
    { productId: product.data?.id ?? 0 },
    { enabled: !!product.data?.id }
  );
  const utils = trpc.useUtils();

  if (product.isLoading) return <div className="flex-1 flex items-center justify-center"><p className="text-gray-400 text-sm">Loading…</p></div>;
  if (!product.data) return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <Package size={40} className="text-gray-300 mb-3" />
      <p className="text-sm text-gray-600">Product <strong>{params.productRef}</strong> not found.</p>
      <Button variant="link" onClick={() => navigate("/portfolio/products")} className="mt-2 text-sm gap-1">
        <ArrowLeft size={13} /> Back to Product Portfolio
      </Button>
    </div>
  );

  const p = product.data;
  const t = trace.data;
  const accent = BRAND_ACCENT[t?.brand?.brandCode ?? ""] ?? "#F69111";
  const ls = p.lifecycleStatus ?? "Concept";
  const variants = t?.variants ?? [];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${accent}` }}>
        <button onClick={() => navigate("/portfolio/products")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3">
          <ArrowLeft size={12} /> Product Portfolio
        </button>

        {/* Provenance chain */}
        {t && (
          <div className="mb-4 p-3 rounded-lg overflow-x-auto" style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}>
            <ProvenanceChain trace={t} accent={accent} />
          </div>
        )}

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: `${accent}14`, color: accent, fontFamily: "'Prompt',sans-serif" }}>PRODUCT</span>
              <span className="text-[9px] font-mono font-bold text-gray-400">{p.productRef}</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${LIFECYCLE_STYLE[ls] ?? "bg-gray-100 text-gray-600"}`}>{ls.replace(/_/g," ")}</Badge>
              {p.releaseStatus && <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">{p.releaseStatus}</Badge>}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#1a1a2e", fontFamily: "'Prompt',sans-serif" }}>{p.productName}</h1>
            {p.commercialName && <p className="text-sm text-gray-400 mt-0.5">{p.commercialName}</p>}
          </div>
          <div className="flex gap-2">
            {t?.brand && (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate(`/portfolio/brands/${t.brand.brandCode}`)}>
                <Building2 size={12} /> {t.brand.brandCode}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4 pt-4 border-t" style={{ borderColor: "#f0f0f0" }}>
          {[
            { label: "Product Type",  value: p.productType?.replace(/_/g," ") ?? "—" },
            { label: "Variants",      value: variants.length },
            { label: "Part Numbers",  value: t?.partNumbers?.length ?? "—" },
            { label: "Owner",         value: p.productOwner ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center px-4 py-2 rounded-lg" style={{ background: `${accent}06`, border: `1px solid ${accent}18` }}>
              <div className="text-base font-bold" style={{ color: "#1a1a2e" }}>{value}</div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white border" style={{ borderColor: "#e5e7eb" }}>
            {[
              { value: "overview",       label: "Overview",         icon: <Package size={13} /> },
              { value: "variants",       label: `Variants (${variants.length})`, icon: <Layers size={13} /> },
              { value: "part-numbers",   label: "Part Numbers",     icon: <Tag size={13} /> },
              { value: "traceability",   label: "Traceability",     icon: <GitBranch size={13} /> },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-1.5 text-xs">
                {t.icon}{t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewTab product={p} /></TabsContent>
          <TabsContent value="variants"><VariantsTab productId={p.id} accent={accent} utils={utils} /></TabsContent>
          <TabsContent value="part-numbers">
            <PartNumbersTab productId={p.id} familyId={p.productFamilyId ?? undefined} variants={variants} accent={accent} utils={utils} />
          </TabsContent>
          <TabsContent value="traceability">
            {t ? <TraceabilityTab trace={t} accent={accent} /> : <div className="text-sm text-gray-400 text-center py-12">Loading traceability…</div>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
