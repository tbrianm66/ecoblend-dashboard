/**
 * Phase 3 — Domain Brands Page
 * Lists all Domain Brands with portfolio metrics.
 * Route: /portfolio/brands
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Building2, TrendingUp, Package, Layers, Plus, ArrowRight,
  Activity, AlertCircle, CheckCircle, Clock, Archive, Zap,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND_STATUS_COLORS: Record<string, string> = {
  Active:   "bg-green-100 text-green-800 border-green-200",
  Concept:  "bg-blue-100 text-blue-800 border-blue-200",
  Reserved: "bg-amber-100 text-amber-800 border-amber-200",
  Dormant:  "bg-gray-100 text-gray-600 border-gray-200",
  Retired:  "bg-red-100 text-red-700 border-red-200",
};

const BRAND_ACCENT_COLORS: Record<string, string> = {
  TONE:    "#56A837",
  REAL:    "#3B85BA",
  BEBUS:   "#F69111",
  ECOCOMP: "#8B5CF6",
};

const BRAND_SECTOR_ICONS: Record<string, React.ReactNode> = {
  "Creative Industries":          <Zap size={16} />,
  "Safety & Protective Equipment": <CheckCircle size={16} />,
  "Sustainable Transport & Mobility": <TrendingUp size={16} />,
  "Construction & Built Environment": <Building2 size={16} />,
};

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyBrands({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Building2 size={48} className="text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-1">No Domain Brands yet</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">
        Domain Brands are persistent sector-facing umbrellas. Create one to start organising your venture portfolio.
      </p>
      <Button onClick={onNew} className="gap-2" style={{ background: "#56A837" }}>
        <Plus size={15} /> New Domain Brand
      </Button>
    </div>
  );
}

// ── Create Brand Dialog ───────────────────────────────────────────────────────

function CreateBrandDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    brandCode: "", brandName: "", sector: "", subSector: "", description: "",
    brandThesis: "", mission: "", legalOwner: "", brandStatus: "Active",
  });

  const utils = trpc.useUtils();
  const create = trpc.domainBrands.create.useMutation({
    onSuccess: () => {
      toast.success(`Domain Brand ${form.brandCode} created`);
      utils.domainBrands.list.invalidate();
      onClose();
      setForm({ brandCode: "", brandName: "", sector: "", subSector: "", description: "", brandThesis: "", mission: "", legalOwner: "", brandStatus: "Active" });
    },
    onError: (e) => toast.error(e.message),
  });

  function field(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 size={18} style={{ color: "#56A837" }} />
            New Domain Brand
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            A Domain Brand is a persistent sector-facing umbrella — not a venture. Define it carefully.
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Brand Code *</Label>
              <Input placeholder="e.g. TONE" value={form.brandCode} onChange={e => field("brandCode", e.target.value.toUpperCase())}
                className="mt-1 uppercase font-mono text-sm" maxLength={12} />
              <p className="text-xs text-gray-400 mt-0.5">Short, unique, stable</p>
            </div>
            <div>
              <Label className="text-xs font-medium">Brand Name *</Label>
              <Input placeholder="e.g. TONE" value={form.brandName} onChange={e => field("brandName", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Sector</Label>
              <Input placeholder="e.g. Creative Industries" value={form.sector} onChange={e => field("sector", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Sub-Sector</Label>
              <Input placeholder="e.g. Acoustic Materials" value={form.subSector} onChange={e => field("subSector", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium">Description</Label>
            <Textarea placeholder="Brief brand overview" value={form.description} onChange={e => field("description", e.target.value)} className="mt-1 h-16 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">Brand Thesis</Label>
            <Textarea placeholder="Core belief / strategic thesis" value={form.brandThesis} onChange={e => field("brandThesis", e.target.value)} className="mt-1 h-16 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">Mission</Label>
            <Textarea placeholder="Mission statement" value={form.mission} onChange={e => field("mission", e.target.value)} className="mt-1 h-14 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Legal Owner</Label>
              <Input placeholder="e.g. ECORACE Studio Ltd" value={form.legalOwner} onChange={e => field("legalOwner", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Initial Status</Label>
              <Select value={form.brandStatus} onValueChange={v => field("brandStatus", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Concept","Reserved","Active","Dormant"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.brandCode || !form.brandName || create.isPending}
            onClick={() => create.mutate({ ...form, brandStatus: form.brandStatus as any })}
            style={{ background: "#56A837", color: "#fff" }}
          >
            {create.isPending ? "Creating…" : "Create Domain Brand"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Brand Card ────────────────────────────────────────────────────────────────

function BrandCard({ brand }: { brand: any }) {
  const [, navigate] = useLocation();
  const accent = BRAND_ACCENT_COLORS[brand.brandCode] ?? "#56A837";
  const summary = trpc.domainBrands.portfolioSummary.useQuery({ brandId: brand.id });
  const s = summary.data;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border"
      style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${accent}` }}
      onClick={() => navigate(`/portfolio/brands/${brand.brandCode}`)}
    >
      <CardHeader className="pb-3 pt-5 px-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: `${accent}18`, color: accent, fontFamily: "'Prompt',sans-serif" }}>
                DOMAIN BRAND
              </span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${BRAND_STATUS_COLORS[brand.brandStatus] ?? ""}`}>
                {brand.brandStatus}
              </Badge>
            </div>
            <CardTitle className="text-xl font-bold" style={{ color: "#1a1a2e", fontFamily: "'Prompt',sans-serif" }}>
              {brand.brandCode}
            </CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">{brand.brandName}</p>
          </div>
          <div style={{ color: accent }}>{BRAND_SECTOR_ICONS[brand.sector ?? ""] ?? <Building2 size={20} />}</div>
        </div>
        {brand.sector && (
          <p className="text-xs font-medium text-gray-500 mt-1">{brand.sector}{brand.subSector ? ` — ${brand.subSector}` : ""}</p>
        )}
      </CardHeader>

      <CardContent className="px-6 pb-5">
        {brand.brandThesis && (
          <p className="text-xs text-gray-600 mb-4 leading-relaxed line-clamp-2">{brand.brandThesis}</p>
        )}

        <div className="grid grid-cols-3 gap-3 mt-2">
          {[
            { label: "Active Ventures", value: s?.activeVentures ?? "—", icon: <Activity size={12} /> },
            { label: "Programmes",      value: s?.programmes ?? "—",     icon: <Layers size={12} /> },
            { label: "Products",        value: s?.products ?? "—",       icon: <Package size={12} /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="text-center p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.03)" }}>
              <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color: accent }}>{icon}</div>
              <div className="text-lg font-bold" style={{ color: "#1a1a2e" }}>{value}</div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end mt-4 text-xs font-medium gap-1" style={{ color: accent }}>
          View Brand <ArrowRight size={12} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DomainBrandsPage() {
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);

  const brands = trpc.domainBrands.list.useQuery({});
  const metrics = trpc.portfolioPipeline.commandCentreMetrics.useQuery();
  const m = metrics.data;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "rgba(86,168,55,0.1)", color: "#56A837", fontFamily: "'Prompt',sans-serif" }}>
                PORTFOLIO
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#1a1a2e", fontFamily: "'Prompt',sans-serif" }}>
              Domain Brands
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Persistent sector-facing commercial and strategic umbrellas — distinct from Venture Candidates and Products.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/portfolio/pipeline")} className="gap-1.5 text-xs">
              <TrendingUp size={13} /> Venture Pipeline
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs" style={{ background: "#56A837", color: "#fff" }}>
              <Plus size={13} /> New Domain Brand
            </Button>
          </div>
        </div>

        {/* Portfolio metrics bar */}
        {m && (
          <div className="flex gap-6 mt-5 pt-4 border-t" style={{ borderColor: "#f0f0f0" }}>
            {[
              { label: "Domain Brands",        value: m.domainBrands },
              { label: "Active Ventures",       value: m.activeVentureCandidates },
              { label: "Unassigned Ventures",   value: m.unassignedVentures, alert: m.unassignedVentures > 0 },
              { label: "Productisation Ready",  value: m.productisationApproved },
              { label: "Active Programmes",     value: m.activeProductProgrammes },
              { label: "Part Numbers Issued",   value: m.partNumbersIssued },
            ].map(({ label, value, alert }) => (
              <div key={label} className="text-center">
                <div className={`text-xl font-bold ${alert ? "text-amber-600" : ""}`} style={!alert ? { color: "#1a1a2e" } : undefined}>{value}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {brands.isLoading ? (
          <div className="text-sm text-gray-400 py-12 text-center">Loading domain brands…</div>
        ) : !brands.data?.length ? (
          <EmptyBrands onNew={() => setShowCreate(true)} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
              {brands.data.map(b => <BrandCard key={b.id} brand={b} />)}
            </div>

            {/* Unassigned alert */}
            {m && m.unassignedVentures > 0 && (
              <div className="mt-6 p-4 rounded-lg border flex items-start gap-3"
                style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {m.unassignedVentures} unassigned venture{m.unassignedVentures !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    These venture candidates have not been assigned to a Domain Brand. Use the{" "}
                    <button className="underline font-medium" onClick={() => navigate("/portfolio/pipeline")}>
                      Venture Pipeline
                    </button>{" "}
                    to review and assign them.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreateBrandDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
