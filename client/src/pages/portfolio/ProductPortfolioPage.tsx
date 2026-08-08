/**
 * Phase 4 — Product Portfolio Page
 * Hierarchical tree: Domain Brand → Programme → Family → Product
 * Route: /portfolio/products
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Package, Layers, ChevronDown, ChevronRight, Plus, ExternalLink,
  Building2, Tag, Settings, BarChart2, ShieldCheck,
} from "lucide-react";

// ── Brand accent palette ──────────────────────────────────────────────────────
const BRAND_ACCENT: Record<string, string> = {
  TONE: "#56A837", REAL: "#3B85BA", BEBUS: "#F69111", ECOCOMP: "#8B5CF6",
};

// ── Status badges ─────────────────────────────────────────────────────────────
const LIFECYCLE_STYLE: Record<string, string> = {
  Concept:        "bg-gray-100 text-gray-600",
  Prototype:      "bg-blue-100 text-blue-800",
  Pilot:          "bg-purple-100 text-purple-800",
  Commercial:     "bg-green-100 text-green-800",
  Mature:         "bg-teal-100 text-teal-800",
  End_of_Life:    "bg-amber-100 text-amber-800",
  Discontinued:   "bg-red-100 text-red-700",
};

const PRODUCT_TYPE_ICON: Record<string, React.ReactNode> = {
  physical:         <Package size={12} />,
  digital:          <BarChart2 size={12} />,
  software:         <Tag size={12} />,
  service:          <Settings size={12} />,
  platform_service: <Layers size={12} />,
  ai_agent:         <ShieldCheck size={12} />,
};

// ── Dialogs ───────────────────────────────────────────────────────────────────

function NewFamilyDialog({ open, onClose, programmeId, domainBrandId, utils }: {
  open: boolean; onClose: () => void;
  programmeId: number; domainBrandId?: number;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [form, setForm] = useState({ familyCode: "", familyName: "", description: "", productCategory: "", customerSegment: "" });
  const create = trpc.productFamilies.create.useMutation({
    onSuccess: () => { toast.success("Product Family created"); utils.productFamilies.list.invalidate(); onClose(); setForm({ familyCode: "", familyName: "", description: "", productCategory: "", customerSegment: "" }); },
    onError: (e) => toast.error(e.message),
  });
  function f(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Layers size={16} style={{ color: "#56A837" }} /> New Product Family</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-medium">Family Code *</Label>
              <Input value={form.familyCode} onChange={e => f("familyCode", e.target.value.toUpperCase())} className="mt-1 font-mono uppercase" placeholder="e.g. BAP" maxLength={16} /></div>
            <div><Label className="text-xs font-medium">Family Name *</Label>
              <Input value={form.familyName} onChange={e => f("familyName", e.target.value)} className="mt-1" placeholder="e.g. BioAcoustic Panels" /></div>
          </div>
          <div><Label className="text-xs font-medium">Description</Label>
            <textarea value={form.description} onChange={e => f("description", e.target.value)} className="mt-1 w-full text-sm border rounded-md px-3 py-2 h-16 resize-none focus:outline-none focus:ring-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-medium">Product Category</Label>
              <Input value={form.productCategory} onChange={e => f("productCategory", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs font-medium">Customer Segment</Label>
              <Input value={form.customerSegment} onChange={e => f("customerSegment", e.target.value)} className="mt-1" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.familyCode || !form.familyName || create.isPending}
            onClick={() => create.mutate({ familyCode: form.familyCode, familyName: form.familyName, productProgrammeId: programmeId, domainBrandId, description: form.description || undefined, productCategory: form.productCategory || undefined, customerSegment: form.customerSegment || undefined })}
            style={{ background: "#56A837", color: "#fff" }}>
            {create.isPending ? "Creating…" : "Create Family"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewProductDialog({ open, onClose, familyId, programmeId, domainBrandId, brandCode, utils }: {
  open: boolean; onClose: () => void;
  familyId: number; programmeId: number; domainBrandId?: number; brandCode: string;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const accent = BRAND_ACCENT[brandCode] ?? "#56A837";
  const [form, setForm] = useState({ productName: "", commercialName: "", productType: "physical", lifecycleStatus: "Concept", description: "", productOwner: "" });
  const create = trpc.products.create.useMutation({
    onSuccess: (p) => { toast.success(`Product ${p.productRef} created`); utils.products.list.invalidate(); onClose(); setForm({ productName: "", commercialName: "", productType: "physical", lifecycleStatus: "Concept", description: "", productOwner: "" }); },
    onError: (e) => toast.error(e.message),
  });
  function f(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Package size={16} style={{ color: accent }} /> New Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div><Label className="text-xs font-medium">Product Name *</Label>
            <Input value={form.productName} onChange={e => f("productName", e.target.value)} className="mt-1" placeholder="e.g. TONE BioAcoustic Studio Panel" /></div>
          <div><Label className="text-xs font-medium">Commercial Name</Label>
            <Input value={form.commercialName} onChange={e => f("commercialName", e.target.value)} className="mt-1" placeholder="Shorter market-facing name" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-medium">Product Type</Label>
              <Select value={form.productType} onValueChange={v => f("productType", v)}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["physical","digital","software","service","platform_service","licensing","data_product","ai_agent","hybrid"].map(t =>
                    <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}
                </SelectContent>
              </Select></div>
            <div><Label className="text-xs font-medium">Lifecycle Status</Label>
              <Select value={form.lifecycleStatus} onValueChange={v => f("lifecycleStatus", v)}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Concept","Prototype","Pilot","Commercial","Mature","End_of_Life","Discontinued"].map(s =>
                    <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
                </SelectContent>
              </Select></div>
          </div>
          <div><Label className="text-xs font-medium">Description</Label>
            <textarea value={form.description} onChange={e => f("description", e.target.value)} className="mt-1 w-full text-sm border rounded-md px-3 py-2 h-16 resize-none focus:outline-none focus:ring-1" /></div>
          <div><Label className="text-xs font-medium">Product Owner</Label>
            <Input value={form.productOwner} onChange={e => f("productOwner", e.target.value)} className="mt-1" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.productName || create.isPending}
            onClick={() => create.mutate({ productFamilyId: familyId, productProgrammeId: programmeId, domainBrandId, productName: form.productName, commercialName: form.commercialName || undefined, productType: form.productType as any, lifecycleStatus: form.lifecycleStatus, description: form.description || undefined, productOwner: form.productOwner || undefined, brandCode })}
            style={{ background: accent, color: "#fff" }}>
            {create.isPending ? "Creating…" : "Create Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewPartNumberConfigDialog({ open, onClose, familyId, familyCode, brandCode, utils }: {
  open: boolean; onClose: () => void;
  familyId: number; familyCode: string; brandCode: string;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [form, setForm] = useState({ formatTemplate: "{BRAND}-{FAMILY}-{SEQ}", sequenceLength: "4", notes: "" });
  const create = trpc.partNumbers.createConfig.useMutation({
    onSuccess: () => { toast.success("Part Number Config created"); utils.partNumbers.listAll.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  function f(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }

  const preview = form.formatTemplate
    .replace("{BRAND}", brandCode.toUpperCase())
    .replace("{FAMILY}", familyCode.toUpperCase())
    .replace("{SEQ}", "0001".slice(-parseInt(form.sequenceLength) || 4));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings size={16} style={{ color: "#56A837" }} /> Part Number Config</DialogTitle>
          <p className="text-xs text-gray-500 mt-1">Configure the numbering scheme for <strong>{brandCode}-{familyCode}</strong> parts.</p>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs font-medium">Format Template</Label>
            <Input value={form.formatTemplate} onChange={e => f("formatTemplate", e.target.value)} className="mt-1 font-mono text-xs" />
            <p className="text-[10px] text-gray-400 mt-1">Tokens: {"{BRAND}"}, {"{FAMILY}"}, {"{SEQ}"}</p>
          </div>
          <div>
            <Label className="text-xs font-medium">Sequence Length (digits)</Label>
            <Input type="number" min={1} max={8} value={form.sequenceLength} onChange={e => f("sequenceLength", e.target.value)} className="mt-1" />
          </div>
          <div className="p-2 rounded bg-gray-50 border text-xs font-mono" style={{ borderColor: "#e5e7eb" }}>
            Preview: <strong>{preview}</strong>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={create.isPending}
            onClick={() => create.mutate({ productFamilyId: familyId, brandCode, familyCode, formatTemplate: form.formatTemplate, sequenceLength: parseInt(form.sequenceLength) || 4, notes: form.notes || undefined })}
            style={{ background: "#56A837", color: "#fff" }}>
            {create.isPending ? "Creating…" : "Create Config"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Product row ───────────────────────────────────────────────────────────────

function ProductRow({ product, brandCode, accent }: { product: any; brandCode: string; accent: string }) {
  const [, navigate] = useLocation();
  const ls = product.lifecycleStatus ?? "Concept";
  const partNums = trpc.partNumbers.listForProduct.useQuery({ productId: product.id });

  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors border-b last:border-0 pl-14" style={{ borderColor: "#f5f5f5" }}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-gray-400" style={{ color: accent }}>{PRODUCT_TYPE_ICON[product.productType] ?? <Package size={12} />}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ background: `${accent}14`, color: accent }}>{product.productRef}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0"
              style={{ background: "rgba(246,145,17,0.08)", color: "#F69111", fontFamily: "'Prompt',sans-serif" }}>PRODUCT</span>
            <span className="text-sm font-medium text-gray-900 truncate">{product.productName}</span>
            {product.commercialName && <span className="text-xs text-gray-400 truncate">({product.commercialName})</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${LIFECYCLE_STYLE[ls] ?? "bg-gray-100 text-gray-600"}`}>{ls.replace(/_/g," ")}</Badge>
            <span className="text-[9px] text-gray-400">{product.productType?.replace(/_/g," ")}</span>
            {partNums.data && <span className="text-[9px] text-gray-400">{partNums.data.length} part number{partNums.data.length !== 1 ? "s" : ""}</span>}
          </div>
        </div>
      </div>
      <button onClick={() => navigate(`/portfolio/products/${product.productRef}`)}
        className="p-2 rounded-lg hover:bg-gray-100 shrink-0" title="Open Product Master">
        <ExternalLink size={13} className="text-gray-400" />
      </button>
    </div>
  );
}

// ── Family accordion ──────────────────────────────────────────────────────────

function FamilyAccordion({ family, brandCode, domainBrandId, programmeId, accent, utils }: {
  family: any; brandCode: string; domainBrandId?: number; programmeId: number; accent: string;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [open, setOpen] = useState(true);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const products = trpc.products.list.useQuery({ familyId: family.id });

  return (
    <div className="border-b last:border-0" style={{ borderColor: "#f0f0f0" }}>
      <div className="flex items-center justify-between px-5 py-2.5 pl-8 hover:bg-gray-50/50 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2.5">
          {open ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRight size={13} className="text-gray-400" />}
          <Layers size={13} style={{ color: accent }} />
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${accent}10`, color: accent }}>{family.familyCode}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: "rgba(59,133,186,0.08)", color: "#3B85BA", fontFamily: "'Prompt',sans-serif" }}>PRODUCT FAMILY</span>
          <span className="text-sm font-semibold text-gray-800">{family.familyName}</span>
          {family.productCategory && <span className="text-[10px] text-gray-400">— {family.productCategory}</span>}
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowConfig(true)}
            className="text-[9px] px-2 py-1 rounded border hover:bg-gray-50 text-gray-500 flex items-center gap-1"
            style={{ borderColor: "#e5e7eb" }} title="Part Number Config">
            <Settings size={10} /> PN Config
          </button>
          <button onClick={() => setShowNewProduct(true)}
            className="text-[9px] px-2 py-1 rounded font-medium flex items-center gap-1"
            style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}>
            <Plus size={10} /> Product
          </button>
        </div>
      </div>

      {open && (
        <div className="bg-white/60">
          {products.data?.map(p => <ProductRow key={p.id} product={p} brandCode={brandCode} accent={accent} />)}
          {products.data?.length === 0 && (
            <div className="pl-14 py-3 text-xs text-gray-400 flex items-center gap-2">
              No products in this family.
              <button onClick={() => setShowNewProduct(true)} className="text-xs underline" style={{ color: accent }}>Add one</button>
            </div>
          )}
        </div>
      )}

      <NewProductDialog open={showNewProduct} onClose={() => setShowNewProduct(false)}
        familyId={family.id} programmeId={programmeId} domainBrandId={domainBrandId}
        brandCode={brandCode} utils={utils} />
      <NewPartNumberConfigDialog open={showConfig} onClose={() => setShowConfig(false)}
        familyId={family.id} familyCode={family.familyCode} brandCode={brandCode} utils={utils} />
    </div>
  );
}

// ── Programme accordion ───────────────────────────────────────────────────────

function ProgrammeAccordion({ programme, brandCode, accent, utils }: {
  programme: any; brandCode: string; accent: string;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [open, setOpen] = useState(true);
  const [showNewFamily, setShowNewFamily] = useState(false);
  const families = trpc.productFamilies.list.useQuery({ programmeId: programme.id });

  return (
    <div className="border rounded-xl mb-3 overflow-hidden bg-white" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50/50" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2.5">
          {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
            style={{ background: `${accent}14`, color: accent }}>{programme.programmeRef}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: "rgba(139,92,246,0.08)", color: "#8B5CF6", fontFamily: "'Prompt',sans-serif" }}>PROGRAMME</span>
          <span className="text-sm font-semibold text-gray-900">{programme.programmeName}</span>
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${programme.programmeStatus === "Active" || programme.programmeStatus === "Approved" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600"}`}>
            {programme.programmeStatus?.replace(/_/g," ")}
          </Badge>
          <span className="text-[10px] text-gray-400">{families.data?.length ?? 0} families</span>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowNewFamily(true)}
            className="text-[9px] px-2.5 py-1 rounded font-medium flex items-center gap-1"
            style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}>
            <Plus size={10} /> Family
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t" style={{ borderColor: "#f0f0f0" }}>
          {families.data?.map(f => (
            <FamilyAccordion key={f.id} family={f} brandCode={brandCode}
              domainBrandId={programme.domainBrandId} programmeId={programme.id}
              accent={accent} utils={utils} />
          ))}
          {families.data?.length === 0 && (
            <div className="px-8 py-4 text-xs text-gray-400 flex items-center gap-2">
              No product families yet.
              <button onClick={() => setShowNewFamily(true)} className="underline" style={{ color: accent }}>Create one</button>
            </div>
          )}
        </div>
      )}

      <NewFamilyDialog open={showNewFamily} onClose={() => setShowNewFamily(false)}
        programmeId={programme.id} domainBrandId={programme.domainBrandId} utils={utils} />
    </div>
  );
}

// ── Brand tab panel ───────────────────────────────────────────────────────────

function BrandPanel({ brand, utils }: { brand: any; utils: ReturnType<typeof trpc.useUtils> }) {
  const accent = BRAND_ACCENT[brand.brandCode] ?? "#56A837";
  const programmes = trpc.productProgrammes.list.useQuery({ brandId: brand.id });

  if (programmes.isLoading) return <div className="text-sm text-gray-400 text-center py-12">Loading…</div>;
  if (!programmes.data?.length) return (
    <div className="flex flex-col items-center py-20 text-center">
      <Package size={36} className="text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">No Product Programmes under {brand.brandCode} yet.</p>
      <p className="text-xs text-gray-400 mt-1">Approve a venture through the Productisation Gate to create one.</p>
      <Button size="sm" variant="link" onClick={() => {}} className="mt-2 text-xs gap-1">
        Go to Domain Brand →
      </Button>
    </div>
  );

  return (
    <div>
      {programmes.data.map(p => (
        <ProgrammeAccordion key={p.id} programme={p} brandCode={brand.brandCode} accent={accent} utils={utils} />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductPortfolioPage() {
  const [, navigate] = useLocation();
  const [selectedBrandId, setSelectedBrandId] = useState<number | "all">("all");
  const brands = trpc.domainBrands.list.useQuery({});
  const utils = trpc.useUtils();

  const allProgrammes = trpc.productProgrammes.list.useQuery({}, { enabled: selectedBrandId === "all" });

  const displayBrands = brands.data ?? [];
  const selectedBrand = selectedBrandId === "all" ? null : displayBrands.find(b => b.id === selectedBrandId) ?? null;
  const accent = selectedBrand ? (BRAND_ACCENT[selectedBrand.brandCode] ?? "#56A837") : "#56A837";

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "rgba(246,145,17,0.1)", color: "#F69111", fontFamily: "'Prompt',sans-serif" }}>
                PORTFOLIO
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#1a1a2e", fontFamily: "'Prompt',sans-serif" }}>Product Portfolio</h1>
            <p className="text-sm text-gray-500 mt-1">Hierarchical view — Domain Brand → Programme → Family → Product. Only productisation-approved ventures appear here.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/portfolio/part-numbers")} className="gap-1.5 text-xs">
              <Tag size={13} /> Part Number Register
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/portfolio/brands")} className="gap-1.5 text-xs">
              <Building2 size={13} /> Domain Brands
            </Button>
          </div>
        </div>
      </div>

      {/* Brand filter tabs */}
      <div className="bg-white border-b px-8 py-0" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex gap-0 overflow-x-auto">
          <button onClick={() => setSelectedBrandId("all")}
            className="px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap"
            style={{ borderColor: selectedBrandId === "all" ? "#56A837" : "transparent", color: selectedBrandId === "all" ? "#56A837" : "#9ca3af" }}>
            All Brands
          </button>
          {displayBrands.map(b => {
            const a = BRAND_ACCENT[b.brandCode] ?? "#56A837";
            const active = selectedBrandId === b.id;
            return (
              <button key={b.id} onClick={() => setSelectedBrandId(b.id)}
                className="px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                style={{ borderColor: active ? a : "transparent", color: active ? a : "#9ca3af" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: a }} />
                {b.brandCode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {selectedBrandId === "all" ? (
          // All brands view — group by brand
          brands.isLoading ? (
            <div className="text-sm text-gray-400 text-center py-16">Loading…</div>
          ) : (
            displayBrands.map(b => {
              const a = BRAND_ACCENT[b.brandCode] ?? "#56A837";
              return (
                <div key={b.id} className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: a }} />
                    <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#1a1a2e", fontFamily: "'Prompt',sans-serif" }}>{b.brandCode}</h2>
                    <span className="text-xs text-gray-400">— {b.brandName}</span>
                  </div>
                  <BrandPanel brand={b} utils={utils} />
                </div>
              );
            })
          )
        ) : selectedBrand ? (
          <BrandPanel brand={selectedBrand} utils={utils} />
        ) : null}
      </div>
    </div>
  );
}
