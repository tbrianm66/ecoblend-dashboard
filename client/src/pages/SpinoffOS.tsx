// ============================================================
// SPIN-OFF OS PAGE
// Design: Precision Industrial — VOS design system
// Flow: 5-step wizard → venture config → AI execution plan
// Steps: 1. Select Opportunity  2. Select Founders
//        3. Venture Config      4. Strategic Setup
//        5. Review & Generate
// ============================================================

import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";

import {
  GitBranch, ChevronRight, ChevronLeft, Zap, CheckCircle2,
  Target, Users, Settings, Rocket, FileText, RefreshCw,
  Download, Eye, Edit3, Package, Clock, TrendingUp, DollarSign,
  Award, Shuffle, ArrowRight, Loader2, CheckSquare, XCircle, PlayCircle,
} from "lucide-react";

// ── Step indicator ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Opportunity",  icon: Target },
  { id: 2, label: "Founders",     icon: Users },
  { id: 3, label: "Venture",      icon: Settings },
  { id: 4, label: "Strategy",     icon: TrendingUp },
  { id: 5, label: "Generate",     icon: Rocket },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: done ? "#51AF37" : active ? "#1a2332" : "#f3f4f6",
                  border: active ? "2px solid #51AF37" : "2px solid transparent",
                }}
              >
                {done
                  ? <CheckCircle2 size={16} color="white" />
                  : <Icon size={15} color={active ? "#51AF37" : "#9ca3af"} />
                }
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: active ? "#1a2332" : done ? "#51AF37" : "#9ca3af" }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-12 h-0.5 mb-5 mx-1 transition-all duration-300"
                style={{ background: current > step.id ? "#51AF37" : "#e5e7eb" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Founder selection card ──────────────────────────────────────────────────
function FounderSelectCard({
  profile,
  selected,
  onToggle,
}: {
  profile: { id: number; name: string; currentRole?: string | null; availability?: string | null; industryExpertise?: string | null; yearsExperience?: number | null };
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150"
      style={{
        borderColor: selected ? "#51AF37" : "#e5e7eb",
        background: selected ? "#51AF3708" : "white",
      }}
      onClick={onToggle}
    >
      <Checkbox checked={selected} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
        <p className="text-xs text-gray-500 truncate">
          {profile.currentRole ?? "Founder"} · {profile.industryExpertise?.split(",")[0] ?? "General"} · {profile.yearsExperience ?? 0} yrs
        </p>
      </div>
      {profile.availability && (
        <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
          <Clock size={10} /> {profile.availability.replace("Available in ", "")}
        </span>
      )}
    </div>
  );
}

// ── Execution plan view ─────────────────────────────────────────────────────
function ExecutionPlanView({
  plan,
  onRegenerate,
  isRegenerating,
}: {
  plan: {
    id: number;
    planTitle: string;
    executiveSummary: string;
    fullPlanMarkdown: string;
    status: string;
    createdAt: Date;
  };
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Plan header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            {plan.planTitle}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs" style={{ borderColor: "#51AF37", color: "#51AF37" }}>
              {plan.status}
            </Badge>
            <span className="text-xs text-gray-400">
              Generated {new Date(plan.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={onRegenerate}
          disabled={isRegenerating}
        >
          <RefreshCw size={12} className={isRegenerating ? "animate-spin" : ""} />
          Regenerate
        </Button>
      </div>

      {/* Full plan markdown */}
      <div
        className="prose prose-sm max-w-none p-6 rounded-xl border bg-white"
        style={{ borderColor: "#e5e7eb" }}
      >
        <Streamdown>{plan.fullPlanMarkdown}</Streamdown>
      </div>
    </div>
  );
}

// ── Spin-Off config list item ───────────────────────────────────────────────
function SpinoffListItem({
  config,
  onSelect,
}: {
  config: {
    id: number;
    proposedVentureName: string | null;
    proposedTagline: string | null;
    proposedSector: string | null;
    proposedChannel: string | null;
    status: string | null;
    createdAt: Date;
  };
  onSelect: () => void;
}) {
  const statusColors: Record<string, string> = {
    Draft: "#9ca3af",
    "Under Review": "#F49C13",
    Approved: "#51AF37",
    Rejected: "#ef4444",
    Launched: "#3A97D3",
  };
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:shadow-sm transition-all"
      style={{ borderColor: "#e5e7eb" }}
      onClick={onSelect}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#1a233210" }}>
        <GitBranch size={18} style={{ color: "#1a2332" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">{config.proposedVentureName ?? "Untitled Spin-Off"}</p>
        <p className="text-xs text-gray-500 truncate">{config.proposedTagline ?? "No tagline"}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {config.proposedSector ?? "—"} · {config.proposedChannel ?? "—"}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${statusColors[config.status ?? ""] ?? "#9ca3af"}15`, color: statusColors[config.status ?? ""] ?? "#9ca3af" }}
        >
          {config.status ?? "Draft"}
        </span>
        <span className="text-xs text-gray-400">{new Date(config.createdAt).toLocaleDateString()}</span>
      </div>
      <ChevronRight size={14} className="text-gray-300" />
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function SpinoffOS() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const preOppId = params.get("oppId") ? Number(params.get("oppId")) : null;
  const preFounderIds = params.get("founderIds")
    ? params.get("founderIds")!.split(",").map(Number).filter(Boolean)
    : [];

  // Wizard state
  const [step, setStep] = useState(preOppId ? 2 : 1);
  const [selectedOppId, setSelectedOppId] = useState<number | null>(preOppId);
  const [selectedFounderIds, setSelectedFounderIds] = useState<number[]>(preFounderIds);
  const [ventureName, setVentureName] = useState("");
  const [tagline, setTagline] = useState("");
  const [sector, setSector] = useState("");
  const [channel, setChannel] = useState<"B2B" | "D2C" | "B2B2C">("B2B");
  const [brandColor, setBrandColor] = useState("#51AF37");
  const [classification, setClassification] = useState<"Sustaining" | "Disruptive-NewMarket" | "Disruptive-LowEnd">("Sustaining");
  const [engineOfGrowth, setEngineOfGrowth] = useState<"Sticky" | "Viral" | "Paid">("Sticky");
  const [burnRate, setBurnRate] = useState(15000);
  const [runway, setRunway] = useState(12);
  const [fundingAsk, setFundingAsk] = useState(150000);
  const [mentor, setMentor] = useState("");
  const [charity, setCharity] = useState("");
  const [vbsSupport, setVbsSupport] = useState<"Full Incubation" | "Accelerator" | "Advisory Only">("Full Incubation");

  // If launched from Spin-Out Blueprint, navigate directly to detail view
  const preConfigId = params.get("configId") ? Number(params.get("configId")) : null;

  // Active config / plan
  const [activeConfigId, setActiveConfigId] = useState<number | null>(preConfigId);
  const [viewMode, setViewMode] = useState<"wizard" | "list" | "detail">(preConfigId ? "detail" : "list");
  const [showHistory, setShowHistory] = useState(false);

  // Queries
  const oppsQuery = trpc.poi.listOpportunities.useQuery();
  const profilesQuery = trpc.matching.getAllTalentProfiles.useQuery();
  const configsQuery = trpc.matching.listSpinoffConfigs.useQuery();
  const planQuery = trpc.matching.getExecutionPlan.useQuery(
    { spinoffConfigId: activeConfigId! },
    { enabled: !!activeConfigId }
  );

  // Mutations
  const createConfig = trpc.matching.createSpinoffConfig.useMutation({
    onSuccess: (result) => {
      if (result) setActiveConfigId(result.id);
      toast.success("Spin-off configuration saved");
      configsQuery.refetch();
    },
    onError: () => toast.error("Failed to save configuration"),
  });

  const generatePlan = trpc.matching.generateExecutionPlan.useMutation({
    onSuccess: () => {
      toast.success("Execution plan generated successfully");
      planQuery.refetch();
    },
    onError: () => toast.error("Failed to generate execution plan"),
  });

  const advanceStatus = trpc.matching.advanceSpinoffStatus.useMutation({
    onSuccess: (result) => {
      if (result.newStatus === "Launched" && result.newVentureId) {
        toast.success(
          `Venture launched! "${result.newVentureId}" has been created in the portfolio.`,
          {
            duration: 8000,
            action: {
              label: "View Venture",
              onClick: () => navigate(`/venture/${result.newVentureId}`),
            },
          }
        );
      } else {
        toast.success(`Status updated to ${result.newStatus}`);
      }
      configsQuery.refetch();
      activeConfigQuery.refetch();
    },
    onError: () => toast.error("Failed to update status"),
  });

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [reviewerName, setReviewerName] = useState("");

  const activeConfigQuery = trpc.matching.getSpinoffConfig.useQuery(
    { id: activeConfigId! },
    { enabled: !!activeConfigId }
  );
  const historyQuery = trpc.matching.getSpinoffStatusHistory.useQuery(
    { spinoffConfigId: activeConfigId! },
    { enabled: !!activeConfigId && showHistory }
  );

  const opportunities = oppsQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const configs = configsQuery.data ?? [];

  const selectedOpp = opportunities.find((o: { id: number }) => o.id === selectedOppId);

  const toggleFounder = (id: number) => {
    setSelectedFounderIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreateAndGenerate = async () => {
    if (!selectedOppId || selectedFounderIds.length === 0) {
      toast.error("Select an opportunity and at least one founder");
      return;
    }
    const result = await createConfig.mutateAsync({
      productOpportunityId: selectedOppId,
      founderProfileIds: selectedFounderIds,
      proposedVentureName: ventureName || undefined,
      proposedTagline: tagline || undefined,
      proposedSector: sector || undefined,
      proposedChannel: channel,
      proposedBrandColor: brandColor,
      strategicClassification: classification,
      engineOfGrowth,
      estimatedBurnRateMonthly: burnRate,
      estimatedRunwayMonths: runway,
      fundingAskAmount: fundingAsk,
      nominatedCharity: charity || undefined,
      assignedMentor: mentor || undefined,
      vbsSupportLevel: vbsSupport,
    });
    await generatePlan.mutateAsync({ spinoffConfigId: result!.id });
    setViewMode("detail");
  };

  // ── Wizard view ─────────────────────────────────────────────────────────
  if (viewMode === "wizard") {
    return (
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3A97D315", color: "#3A97D3" }}>
                  Spin-Off OS
                </span>
              </div>
              <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                New Spin-Off Configuration
              </h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setViewMode("list")}>
              <ChevronLeft size={13} /> Back to List
            </Button>
          </div>
        </div>

        <div className="p-8 max-w-3xl">
          <StepBar current={step} />

          {/* Step 1: Opportunity */}
          {step === 1 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Select Product Opportunity
              </h2>
              <p className="text-sm text-gray-500 mb-5">Choose the problem statement or POI opportunity this spin-off will address.</p>
              <div className="grid grid-cols-1 gap-3">
                {opportunities.map((o: { id: number; name: string; sector?: string | null; problemStatement?: string | null; channel?: string | null }) => (
                  <div
                    key={o.id}
                    className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all"
                    style={{
                      borderColor: selectedOppId === o.id ? "#51AF37" : "#e5e7eb",
                      background: selectedOppId === o.id ? "#51AF3708" : "white",
                    }}
                    onClick={() => setSelectedOppId(o.id)}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#51AF3715" }}>
                      <Package size={14} style={{ color: "#51AF37" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{o.name}</p>
                      {o.sector && <p className="text-xs text-gray-500">{o.sector} · {o.channel ?? "—"}</p>}
                      {o.problemStatement && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{o.problemStatement}</p>
                      )}
                    </div>
                    {selectedOppId === o.id && <CheckCircle2 size={16} style={{ color: "#51AF37", flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Founders */}
          {step === 2 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Select Founding Team
              </h2>
              <p className="text-sm text-gray-500 mb-5">Select one or more talent profiles to form the founding team for this spin-off.</p>
              <div className="grid grid-cols-1 gap-2">
                {profiles.map((p: { id: number; name: string; currentRole?: string | null; availability?: string | null; industryExpertise?: string | null; yearsExperience?: number | null }) => (
                  <FounderSelectCard
                    key={p.id}
                    profile={p}
                    selected={selectedFounderIds.includes(p.id)}
                    onToggle={() => toggleFounder(p.id)}
                  />
                ))}
              </div>
              {selectedFounderIds.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  {selectedFounderIds.length} founder{selectedFounderIds.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {/* Step 3: Venture Config */}
          {step === 3 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Venture Configuration
              </h2>
              <p className="text-sm text-gray-500 mb-5">Define the venture identity and basic parameters.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Venture Name</Label>
                  <Input value={ventureName} onChange={e => setVentureName(e.target.value)} placeholder="e.g. EcoComp Lite" className="h-9 text-sm" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Tagline</Label>
                  <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="One-line value proposition" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Sector</Label>
                  <Input value={sector} onChange={e => setSector(e.target.value)} placeholder="e.g. Materials Science" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Channel</Label>
                  <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B2B">B2B</SelectItem>
                      <SelectItem value="D2C">D2C</SelectItem>
                      <SelectItem value="B2B2C">B2B2C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Brand Colour</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-9 h-9 rounded border cursor-pointer" style={{ borderColor: "#e5e7eb" }} />
                    <Input value={brandColor} onChange={e => setBrandColor(e.target.value)} className="h-9 text-sm flex-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Nominated Charity</Label>
                  <Input value={charity} onChange={e => setCharity(e.target.value)} placeholder="e.g. Trussell Trust" className="h-9 text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Strategic Setup */}
          {step === 4 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Strategic Setup
              </h2>
              <p className="text-sm text-gray-500 mb-5">Configure the financial model, growth engine, and VBS support level.</p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Strategic Classification</Label>
                  <Select value={classification} onValueChange={(v) => setClassification(v as typeof classification)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sustaining">Sustaining</SelectItem>
                      <SelectItem value="Disruptive-NewMarket">Disruptive — New Market</SelectItem>
                      <SelectItem value="Disruptive-LowEnd">Disruptive — Low End</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Engine of Growth</Label>
                  <Select value={engineOfGrowth} onValueChange={(v) => setEngineOfGrowth(v as typeof engineOfGrowth)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sticky">Sticky</SelectItem>
                      <SelectItem value="Viral">Viral</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 block">
                    Monthly Burn Rate — £{burnRate.toLocaleString()}
                  </Label>
                  <Slider value={[burnRate]} onValueChange={([v]) => setBurnRate(v)} min={1000} max={100000} step={1000} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 block">
                    Runway — {runway} months
                  </Label>
                  <Slider value={[runway]} onValueChange={([v]) => setRunway(v)} min={3} max={36} step={1} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 block">
                    Funding Ask — £{fundingAsk.toLocaleString()}
                  </Label>
                  <Slider value={[fundingAsk]} onValueChange={([v]) => setFundingAsk(v)} min={10000} max={2000000} step={10000} />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">VBS Support Level</Label>
                  <Select value={vbsSupport} onValueChange={(v) => setVbsSupport(v as typeof vbsSupport)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Incubation">Full Incubation</SelectItem>
                      <SelectItem value="Accelerator">Accelerator</SelectItem>
                      <SelectItem value="Advisory Only">Advisory Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Assigned Mentor</Label>
                  <Input value={mentor} onChange={e => setMentor(e.target.value)} placeholder="e.g. Dr. Sarah Chen" className="h-9 text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Generate */}
          {step === 5 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Review & Generate Execution Plan
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Review the configuration below, then click Generate to create your AI-powered 90-day execution plan.
              </p>

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="p-4 border" style={{ borderColor: "#e5e7eb" }}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Opportunity</p>
                  <p className="text-sm font-bold text-gray-900">{selectedOpp?.name ?? "—"}</p>
                  <p className="text-xs text-gray-500">{(selectedOpp as { sector?: string | null } | undefined)?.sector ?? "—"}</p>
                </Card>
                <Card className="p-4 border" style={{ borderColor: "#e5e7eb" }}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Founding Team</p>
                  {selectedFounderIds.map(id => {
                    const p = profiles.find((x: { id: number }) => x.id === id) as { id: number; name: string; currentRole?: string | null } | undefined;
                    return p ? (
                      <p key={id} className="text-sm font-bold text-gray-900">{p.name} <span className="text-xs font-normal text-gray-500">— {p.currentRole ?? "Founder"}</span></p>
                    ) : null;
                  })}
                </Card>
                <Card className="p-4 border" style={{ borderColor: "#e5e7eb" }}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Venture</p>
                  <p className="text-sm font-bold text-gray-900">{ventureName || "Unnamed"}</p>
                  <p className="text-xs text-gray-500">{tagline || "No tagline"} · {channel}</p>
                </Card>
                <Card className="p-4 border" style={{ borderColor: "#e5e7eb" }}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Financials</p>
                  <p className="text-sm font-bold text-gray-900">£{burnRate.toLocaleString()}/mo burn · {runway}mo runway</p>
                  <p className="text-xs text-gray-500">Ask: £{fundingAsk.toLocaleString()} · {vbsSupport}</p>
                </Card>
              </div>

              <Button
                className="w-full gap-2 h-11 text-sm font-semibold"
                style={{ background: "#51AF37", color: "white" }}
                onClick={handleCreateAndGenerate}
                disabled={createConfig.isPending || generatePlan.isPending}
              >
                {(createConfig.isPending || generatePlan.isPending) ? (
                  <><Loader2 size={16} className="animate-spin" /> Generating 90-Day Execution Plan…</>
                ) : (
                  <><Zap size={16} /> Generate Execution Plan</>
                )}
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: "#e5e7eb" }}>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ChevronLeft size={13} /> Previous
            </Button>
            {step < 5 && (
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                style={{ background: "#1a2332", color: "white" }}
                onClick={() => setStep(s => Math.min(5, s + 1))}
                disabled={(step === 1 && !selectedOppId) || (step === 2 && selectedFounderIds.length === 0)}
              >
                Next <ChevronRight size={13} />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Detail view (execution plan) ─────────────────────────────────────────
  if (viewMode === "detail" && activeConfigId) {
    const plan = planQuery.data;
    const activeConfig = activeConfigQuery.data;
    const currentStatus = activeConfig?.status ?? "Draft";

    const STATUS_FLOW: Record<string, { next: string; label: string; icon: typeof CheckSquare; color: string }[]> = {
      Draft:          [{ next: "Under Review", label: "Submit for Review", icon: Eye,          color: "#F49C13" }],
      "Under Review": [{ next: "Approved",     label: "Approve",          icon: CheckSquare,  color: "#51AF37" },
                       { next: "Rejected",     label: "Reject",           icon: XCircle,      color: "#ef4444" }],
      Approved:       [{ next: "Launched",     label: "Mark as Launched", icon: PlayCircle,   color: "#3A97D3" }],
      Rejected:       [{ next: "Draft",        label: "Reopen as Draft",  icon: RefreshCw,    color: "#9ca3af" }],
      Launched:       [],
    };
    const nextActions = STATUS_FLOW[currentStatus] ?? [];
    const statusColors: Record<string, string> = {
      Draft: "#9ca3af", "Under Review": "#F49C13", Approved: "#51AF37", Rejected: "#ef4444", Launched: "#3A97D3",
    };

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3A97D315", color: "#3A97D3" }}>
                  Spin-Off OS
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${statusColors[currentStatus]}15`, color: statusColors[currentStatus] }}
                >
                  {currentStatus}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                {activeConfig?.proposedVentureName ?? "Execution Plan"}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">{activeConfig?.proposedTagline ?? ""}</p>
            </div>
            <div className="flex items-center gap-2">
              {nextActions.map(action => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={action.next}
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    style={{ borderColor: action.color, color: action.color }}
                    onClick={() => { setPendingStatus(action.next); setStatusReason(""); setReviewerName(""); setShowStatusDialog(true); }}
                    disabled={advanceStatus.isPending}
                  >
                    <ActionIcon size={13} /> {action.label}
                  </Button>
                );
              })}
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setViewMode("list")}>
                <ChevronLeft size={13} /> All Spin-Offs
              </Button>
            </div>
          </div>
        </div>

        {/* Status Transition Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Advance to {pendingStatus}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold text-gray-500 mb-1 block">Reviewed by (optional)</Label>
                <Input placeholder="Your name or role" value={reviewerName} onChange={e => setReviewerName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500 mb-1 block">Reason / notes (optional)</Label>
                <Textarea placeholder="Add context for this decision…" value={statusReason} onChange={e => setStatusReason(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
              <Button
                size="sm"
                style={{ background: statusColors[pendingStatus ?? ""] ?? "#1a2332", color: "white" }}
                disabled={advanceStatus.isPending}
                onClick={() => {
                  if (!pendingStatus) return;
                  advanceStatus.mutate({
                    id: activeConfigId,
                    newStatus: pendingStatus as "Draft" | "Under Review" | "Approved" | "Rejected" | "Launched",
                    reason: statusReason || undefined,
                    reviewedBy: reviewerName || undefined,
                  });
                  setShowStatusDialog(false);
                }}
              >
                {advanceStatus.isPending ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="p-8">
          {/* Status History Timeline */}
          <div className="mb-6">
            <button
              className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-3"
              onClick={() => setShowHistory(h => !h)}
            >
              <Clock size={13} />
              Status History
              <ChevronRight size={12} className={`transition-transform ${showHistory ? "rotate-90" : ""}`} />
            </button>
            {showHistory && (
              <div className="bg-gray-50 rounded-xl border p-4 mb-4" style={{ borderColor: "#e5e7eb" }}>
                {historyQuery.isLoading && <p className="text-xs text-gray-400">Loading history…</p>}
                {historyQuery.data && historyQuery.data.length === 0 && (
                  <p className="text-xs text-gray-400">No status transitions recorded yet.</p>
                )}
                {historyQuery.data && historyQuery.data.length > 0 && (
                  <div className="space-y-3">
                    {historyQuery.data.map((entry: { id: number; fromStatus: string | null; toStatus: string; reviewedBy: string | null; reason: string | null; createdAt: Date }) => {
                      const statusColors: Record<string, string> = {
                        Draft: "#9ca3af", "Under Review": "#F49C13", Approved: "#51AF37", Rejected: "#ef4444", Launched: "#3A97D3",
                      };
                      return (
                        <div key={entry.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: statusColors[entry.toStatus] ?? "#9ca3af" }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {entry.fromStatus && (
                                <span className="text-xs text-gray-400">{entry.fromStatus} →</span>
                              )}
                              <span className="text-xs font-semibold" style={{ color: statusColors[entry.toStatus] ?? "#9ca3af" }}>{entry.toStatus}</span>
                              {entry.reviewedBy && <span className="text-xs text-gray-400">by {entry.reviewedBy}</span>}
                              <span className="text-xs text-gray-300 ml-auto">{new Date(entry.createdAt).toLocaleString()}</span>
                            </div>
                            {entry.reason && <p className="text-xs text-gray-500 mt-0.5 italic">{entry.reason}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {planQuery.isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-gray-300" />
            </div>
          )}
          {plan && (
            <ExecutionPlanView
              plan={plan as {
                id: number;
                planTitle: string;
                executiveSummary: string;
                fullPlanMarkdown: string;
                status: string;
                createdAt: Date;
              }}
              onRegenerate={() => generatePlan.mutate({ spinoffConfigId: activeConfigId })}
              isRegenerating={generatePlan.isPending}
            />
          )}
          {!planQuery.isLoading && !plan && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText size={32} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 font-medium mb-4">No execution plan generated yet</p>
              <Button
                size="sm"
                style={{ background: "#51AF37", color: "white" }}
                onClick={() => generatePlan.mutate({ spinoffConfigId: activeConfigId })}
                disabled={generatePlan.isPending}
              >
                <Zap size={13} className="mr-1.5" />
                {generatePlan.isPending ? "Generating…" : "Generate Plan"}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List view (default) ──────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3A97D315", color: "#3A97D3" }}>
                Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Spin-Off OS
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Map all inputs — founders, opportunities, and resources — into a new spin-off venture and generate an AI-powered 90-day execution plan.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            style={{ background: "#51AF37", color: "white" }}
            onClick={() => { setStep(1); setViewMode("wizard"); }}
          >
            <GitBranch size={13} /> New Spin-Off
          </Button>
        </div>
      </div>

      <div className="p-8">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Spin-Offs", value: configs.length, icon: GitBranch, color: "#1a2332" },
            { label: "Approved", value: configs.filter((c: { status: string | null }) => c.status === "Approved").length, icon: CheckCircle2, color: "#51AF37" },
            { label: "Under Review", value: configs.filter((c: { status: string | null }) => c.status === "Under Review").length, icon: Eye, color: "#F49C13" },
            { label: "Launched", value: configs.filter((c: { status: string | null }) => c.status === "Launched").length, icon: Rocket, color: "#3A97D3" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color }} />
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
              </div>
              <span className="text-2xl font-bold" style={{ color, fontFamily: "'Prompt', sans-serif" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Config list */}
        {configs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: "#e5e7eb" }}>
            <GitBranch size={40} className="text-gray-200 mb-4" />
            <p className="text-sm text-gray-400 font-medium">No spin-off configurations yet</p>
            <p className="text-xs text-gray-300 mt-1 mb-5">
              Use the Matching Engine to find founders, then launch a spin-off from there, or start fresh below.
            </p>
            <Button
              size="sm"
              style={{ background: "#51AF37", color: "white" }}
              onClick={() => { setStep(1); setViewMode("wizard"); }}
            >
              <GitBranch size={13} className="mr-1.5" /> Create First Spin-Off
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((c: {
              id: number;
              proposedVentureName: string | null;
              proposedTagline: string | null;
              proposedSector: string | null;
              proposedChannel: string | null;
              status: string | null;
              createdAt: Date;
            }) => (
              <SpinoffListItem
                key={c.id}
                config={c}
                onSelect={() => { setActiveConfigId(c.id); setViewMode("detail"); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
