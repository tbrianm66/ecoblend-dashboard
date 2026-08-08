/**
 * Phase 3 — Domain Brand Detail Page
 * Shows full brand profile with tabs: Overview, Venture Pipeline,
 * Productisation Gate, Product Portfolio, Brand Fit.
 * Route: /portfolio/brands/:brandCode
 */
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Building2, TrendingUp, Package, Layers, Plus, ArrowLeft, ArrowRight,
  CheckCircle2, Clock, XCircle, AlertCircle, Archive, ExternalLink,
  GitBranch, ShieldCheck, Activity, BarChart2, Star, Edit2, ChevronRight,
  Lightbulb, Target, Zap,
} from "lucide-react";

// ── Color constants ───────────────────────────────────────────────────────────

const BRAND_ACCENT: Record<string, string> = {
  TONE: "#56A837", REAL: "#3B85BA", BEBUS: "#F69111", ECOCOMP: "#8B5CF6",
};

const STATUS_STYLE: Record<string, string> = {
  Active:                  "bg-green-100 text-green-800 border-green-200",
  Hold:                    "bg-amber-100 text-amber-800 border-amber-200",
  Killed:                  "bg-red-100 text-red-700 border-red-200",
  Rejected:                "bg-red-100 text-red-700 border-red-200",
  Merged:                  "bg-purple-100 text-purple-800 border-purple-200",
  Productisation_Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Archived:                "bg-gray-100 text-gray-600 border-gray-200",
};

const DECISION_STYLE: Record<string, string> = {
  Approve:                          "bg-green-100 text-green-800",
  Hold:                             "bg-amber-100 text-amber-800",
  Reject:                           "bg-red-100 text-red-700",
  Return_for_Evidence:              "bg-blue-100 text-blue-800",
  Alternative_Commercialisation_Route: "bg-purple-100 text-purple-800",
};

const PROG_STATUS_STYLE: Record<string, string> = {
  Approved:             "bg-green-100 text-green-800",
  Active:               "bg-emerald-100 text-emerald-800",
  Concept_Development:  "bg-blue-100 text-blue-800",
  Paused:               "bg-amber-100 text-amber-800",
  Cancelled:            "bg-red-100 text-red-700",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="py-3 border-b last:border-0" style={{ borderColor: "#f0f0f0" }}>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-700 leading-relaxed">{value}</dd>
    </div>
  );
}

