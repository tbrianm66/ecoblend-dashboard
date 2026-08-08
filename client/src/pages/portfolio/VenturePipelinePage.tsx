/**
 * Phase 3 — Venture Pipeline Page
 * Cross-brand venture pipeline with filtering.
 * Route: /portfolio/pipeline
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Search, ExternalLink, Plus, Building2, AlertCircle, CheckCircle2, Clock, XCircle, Archive } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  Active:                  "bg-green-100 text-green-800 border-green-200",
  Hold:                    "bg-amber-100 text-amber-800 border-amber-200",
  Killed:                  "bg-red-100 text-red-700 border-red-200",
  Rejected:                "bg-red-100 text-red-700 border-red-200",
  Merged:                  "bg-purple-100 text-purple-800 border-purple-200",
  Transferred:             "bg-blue-100 text-blue-800 border-blue-200",
  Licensed:                "bg-teal-100 text-teal-800 border-teal-200",
  Partnered:               "bg-indigo-100 text-indigo-800 border-indigo-200",
  Research_Programme:      "bg-sky-100 text-sky-800 border-sky-200",
  Productisation_Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Spin-Out_Candidate":    "bg-violet-100 text-violet-800 border-violet-200",
  Archived:                "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  Active:                  <CheckCircle2 size={11} className="text-green-600" />,
  Hold:                    <Clock size={11} className="text-amber-600" />,
  Killed:                  <XCircle size={11} className="text-red-600" />,
  Productisation_Approved: <CheckCircle2 size={11} className="text-emerald-600" />,
  Archived:                <Archive size={11} className="text-gray-500" />,
};

const BRAND_ACCENT: Record<string, string> = {
  TONE: "#56A837", REAL: "#3B85BA", BEBUS: "#F69111", ECOCOMP: "#8B5CF6",
};

const ALL_STATUSES = [
  "Active","Hold","Killed","Rejected","Merged","Transferred","Licensed","Partnered",
  "Research_Programme","Productisation_Approved","Spin-Out_Candidate","Archived",
];

// ── Create Venture Dialog ─────────────────────────────────────────────────────

function CreateVentureDialog({
  open, onClose, brands,
}: { open: boolean; onClose: () => void; brands: any[] }) {
  const [form, setForm] = useState({
    id: "", workingTitle: "", problemHypothesis: "", targetCustomer: "",
    targetUser: "", sector: "", owner: "", domainBrandId: "none", brandCode: "UNASSIGNED",
  });

  const utils = trpc.useUtils();
  const create = trpc.ventureCandidateOps.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Venture Candidate created — ${data.ventureRef}`);
      utils.portfolioPipeline.venturePipeline.invalidate();
      utils.domainBrands.listVentures.invalidate();
      onClose();
      setForm({ id: "", workingTitle: "", problemHypothesis: "", targetCustomer: "", targetUser: "", sector: "", owner: "", domainBrandId: "none", brandCode: "UNASSIGNED" });
    },
    onError: (e) => toast.error(e.message),
  });

  function field(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })); }

  const selectedBrandId = form.domainBrandId === "none" || form.domainBrandId === "new" ? null : parseInt(form.domainBrandId);
  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  const brandAssignmentStatus = form.domainBrandId === "none" ? "Unassigned"
    : form.domainBrandId === "new" ? "Potential_New_Domain_Brand" : "Confirmed_Brand";

  function handleSubmit() {
    create.mutate({
      id: form.id || `vc-${Date.now()}`,
      workingTitle: form.workingTitle,
      problemHypothesis: form.problemHypothesis || undefined,
      targetCustomer: form.targetCustomer || undefined,
      targetUser: form.targetUser || undefined,
      sector: form.sector || undefined,
      owner: form.owner || undefined,
      domainBrandId: selectedBrandId,
      brandAssignmentStatus: brandAssignmentStatus as any,
      brandCode: selectedBrand?.brandCode ?? form.brandCode,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus size={16} style={{ color: "#56A837" }} />
            New Venture Candidate
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            Domain Brand assignment is optional — ventures may start Unassigned.
          </p>
        </DialogHeader>

        <div className="space-y-3 py-1 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <Label className="text-xs font-medium">Working Title *</Label>
            <Input placeholder="e.g. Bio-Composite Studio Acoustic Materials" value={form.workingTitle}
              onChange={e => field("workingTitle", e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs font-medium">Domain Brand</Label>
            <Select value={form.domainBrandId} onValueChange={v => {
              const brand = brands.find(b => b.id === parseInt(v));
              field("domainBrandId", v);
              if (brand) field("brandCode", brand.brandCode);
              else field("brandCode", v === "new" ? "UNASSIGNED" : "UNASSIGNED");
            }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select brand…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="flex items-center gap-2"><AlertCircle size={13} className="text-gray-400" /> Unassigned</span>
                </SelectItem>
                {brands.map(b => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: BRAND_ACCENT[b.brandCode] ?? "#56A837" }} />
                      {b.brandCode} — {b.brandName}
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value="new">
                  <span className="flex items-center gap-2 text-purple-700"><Plus size={13} /> Potential New Domain Brand</span>
                </SelectItem>
              </SelectContent>
            </Select>
            {form.domainBrandId === "none" && (
              <p className="text-[10px] text-amber-600 mt-1">This venture will be unassigned. You can assign a brand later via the Brand Fit Assessment.</p>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium">Problem / Opportunity</Label>
            <textarea value={form.problemHypothesis} onChange={e => field("problemHypothesis", e.target.value)}
              className="mt-1 w-full text-sm border rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="What problem does this venture solve?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Target Customer</Label>
              <Input placeholder="Who pays?" value={form.targetCustomer} onChange={e => field("targetCustomer", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Target User</Label>
              <Input placeholder="Who uses it?" value={form.targetUser} onChange={e => field("targetUser", e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Sector</Label>
              <Input placeholder="e.g. Creative Industries" value={form.sector} onChange={e => field("sector", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Owner</Label>
              <Input placeholder="Venture owner" value={form.owner} onChange={e => field("owner", e.target.value)} className="mt-1" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.workingTitle || create.isPending} onClick={handleSubmit}
            style={{ background: "#56A837", color: "#fff" }}>
            {create.isPending ? "Creating…" : "Create Venture Candidate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function VenturePipelinePage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const brands = trpc.domainBrands.list.useQuery({});
  const pipeline = trpc.portfolioPipeline.venturePipeline.useQuery({
    unassignedOnly: filterBrand === "unassigned" ? true : undefined,
    brandId: filterBrand !== "all" && filterBrand !== "unassigned" ? parseInt(filterBrand) : undefined,
    candidateStatus: filterStatus !== "all" ? filterStatus : undefined,
  });

  const ventures = (pipeline.data ?? []).filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.name?.toLowerCase().includes(q) ||
      v.ventureRef?.toLowerCase().includes(q) ||
      v.sector?.toLowerCase().includes(q);
  });

  const brandMap = Object.fromEntries((brands.data ?? []).map(b => [b.id, b]));

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
              Venture Pipeline
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              All venture candidates across every Domain Brand — with filtering and status tracking.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/portfolio/brands")} className="gap-1.5 text-xs">
              <Building2 size={13} /> Domain Brands
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs" style={{ background: "#56A837", color: "#fff" }}>
              <Plus size={13} /> New Venture
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-8 py-3 flex items-center gap-3" style={{ borderColor: "#e5e7eb" }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search ventures…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterBrand} onValueChange={setFilterBrand}>
          <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="All brands" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            <SelectItem value="unassigned">Unassigned Only</SelectItem>
            {(brands.data ?? []).map(b => <SelectItem key={b.id} value={String(b.id)}>{b.brandCode}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-400 ml-auto">{ventures.length} venture{ventures.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="px-8 py-4">
        {pipeline.isLoading ? (
          <div className="text-sm text-gray-400 text-center py-16">Loading pipeline…</div>
        ) : ventures.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <TrendingUp size={40} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No ventures match your filters.</p>
            <Button size="sm" className="mt-4 gap-1" style={{ background: "#56A837", color: "#fff" }} onClick={() => setShowCreate(true)}>
              <Plus size={13} /> New Venture
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b text-[10px] font-semibold uppercase tracking-widest text-gray-400"
              style={{ borderColor: "#f0f0f0", background: "#fafafa" }}>
              <div className="col-span-1">Ref</div>
              <div className="col-span-3">Venture Candidate</div>
              <div className="col-span-2">Domain Brand</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Stage</div>
              <div className="col-span-1 text-center">VRL</div>
              <div className="col-span-1 text-center">TRL</div>
              <div className="col-span-1"></div>
            </div>

            {ventures.map((v, i) => {
              const brand = v.domainBrandId ? brandMap[v.domainBrandId] : null;
              const accent = brand ? (BRAND_ACCENT[brand.brandCode] ?? "#56A837") : "#9ca3af";
              const statusStyle = STATUS_STYLE[v.candidateStatus ?? "Active"] ?? "bg-gray-100 text-gray-600";

              return (
                <div key={v.id}
                  className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors border-b last:border-0"
                  style={{ borderColor: "#f5f5f5" }}>

                  <div className="col-span-1">
                    {v.ventureRef ? (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{ background: `${accent}18`, color: accent }}>{v.ventureRef}</span>
                    ) : (
                      <span className="text-[9px] text-gray-300 font-mono">—</span>
                    )}
                  </div>

                  <div className="col-span-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{v.name}</p>
                    {v.sector && <p className="text-[10px] text-gray-400 truncate">{v.sector}</p>}
                  </div>

                  <div className="col-span-2">
                    {brand ? (
                      <button
                        onClick={() => navigate(`/portfolio/brands/${brand.brandCode}`)}
                        className="flex items-center gap-1.5 text-xs font-medium hover:underline"
                        style={{ color: accent }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
                        {brand.brandCode}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <AlertCircle size={11} /> Unassigned
                      </span>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Badge variant="outline" className={`text-[10px] gap-1 px-2 py-0.5 ${statusStyle}`}>
                      {STATUS_ICON[v.candidateStatus ?? ""] ?? null}
                      {(v.candidateStatus ?? "Active").replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="col-span-1">
                    <span className="text-[10px] text-gray-500 capitalize">{v.currentStage?.replace(/_/g, " ") ?? "—"}</span>
                  </div>

                  <div className="col-span-1 text-center">
                    <span className="text-sm font-bold" style={{ color: "#56A837" }}>{v.vrl ?? "—"}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-bold" style={{ color: "#3B85BA" }}>{v.trl ?? "—"}</span>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => navigate(`/venture/${v.id}`)}
                      className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="Open venture">
                      <ExternalLink size={13} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateVentureDialog open={showCreate} onClose={() => setShowCreate(false)} brands={brands.data ?? []} />
    </div>
  );
}
