/**
 * Phase 4 — Part Number Register
 * Global register of all controlled part numbers across the portfolio.
 * Route: /portfolio/part-numbers
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Tag, Search, ExternalLink, GitBranch, ChevronDown, ChevronRight,
  Package, CheckCircle2, AlertCircle,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND_ACCENT: Record<string, string> = {
  TONE: "#56A837", REAL: "#3B85BA", BEBUS: "#F69111", ECOCOMP: "#8B5CF6",
};

const PN_STATUS_STYLE: Record<string, string> = {
  active:     "bg-green-100 text-green-800 border-green-200",
  superseded: "bg-amber-100 text-amber-800 border-amber-200",
  cancelled:  "bg-red-100 text-red-700 border-red-200",
  reserved:   "bg-blue-100 text-blue-800 border-blue-200",
};

// ── Raise Revision Dialog (lightweight copy) ──────────────────────────────────

function RaiseRevisionDialog({ open, onClose, partNumberId, partNumberStr, currentRevision, accent, utils }: {
  open: boolean; onClose: () => void;
  partNumberId: number; partNumberStr: string; currentRevision: string; accent: string;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [form, setForm] = useState({ newRevision: "", changeDescription: "", changedBy: "" });
  const revise = trpc.partNumbers.revise.useMutation({
    onSuccess: (rev) => {
      toast.success(`${partNumberStr} raised to Rev ${rev.revision}`);
      utils.partNumbers.listAll.invalidate();
      onClose();
      setForm({ newRevision: "", changeDescription: "", changedBy: "" });
    },
    onError: (e) => toast.error(e.message),
  });
  const nextSuggestion = currentRevision === "Z" ? "AA" : String.fromCharCode(currentRevision.charCodeAt(0) + 1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GitBranch size={16} style={{ color: accent }} /> Raise Revision</DialogTitle>
          <p className="text-xs text-gray-500 mt-1"><strong>{partNumberStr}</strong> — currently Rev <strong>{currentRevision}</strong></p>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div><Label className="text-xs font-medium">New Revision *</Label>
            <Input value={form.newRevision} onChange={e => setForm(f => ({ ...f, newRevision: e.target.value.toUpperCase() }))} className="mt-1 font-mono uppercase" placeholder={nextSuggestion} maxLength={8} /></div>
          <div><Label className="text-xs font-medium">Change Description *</Label>
            <textarea value={form.changeDescription} onChange={e => setForm(f => ({ ...f, changeDescription: e.target.value }))}
              className="mt-1 w-full text-sm border rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-1" placeholder="What changed and why" /></div>
          <div><Label className="text-xs font-medium">Changed By</Label>
            <Input value={form.changedBy} onChange={e => setForm(f => ({ ...f, changedBy: e.target.value }))} className="mt-1" /></div>
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

// ── Revision History Drawer ───────────────────────────────────────────────────

function RevisionHistory({ partNumberId, accent }: { partNumberId: number; accent: string }) {
  const revisions = trpc.partNumbers.revisions.useQuery({ partNumberId });
  if (revisions.isLoading) return <div className="text-xs text-gray-400 py-2">Loading…</div>;
  return (
    <div className="space-y-1.5 py-1">
      {revisions.data?.map(r => (
        <div key={r.id} className="flex items-start gap-3 text-xs">
          <span className="font-mono font-bold w-10 shrink-0" style={{ color: accent }}>Rev {r.revision}</span>
          <span className="text-gray-600 flex-1">{r.changeDescription}</span>
          <span className="text-gray-400 shrink-0">{r.changedBy}</span>
          <span className="text-gray-400 shrink-0">{r.changedAt ? new Date(r.changedAt).toLocaleDateString() : ""}</span>
          {r.supersededByRevision && <span className="text-amber-600 text-[10px] shrink-0">→ {r.supersededByRevision}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Traceability Dialog ───────────────────────────────────────────────────────

function TraceabilityDialog({ open, onClose, partNumberStr }: {
  open: boolean; onClose: () => void; partNumberStr: string;
}) {
  const trace = trpc.partNumbers.traceability.useQuery({ partNumber: partNumberStr }, { enabled: open });
  const t = trace.data;

  const levels = t ? [
    { label: "DOMAIN BRAND",      ref: t.brand?.brandCode,        name: t.brand?.brandName },
    { label: "SOURCE VENTURE",    ref: t.venture?.ventureRef ?? t.venture?.id, name: t.venture?.name },
    { label: "PRODUCT PROGRAMME", ref: t.programme?.programmeRef, name: t.programme?.programmeName },
    { label: "PRODUCT FAMILY",    ref: t.family?.familyCode,      name: t.family?.familyName },
    { label: "PRODUCT",           ref: t.product?.productRef,     name: t.product?.productName },
    { label: "VARIANT",           ref: t.variant?.variantCode ?? t.variant?.variantName, name: t.variant?.variantName },
    { label: "PART NUMBER",       ref: t.partNumber.partNumber,   name: `Rev ${t.partNumber.currentRevision}` },
  ].filter(l => l.ref) : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GitBranch size={16} style={{ color: "#56A837" }} /> Traceability</DialogTitle>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">{partNumberStr}</p>
        </DialogHeader>
        {trace.isLoading ? (
          <div className="text-sm text-gray-400 text-center py-8">Loading trace…</div>
        ) : !t ? (
          <div className="text-sm text-gray-500 text-center py-8">Part number not found.</div>
        ) : (
          <div className="space-y-0 py-1">
            {levels.map((level, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: "#f5f5f5" }}>
                <div className="flex flex-col items-center w-4 pt-1 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "#56A837", background: "#56A83718" }} />
                  {i < levels.length - 1 && <div className="w-0.5 h-4 mt-0.5" style={{ background: "#56A83725" }} />}
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{level.label}</span>
                  <div className="text-xs font-semibold text-gray-800">{level.ref}</div>
                  {level.name && level.name !== level.ref && <div className="text-[10px] text-gray-400">{level.name}</div>}
                </div>
                <CheckCircle2 size={12} className="text-green-500 ml-auto shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PartNumberRegister() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandRevisions, setExpandRevisions] = useState<number | null>(null);
  const [reviseTarget, setReviseTarget] = useState<{ id: number; pn: string; rev: string } | null>(null);
  const [traceTarget, setTraceTarget] = useState<string | null>(null);

  const brands = trpc.domainBrands.list.useQuery({});
  const allPNs = trpc.partNumbers.listAll.useQuery({
    brandId: filterBrand !== "all" ? parseInt(filterBrand) : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });
  const utils = trpc.useUtils();

  const brandMap = Object.fromEntries((brands.data ?? []).map(b => [b.id, b]));

  const rows = (allPNs.data ?? []).filter(pn => {
    if (!search) return true;
    const q = search.toLowerCase();
    return pn.partNumber?.toLowerCase().includes(q) || pn.productName?.toLowerCase().includes(q) || pn.productRef?.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "rgba(86,168,55,0.1)", color: "#56A837", fontFamily: "'Prompt',sans-serif" }}>PORTFOLIO</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#1a1a2e", fontFamily: "'Prompt',sans-serif" }}>Part Number Register</h1>
            <p className="text-sm text-gray-500 mt-1">
              All controlled part numbers — immutable, sequentially issued, with full revision history.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/portfolio/products")} className="gap-1.5 text-xs">
              <Package size={13} /> Product Portfolio
            </Button>
          </div>
        </div>

        {/* Metrics bar */}
        <div className="flex gap-6 mt-5 pt-4 border-t" style={{ borderColor: "#f0f0f0" }}>
          {[
            { label: "Total Issued",  value: allPNs.data?.length ?? "—" },
            { label: "Active",        value: allPNs.data?.filter(p => p.status === "active").length ?? "—" },
            { label: "Superseded",    value: allPNs.data?.filter(p => p.status === "superseded").length ?? "—" },
            { label: "Cancelled",     value: allPNs.data?.filter(p => p.status === "cancelled").length ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-xl font-bold" style={{ color: "#1a1a2e" }}>{value}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-8 py-3 flex items-center gap-3" style={{ borderColor: "#e5e7eb" }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search part numbers, products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterBrand} onValueChange={setFilterBrand}>
          <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="All brands" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {(brands.data ?? []).map(b => <SelectItem key={b.id} value={String(b.id)}>{b.brandCode}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["active","superseded","cancelled","reserved"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-400 ml-auto">{rows.length} part number{rows.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Register table */}
      <div className="px-8 py-4">
        {allPNs.isLoading ? (
          <div className="text-sm text-gray-400 text-center py-16">Loading register…</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Tag size={40} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No part numbers match your filters.</p>
            <p className="text-xs text-gray-400 mt-1">Go to a Product Master page to issue part numbers.</p>
            <Button size="sm" variant="outline" onClick={() => navigate("/portfolio/products")} className="mt-4 gap-1 text-xs">
              <Package size={13} /> Open Product Portfolio
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b text-[10px] font-semibold uppercase tracking-widest text-gray-400"
              style={{ borderColor: "#f0f0f0", background: "#fafafa" }}>
              <div className="col-span-3">Part Number</div>
              <div className="col-span-3">Product</div>
              <div className="col-span-1 text-center">Rev</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Brand</div>
              <div className="col-span-1">Issued</div>
              <div className="col-span-1"></div>
            </div>

            {rows.map(pn => {
              const brand = pn.domainBrandId ? brandMap[pn.domainBrandId] : null;
              const accent = brand ? (BRAND_ACCENT[brand.brandCode] ?? "#56A837") : "#9ca3af";
              const expanded = expandRevisions === pn.id;

              return (
                <div key={pn.id} className="border-b last:border-0" style={{ borderColor: "#f5f5f5" }}>
                  <div className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold font-mono" style={{ color: accent }}>{pn.partNumber}</span>
                      </div>
                      {pn.notes && <p className="text-[10px] text-gray-400 truncate mt-0.5">{pn.notes}</p>}
                    </div>

                    <div className="col-span-3 min-w-0">
                      {pn.productRef && (
                        <button onClick={() => navigate(`/portfolio/products/${pn.productRef}`)}
                          className="flex items-center gap-1 hover:underline text-left">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${accent}14`, color: accent }}>{pn.productRef}</span>
                        </button>
                      )}
                      <p className="text-xs text-gray-700 truncate mt-0.5">{pn.productName}</p>
                    </div>

                    <div className="col-span-1 text-center">
                      <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">Rev {pn.currentRevision}</span>
                    </div>

                    <div className="col-span-2">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${PN_STATUS_STYLE[pn.status ?? "active"] ?? "bg-gray-100 text-gray-600"}`}>
                        {pn.status ?? "active"}
                      </Badge>
                    </div>

                    <div className="col-span-1">
                      {brand ? (
                        <button onClick={() => navigate(`/portfolio/brands/${brand.brandCode}`)}
                          className="flex items-center gap-1 text-[10px] font-medium hover:underline" style={{ color: accent }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
                          {brand.brandCode}
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><AlertCircle size={10} /> —</span>
                      )}
                    </div>

                    <div className="col-span-1">
                      <span className="text-[10px] text-gray-400">
                        {pn.issuedAt ? new Date(pn.issuedAt).toLocaleDateString() : "—"}
                      </span>
                    </div>

                    <div className="col-span-1 flex justify-end gap-1">
                      <button onClick={() => setExpandRevisions(expanded ? null : pn.id)}
                        className="p-1.5 rounded hover:bg-gray-100" title="Revision history">
                        {expanded ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                      </button>
                      <button onClick={() => setTraceTarget(pn.partNumber)}
                        className="p-1.5 rounded hover:bg-gray-100" title="Traceability">
                        <GitBranch size={12} className="text-gray-400" />
                      </button>
                      <button onClick={() => setReviseTarget({ id: pn.id, pn: pn.partNumber, rev: pn.currentRevision })}
                        className="p-1.5 rounded hover:bg-gray-100" title="Raise revision">
                        <ExternalLink size={12} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Revision history inline */}
                  {expanded && (
                    <div className="px-5 pb-3 border-t" style={{ borderColor: "#f0f0f0", background: "#fafafa" }}>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 pt-2 mb-1">Revision History</p>
                      <RevisionHistory partNumberId={pn.id} accent={accent} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {reviseTarget && (
        <RaiseRevisionDialog open={!!reviseTarget} onClose={() => setReviseTarget(null)}
          partNumberId={reviseTarget.id} partNumberStr={reviseTarget.pn} currentRevision={reviseTarget.rev}
          accent="#56A837" utils={utils} />
      )}
      {traceTarget && (
        <TraceabilityDialog open={!!traceTarget} onClose={() => setTraceTarget(null)} partNumberStr={traceTarget} />
      )}
    </div>
  );
}