function MetricChip({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="text-center px-4 py-3 rounded-xl" style={{ background: `${accent}08`, border: `1px solid ${accent}22` }}>
      <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
      <div className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

// ── Create Venture Dialog (inline, reuses pipeline's implementation) ──────────

function CreateVentureDialog({ open, onClose, brandId, brandCode, utils }: {
  open: boolean; onClose: () => void;
  brandId: number; brandCode: string; utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [form, setForm] = useState({
    workingTitle: "", problemHypothesis: "", targetCustomer: "", targetUser: "", sector: "", owner: "",
  });
  const create = trpc.ventureCandidateOps.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Venture Candidate ${data.ventureRef} created under ${brandCode}`);
      utils.domainBrands.listVentures.invalidate();
      utils.domainBrands.portfolioSummary.invalidate();
      onClose();
      setForm({ workingTitle: "", problemHypothesis: "", targetCustomer: "", targetUser: "", sector: "", owner: "" });
    },
    onError: (e) => toast.error(e.message),
  });
  function f(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus size={16} style={{ color: BRAND_ACCENT[brandCode] ?? "#56A837" }} />
            New Venture Candidate
            <Badge variant="outline" className="ml-1 text-[10px]" style={{ borderColor: BRAND_ACCENT[brandCode] ?? "#56A837", color: BRAND_ACCENT[brandCode] ?? "#56A837" }}>{brandCode}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs font-medium">Working Title *</Label>
            <Input value={form.workingTitle} onChange={e => f("workingTitle", e.target.value)} className="mt-1" placeholder="e.g. Bio-Composite Studio Panels" />
          </div>
          <div>
            <Label className="text-xs font-medium">Problem / Opportunity</Label>
            <textarea value={form.problemHypothesis} onChange={e => f("problemHypothesis", e.target.value)}
              className="mt-1 w-full text-sm border rounded-md px-3 py-2 h-16 resize-none focus:outline-none focus:ring-1" placeholder="What problem does this solve?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-medium">Target Customer</Label><Input value={form.targetCustomer} onChange={e => f("targetCustomer", e.target.value)} className="mt-1" placeholder="Who pays?" /></div>
            <div><Label className="text-xs font-medium">Target User</Label><Input value={form.targetUser} onChange={e => f("targetUser", e.target.value)} className="mt-1" placeholder="Who uses?" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-medium">Sector</Label><Input value={form.sector} onChange={e => f("sector", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs font-medium">Owner</Label><Input value={form.owner} onChange={e => f("owner", e.target.value)} className="mt-1" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.workingTitle || create.isPending}
            onClick={() => create.mutate({ id: `vc-${brandCode.toLowerCase()}-${Date.now()}`, workingTitle: form.workingTitle, problemHypothesis: form.problemHypothesis || undefined, targetCustomer: form.targetCustomer || undefined, targetUser: form.targetUser || undefined, sector: form.sector || undefined, owner: form.owner || undefined, domainBrandId: brandId, brandAssignmentStatus: "Confirmed_Brand", brandCode })}
            style={{ background: BRAND_ACCENT[brandCode] ?? "#56A837", color: "#fff" }}>
            {create.isPending ? "Creating…" : "Create Venture Candidate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Productisation Gate Dialog ────────────────────────────────────────────────

function ProductisationGateDialog({ open, onClose, ventureId, ventureName, utils }: {
  open: boolean; onClose: () => void;
  ventureId: string; ventureName: string; utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [form, setForm] = useState({
    decision: "Approve" as const,
    decisionDate: new Date().toISOString().slice(0, 10),
    decisionMaker: "", rationale: "", conditions: "", approvalReference: "",
    programmeName: "", programmeStatus: "Approved",
  });
  const [step, setStep] = useState<"decision" | "programme">("decision");

  const recordDecision = trpc.productisationGate.recordDecision.useMutation({
    onSuccess: (data) => {
      if (form.decision === "Approve") setStep("programme");
      else {
        toast.success("Productisation decision recorded");
        utils.productisationGate.listForVenture.invalidate();
        utils.domainBrands.listVentures.invalidate();
        onClose();
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const decisions = trpc.productisationGate.listForVenture.useQuery({ ventureId }, { enabled: !!ventureId });
  const lastDecisionId = decisions.data?.[0]?.id;

  const brands = trpc.domainBrands.list.useQuery({});
  const [programmeBrandId, setProgrammeBrandId] = useState<string>("");

  const createProgramme = trpc.productProgrammes.create.useMutation({
    onSuccess: (prog) => {
      toast.success(`Product Programme ${prog.programmeRef} created`);
      utils.productProgrammes.list.invalidate();
      utils.domainBrands.listProgrammes.invalidate();
      utils.domainBrands.listVentures.invalidate();
      onClose();
      setStep("decision");
    },
    onError: (e) => toast.error(e.message),
  });

  function f(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setStep("decision"); }}>
      <DialogContent className="max-w-md">
        {step === "decision" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck size={16} style={{ color: "#56A837" }} /> Productisation Gate Decision
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-1">
                Record a governed decision for <strong>{ventureName}</strong>. An Approve decision will create a Product Programme.
              </p>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div>
                <Label className="text-xs font-medium">Decision *</Label>
                <Select value={form.decision} onValueChange={v => f("decision", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Approve","Hold","Reject","Return_for_Evidence","Alternative_Commercialisation_Route"].map(d =>
                      <SelectItem key={d} value={d}>{d.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Decision Date *</Label>
                  <Input type="date" value={form.decisionDate} onChange={e => f("decisionDate", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Decision Maker</Label>
                  <Input value={form.decisionMaker} onChange={e => f("decisionMaker", e.target.value)} className="mt-1" placeholder="Name / role" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Rationale</Label>
                <textarea value={form.rationale} onChange={e => f("rationale", e.target.value)}
                  className="mt-1 w-full text-sm border rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Conditions</Label>
                  <Input value={form.conditions} onChange={e => f("conditions", e.target.value)} className="mt-1" placeholder="Optional" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Approval Reference</Label>
                  <Input value={form.approvalReference} onChange={e => f("approvalReference", e.target.value)} className="mt-1" placeholder="e.g. GOV-2026-001" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button disabled={recordDecision.isPending}
                onClick={() => recordDecision.mutate({
                  ventureId, decision: form.decision as any,
                  decisionDate: new Date(form.decisionDate).toISOString(),
                  decisionMaker: form.decisionMaker || undefined,
                  rationale: form.rationale || undefined, conditions: form.conditions || undefined,
                  approvalReference: form.approvalReference || undefined,
                })}
                style={{ background: form.decision === "Approve" ? "#56A837" : "#1a1a2e", color: "#fff" }}>
                {recordDecision.isPending ? "Recording…" : form.decision === "Approve" ? "Approve & Continue →" : "Record Decision"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package size={16} style={{ color: "#56A837" }} /> Create Product Programme
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-1">
                The productisation decision is approved. Now create the Product Programme that this venture will generate.
              </p>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div>
                <Label className="text-xs font-medium">Programme Name *</Label>
                <Input value={form.programmeName} onChange={e => f("programmeName", e.target.value)} className="mt-1" placeholder="e.g. TONE BioAcoustic" />
              </div>
              <div>
                <Label className="text-xs font-medium">Domain Brand</Label>
                <Select value={programmeBrandId} onValueChange={setProgrammeBrandId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select brand…" /></SelectTrigger>
                  <SelectContent>
                    {(brands.data ?? []).map(b => <SelectItem key={b.id} value={String(b.id)}>{b.brandCode} — {b.brandName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Initial Status</Label>
                <Select value={form.programmeStatus} onValueChange={v => f("programmeStatus", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Approved","Concept_Development","Prototype_Development","Engineering_Development"].map(s =>
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("decision")}>← Back</Button>
              <Button disabled={!form.programmeName || createProgramme.isPending}
                onClick={() => {
                  const selectedBrand = (brands.data ?? []).find(b => String(b.id) === programmeBrandId);
                  createProgramme.mutate({
                    ventureId,
                    domainBrandId: programmeBrandId ? parseInt(programmeBrandId) : undefined,
                    productisationDecisionId: lastDecisionId,
                    programmeName: form.programmeName,
                    programmeStatus: form.programmeStatus,
                    approvalDate: new Date().toISOString(),
                    brandCode: selectedBrand?.brandCode ?? "UNASSIGNED",
                  });
                }}
                style={{ background: "#56A837", color: "#fff" }}>
                {createProgramme.isPending ? "Creating…" : "Create Programme"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Brand Fit Dialog ──────────────────────────────────────────────────────────

function BrandFitDialog({ open, onClose, ventureId, ventureName, brandId, brandCode, utils }: {
  open: boolean; onClose: () => void;
  ventureId: string; ventureName: string;
  brandId: number; brandCode: string;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const dims = [
    { key: "strategicFit", label: "Strategic Fit" },
    { key: "sectorFit", label: "Sector Fit" },
    { key: "customerFit", label: "Customer Fit" },
    { key: "userFit", label: "User Fit" },
    { key: "technologyFit", label: "Technology Fit" },
    { key: "ipFit", label: "IP Fit" },
    { key: "commercialChannelFit", label: "Commercial Channel Fit" },
    { key: "missionAlignment", label: "Mission Alignment" },
    { key: "capabilityFit", label: "Capability Fit" },
    { key: "supplyChainFit", label: "Supply Chain Fit" },
    { key: "portfolioSynergy", label: "Portfolio Synergy" },
    { key: "crossBrandPotential", label: "Cross-Brand Potential" },
  ];
  const riskDims = [
    { key: "cannibalisationRisk", label: "Cannibalisation Risk" },
    { key: "brandDilutionRisk", label: "Brand Dilution Risk" },
  ];

  const initScores: Record<string, number> = Object.fromEntries([...dims, ...riskDims].map(d => [d.key, 5]));
  const [scores, setScores] = useState<Record<string, number>>(initScores);
  const [rationale, setRationale] = useState("");
  const [potentialNew, setPotentialNew] = useState(false);
  const [govReview, setGovReview] = useState(false);

  const accent = BRAND_ACCENT[brandCode] ?? "#56A837";

  const createAssessment = trpc.brandFitAssessment.create.useMutation({
    onSuccess: () => {
      toast.success("Brand Fit Assessment recorded");
      utils.brandFitAssessment.listForVenture.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function setScore(key: string, v: number) { setScores(s => ({ ...s, [key]: v })); }

  // Compute preview fit score
  const posAvg = dims.reduce((s, d) => s + scores[d.key], 0) / dims.length;
  const riskPenalty = riskDims.reduce((s, d) => s + scores[d.key], 0) / riskDims.length * 0.5;
  const previewScore = Math.max(0, Math.round((posAvg - riskPenalty) * 10) / 10);
  const previewConf = previewScore >= 7 ? "High" : previewScore >= 4 ? "Medium" : "Low";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star size={16} style={{ color: accent }} /> Brand Fit Assessment
          </DialogTitle>
          <p className="text-xs text-gray-500">
            Scoring <strong>{ventureName}</strong> against <strong>{brandCode}</strong>. Rate each dimension 0–10.
          </p>
        </DialogHeader>

        {/* Live score preview */}
        <div className="flex items-center justify-center gap-6 py-3 rounded-xl mb-2"
          style={{ background: `${accent}0a`, border: `1px solid ${accent}22` }}>
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: accent }}>{previewScore.toFixed(1)}</div>
            <div className="text-[9px] uppercase tracking-widest text-gray-400">Fit Score</div>
          </div>
          <div className="text-center">
            <Badge className={`text-xs ${previewConf === "High" ? "bg-green-100 text-green-800" : previewConf === "Medium" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`}>{previewConf}</Badge>
            <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">Confidence</div>
          </div>
        </div>

        {/* Positive dimensions */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Fit Dimensions (0 = No Fit, 10 = Perfect Fit)</p>
          {dims.map(d => (
            <div key={d.key} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-44 shrink-0">{d.label}</span>
              <input type="range" min={0} max={10} step={1} value={scores[d.key]}
                onChange={e => setScore(d.key, parseInt(e.target.value))}
                className="flex-1 accent-green-500" />
              <span className="text-xs font-bold w-5 text-right" style={{ color: accent }}>{scores[d.key]}</span>
            </div>
          ))}
        </div>

        {/* Risk dimensions */}
        <div className="space-y-2 mt-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Risk Dimensions (0 = No Risk, 10 = High Risk)</p>
          {riskDims.map(d => (
            <div key={d.key} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-44 shrink-0">{d.label}</span>
              <input type="range" min={0} max={10} step={1} value={scores[d.key]}
                onChange={e => setScore(d.key, parseInt(e.target.value))}
                className="flex-1 accent-red-400" />
              <span className="text-xs font-bold w-5 text-right text-red-500">{scores[d.key]}</span>
            </div>
          ))}
        </div>

        {/* Rationale */}
        <div className="mt-3">
          <Label className="text-xs font-medium">Rationale</Label>
          <textarea value={rationale} onChange={e => setRationale(e.target.value)}
            className="mt-1 w-full text-sm border rounded-md px-3 py-2 h-16 resize-none focus:outline-none focus:ring-1" placeholder="Assessment rationale…" />
        </div>

        {/* Flags */}
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={potentialNew} onChange={e => setPotentialNew(e.target.checked)} className="rounded" />
            Potential New Domain Brand Required
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={govReview} onChange={e => setGovReview(e.target.checked)} className="rounded" />
            Governance Review Required
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={createAssessment.isPending}
            onClick={() => createAssessment.mutate({
              ventureId, assessedBrandId: brandId, rationale: rationale || undefined,
              potentialNewBrandRequired: potentialNew, governanceReviewRequired: govReview,
              ...Object.fromEntries([...dims, ...riskDims].map(d => [d.key, scores[d.key]])) as any,
            })}
            style={{ background: accent, color: "#fff" }}>
            {createAssessment.isPending ? "Saving…" : "Save Assessment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ brand }: { brand: any }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Brand Identity</h3>
        <dl className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
          <InfoRow label="Sector" value={brand.sector} />
          <InfoRow label="Sub-Sector" value={brand.subSector} />
          <InfoRow label="Legal Owner" value={brand.legalOwner} />
          <InfoRow label="Website" value={brand.websiteUrl} />
          <InfoRow label="Description" value={brand.description} />
        </dl>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Strategic Position</h3>
        <dl className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
          <InfoRow label="Brand Thesis" value={brand.brandThesis} />
          <InfoRow label="Mission" value={brand.mission} />
          <InfoRow label="Target Markets" value={brand.targetMarkets} />
          <InfoRow label="Target Customers" value={brand.targetCustomers} />
          <InfoRow label="Target Users" value={brand.targetUsers} />
        </dl>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Capabilities & Technology</h3>
        <dl className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
          <InfoRow label="Core Capabilities" value={brand.coreCapabilities} />
          <InfoRow label="Technology Domains" value={brand.technologyDomains} />
          <InfoRow label="IP Domains" value={brand.ipDomains} />
          <InfoRow label="Commercial Channels" value={brand.commercialChannels} />
        </dl>
      </div>
    </div>
  );
}

// ── Venture Pipeline Tab ──────────────────────────────────────────────────────

function VenturePipelineTab({ brandId, brandCode, accent, utils }: {
  brandId: number; brandCode: string; accent: string; utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [gateVenture, setGateVenture] = useState<{ id: string; name: string } | null>(null);
  const [fitVenture, setFitVenture] = useState<{ id: string; name: string } | null>(null);

  const ventures = trpc.domainBrands.listVentures.useQuery({ brandId, status: filterStatus !== "all" ? filterStatus as any : undefined });
  const updateStatus = trpc.ventureCandidateOps.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); ventures.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const allStatuses = ["Active","Hold","Killed","Rejected","Merged","Transferred","Licensed","Partnered","Research_Programme","Productisation_Approved","Spin-Out_Candidate","Archived"];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {allStatuses.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs" style={{ background: accent, color: "#fff" }}>
          <Plus size={13} /> New Venture Candidate
        </Button>
      </div>

      {ventures.isLoading ? (
        <div className="text-sm text-gray-400 text-center py-12">Loading ventures…</div>
      ) : !ventures.data?.length ? (
        <div className="flex flex-col items-center py-16 text-center bg-white rounded-xl border" style={{ borderColor: "#e5e7eb" }}>
          <Lightbulb size={36} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-3">No venture candidates under {brandCode} yet.</p>
          <Button size="sm" onClick={() => setShowCreate(true)} style={{ background: accent, color: "#fff" }} className="gap-1.5 text-xs">
            <Plus size={13} /> Create First Venture
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          {ventures.data.map((v, i) => {
            const statusStyle = STATUS_STYLE[v.candidateStatus ?? "Active"] ?? "bg-gray-100 text-gray-600";
            const canPromote = v.candidateStatus === "Active" || v.candidateStatus === "Productisation_Approved";

            return (
              <div key={v.id} className="px-5 py-4 border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: "#f5f5f5" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {v.ventureRef && (
                      <span className="text-[9px] font-mono font-bold px-2 py-1 rounded shrink-0 mt-0.5"
                        style={{ background: `${accent}14`, color: accent }}>{v.ventureRef}</span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 truncate">{v.name}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(86,168,55,0.08)", color: "#56A837" }}>VENTURE CANDIDATE</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${statusStyle}`}>
                          {(v.candidateStatus ?? "Active").replace(/_/g," ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                        {v.sector && <span>{v.sector}</span>}
                        {v.currentStage && <span className="capitalize">{v.currentStage.replace(/_/g," ")}</span>}
                        {v.vrl && <span>VRL <strong style={{ color: "#56A837" }}>{v.vrl}</strong></span>}
                        {v.trl && <span>TRL <strong style={{ color: "#3B85BA" }}>{v.trl}</strong></span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setFitVenture({ id: v.id, name: v.name })}
                      className="text-[10px] px-2.5 py-1 rounded-md border font-medium hover:bg-gray-50"
                      style={{ borderColor: "#e5e7eb", color: "#6b7280" }}>
                      Brand Fit
                    </button>
                    {canPromote && (
                      <button onClick={() => setGateVenture({ id: v.id, name: v.name })}
                        className="text-[10px] px-2.5 py-1 rounded-md font-medium"
                        style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}33` }}>
                        Productisation Gate
                      </button>
                    )}
                    <Select value={v.candidateStatus ?? "Active"} onValueChange={s => updateStatus.mutate({ ventureId: v.id, candidateStatus: s as any })}>
                      <SelectTrigger className="h-7 text-[10px] w-28 border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {allStatuses.map(s => <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g," ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <button onClick={() => navigate(`/venture/${v.id}`)} className="p-1.5 rounded hover:bg-gray-100" title="Open venture">
                      <ExternalLink size={13} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateVentureDialog open={showCreate} onClose={() => setShowCreate(false)} brandId={brandId} brandCode={brandCode} utils={utils} />
      {gateVenture && (
        <ProductisationGateDialog open={!!gateVenture} onClose={() => setGateVenture(null)}
          ventureId={gateVenture.id} ventureName={gateVenture.name} utils={utils} />
      )}
      {fitVenture && (
        <BrandFitDialog open={!!fitVenture} onClose={() => setFitVenture(null)}
          ventureId={fitVenture.id} ventureName={fitVenture.name}
          brandId={brandId} brandCode={brandCode} utils={utils} />
      )}
    </div>
  );
}

// ── Product Portfolio Tab ─────────────────────────────────────────────────────

function ProductPortfolioTab({ brandId, accent }: { brandId: number; accent: string }) {
  const [, navigate] = useLocation();
  const programmes = trpc.productProgrammes.list.useQuery({ brandId });

  if (programmes.isLoading) return <div className="text-sm text-gray-400 text-center py-12">Loading…</div>;
  if (!programmes.data?.length) return (
    <div className="flex flex-col items-center py-16 text-center bg-white rounded-xl border" style={{ borderColor: "#e5e7eb" }}>
      <Package size={36} className="text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">No Product Programmes yet.</p>
      <p className="text-xs text-gray-400 mt-1">Approve a venture through the Productisation Gate to create one.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {programmes.data.map(prog => (
        <div key={prog.id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                  style={{ background: `${accent}14`, color: accent }}>{prog.programmeRef}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(59,133,186,0.08)", color: "#3B85BA" }}>PRODUCT PROGRAMME</span>
                <Badge variant="outline" className={`text-[10px] ${PROG_STATUS_STYLE[prog.programmeStatus] ?? "bg-gray-100 text-gray-600"}`}>
                  {prog.programmeStatus.replace(/_/g, " ")}
                </Badge>
              </div>
              <h3 className="text-base font-semibold text-gray-900">{prog.programmeName}</h3>
              {prog.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{prog.description}</p>}
            </div>
            <button onClick={() => navigate(`/venture/${prog.ventureId}`)}
              className="text-[10px] px-2.5 py-1 rounded-md border font-medium hover:bg-gray-50 gap-1 flex items-center"
              style={{ borderColor: "#e5e7eb", color: "#6b7280" }}>
              <ExternalLink size={11} /> Source Venture
            </button>
          </div>
          {prog.approvalDate && (
            <p className="text-[10px] text-gray-400">Approved {new Date(prog.approvalDate).toLocaleDateString()}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Productisation Decisions Tab ──────────────────────────────────────────────

function ProductisationTab({ brandId, brandCode, accent, utils }: {
  brandId: number; brandCode: string; accent: string; utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [gateVenture, setGateVenture] = useState<{ id: string; name: string } | null>(null);
  const ventures = trpc.domainBrands.listVentures.useQuery({ brandId });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500">Select a venture candidate to record a Productisation Gate decision.</p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden mb-4" style={{ borderColor: "#e5e7eb" }}>
        {(ventures.data ?? []).filter(v => ["Active","Hold","Productisation_Approved"].includes(v.candidateStatus ?? "Active")).map(v => (
          <div key={v.id} className="flex items-center justify-between px-5 py-3.5 border-b last:border-0 hover:bg-gray-50" style={{ borderColor: "#f5f5f5" }}>
            <div>
              <div className="flex items-center gap-2">
                {v.ventureRef && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${accent}14`, color: accent }}>{v.ventureRef}</span>}
                <span className="text-sm font-medium text-gray-900">{v.name}</span>
                <Badge variant="outline" className={`text-[10px] ${STATUS_STYLE[v.candidateStatus ?? "Active"] ?? ""}`}>{(v.candidateStatus ?? "Active").replace(/_/g," ")}</Badge>
              </div>
              <div className="flex gap-3 mt-0.5 text-[10px] text-gray-400">
                {v.vrl && <span>VRL {v.vrl}</span>}
                {v.trl && <span>TRL {v.trl}</span>}
              </div>
            </div>
            <Button size="sm" onClick={() => setGateVenture({ id: v.id, name: v.name })}
              className="gap-1.5 text-xs" style={{ background: accent, color: "#fff" }}>
              <ShieldCheck size={12} /> Open Gate
            </Button>
          </div>
        ))}
        {(ventures.data ?? []).filter(v => ["Active","Hold","Productisation_Approved"].includes(v.candidateStatus ?? "Active")).length === 0 && (
          <div className="px-5 py-8 text-sm text-gray-400 text-center">No eligible ventures for productisation gate.</div>
        )}
      </div>

      {gateVenture && (
        <ProductisationGateDialog open={!!gateVenture} onClose={() => setGateVenture(null)}
          ventureId={gateVenture.id} ventureName={gateVenture.name} utils={utils} />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DomainBrandDetail() {
  const params = useParams<{ brandCode: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const brand = trpc.domainBrands.get.useQuery({ brandCode: params.brandCode?.toUpperCase() });
  const summary = trpc.domainBrands.portfolioSummary.useQuery(
    { brandId: brand.data?.id ?? 0 },
    { enabled: !!brand.data?.id }
  );
  const utils = trpc.useUtils();

  if (brand.isLoading) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-gray-400 text-sm">Loading…</p></div>;
  }
  if (!brand.data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <Building2 size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-600">Domain Brand <strong>{params.brandCode}</strong> not found.</p>
        <Button variant="link" onClick={() => navigate("/portfolio/brands")} className="mt-2 text-sm gap-1">
          <ArrowLeft size={13} /> Back to Domain Brands
        </Button>
      </div>
    );
  }

  const b = brand.data;
  const s = summary.data;
  const accent = BRAND_ACCENT[b.brandCode] ?? "#56A837";

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${accent}` }}>
        <button onClick={() => navigate("/portfolio/brands")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3">
          <ArrowLeft size={12} /> Domain Brands
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: `${accent}14`, color: accent, fontFamily: "'Prompt',sans-serif" }}>
                DOMAIN BRAND
              </span>
              <Badge variant="outline" className={`text-[10px] ${BRAND_STATUS_COLORS[b.brandStatus] ?? ""}`}>{b.brandStatus}</Badge>
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#1a1a2e", fontFamily: "'Prompt',sans-serif" }}>{b.brandCode}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{b.brandName}{b.sector ? ` — ${b.sector}` : ""}</p>
          </div>
        </div>

        {/* Metrics */}
        {s && (
          <div className="flex gap-4 mt-5 pt-4 border-t" style={{ borderColor: "#f0f0f0" }}>
            <MetricChip label="Active Ventures" value={s.activeVentures} accent={accent} />
            <MetricChip label="Total Ventures" value={s.totalVentures} accent="#6b7280" />
            <MetricChip label="Killed" value={s.killedVentures} accent={s.killedVentures > 0 ? "#ef4444" : "#9ca3af"} />
            <MetricChip label="Programmes" value={s.programmes} accent="#3B85BA" />
            <MetricChip label="Products" value={s.products} accent="#8B5CF6" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white border" style={{ borderColor: "#e5e7eb" }}>
            {[
              { value: "overview",      label: "Overview",             icon: <Building2 size={13} /> },
              { value: "ventures",      label: "Venture Pipeline",     icon: <TrendingUp size={13} /> },
              { value: "productisation",label: "Productisation Gate",  icon: <ShieldCheck size={13} /> },
              { value: "portfolio",     label: "Product Portfolio",    icon: <Package size={13} /> },
              { value: "fit",           label: "Brand Fit",            icon: <Star size={13} /> },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value}
                className="flex items-center gap-1.5 text-xs data-[state=active]:text-white"
                style={{ ["--tw-ring-color" as any]: accent }}
                data-state={activeTab === t.value ? "active" : "inactive"}>
                {t.icon}{t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab brand={b} />
          </TabsContent>

          <TabsContent value="ventures">
            <VenturePipelineTab brandId={b.id} brandCode={b.brandCode} accent={accent} utils={utils} />
          </TabsContent>

          <TabsContent value="productisation">
            <ProductisationTab brandId={b.id} brandCode={b.brandCode} accent={accent} utils={utils} />
          </TabsContent>

          <TabsContent value="portfolio">
            <ProductPortfolioTab brandId={b.id} accent={accent} />
          </TabsContent>

          <TabsContent value="fit">
            <FitHistoryTab brandId={b.id} brandCode={b.brandCode} accent={accent} utils={utils} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Brand Fit History Tab ─────────────────────────────────────────────────────

function FitHistoryTab({ brandId, brandCode, accent, utils }: {
  brandId: number; brandCode: string; accent: string; utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [fitVenture, setFitVenture] = useState<{ id: string; name: string } | null>(null);
  const ventures = trpc.domainBrands.listVentures.useQuery({ brandId });

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">Run a Brand Fit Assessment to score how well a venture candidate matches this Domain Brand.</p>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        {(ventures.data ?? []).map(v => (
          <div key={v.id} className="flex items-center justify-between px-5 py-3.5 border-b last:border-0 hover:bg-gray-50" style={{ borderColor: "#f5f5f5" }}>
            <div className="flex items-center gap-2">
              {v.ventureRef && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${accent}14`, color: accent }}>{v.ventureRef}</span>}
              <span className="text-sm text-gray-900">{v.name}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setFitVenture({ id: v.id, name: v.name })}
              className="gap-1.5 text-xs">
              <Star size={12} /> Run Assessment
            </Button>
          </div>
        ))}
        {!ventures.data?.length && (
          <div className="px-5 py-8 text-sm text-gray-400 text-center">No ventures to assess.</div>
        )}
      </div>

      {fitVenture && (
        <BrandFitDialog open={!!fitVenture} onClose={() => setFitVenture(null)}
          ventureId={fitVenture.id} ventureName={fitVenture.name}
          brandId={brandId} brandCode={brandCode} utils={utils} />
      )}
    </div>
  );
}

// Shared
const BRAND_STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-800 border-green-200",
  Concept: "bg-blue-100 text-blue-800 border-blue-200",
  Reserved: "bg-amber-100 text-amber-800 border-amber-200",
  Dormant: "bg-gray-100 text-gray-600 border-gray-200",
  Retired: "bg-red-100 text-red-700 border-red-200",
};
