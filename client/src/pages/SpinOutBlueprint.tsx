// ============================================================
// SPIN-OUT BLUEPRINT PAGE
// Design: Precision Industrial — VOS design system
// Flow: Select Offering → View Readiness → Link Libraries → AI Generate → Launch
// ============================================================
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  GitBranch, Rocket, Zap, CheckCircle2, AlertCircle, Clock,
  Users, Truck, DollarSign, BarChart2, Cpu, Shield,
  Plus, Trash2, RefreshCw, Eye, ArrowRight, Loader2,
  Package, Building2, FlaskConical, FileText, Star, ChevronRight,
  Target, BookOpen, Briefcase, Link2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type GateStatus = "not_ready" | "approaching" | "ready_to_review" | "approved" | "launched";
type Domain = "talent" | "supply_chain" | "university" | "research" | "finance" | "market" | "ip" | "legal" | "crm" | "specialist";

const GATE_CONFIG: Record<GateStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  not_ready:       { label: "Not Ready",       color: "#ef4444", bg: "#fef2f2", icon: AlertCircle },
  approaching:     { label: "Approaching",     color: "#f59e0b", bg: "#fffbeb", icon: Clock },
  ready_to_review: { label: "Ready to Review", color: "#3b82f6", bg: "#eff6ff", icon: Eye },
  approved:        { label: "Approved",        color: "#56A837", bg: "#f0fdf4", icon: CheckCircle2 },
  launched:        { label: "Launched",        color: "#8b5cf6", bg: "#f5f3ff", icon: Rocket },
};

const DOMAIN_CONFIG: Record<Domain, { label: string; icon: React.ElementType; color: string; weight: string }> = {
  talent:       { label: "Talent",       icon: Users,       color: "#3b82f6", weight: "20%" },
  supply_chain: { label: "Supply Chain", icon: Truck,       color: "#f59e0b", weight: "15%" },
  finance:      { label: "Finance",      icon: DollarSign,  color: "#56A837", weight: "20%" },
  market:       { label: "Market",       icon: BarChart2,   color: "#3B85BA", weight: "20%" },
  ip:           { label: "IP",           icon: Shield,      color: "#8b5cf6", weight: "—" },
  legal:        { label: "Legal",        icon: FileText,    color: "#6b7280", weight: "—" },
  university:   { label: "University",   icon: Building2,   color: "#ec4899", weight: "—" },
  research:     { label: "Research",     icon: FlaskConical,color: "#06b6d4", weight: "—" },
  crm:          { label: "CRM",          icon: Briefcase,   color: "#f97316", weight: "—" },
  specialist:   { label: "Specialist",   icon: Star,        color: "#eab308", weight: "—" },
};

const READINESS_DOMAINS: { key: "talentScore" | "supplyChainScore" | "financeScore" | "marketScore" | "technologyScore" | "governanceScore"; label: string; icon: React.ElementType; color: string; weight: string }[] = [
  { key: "talentScore",       label: "Talent",       icon: Users,      color: "#3b82f6", weight: "20%" },
  { key: "supplyChainScore",  label: "Supply Chain", icon: Truck,      color: "#f59e0b", weight: "15%" },
  { key: "financeScore",      label: "Finance",      icon: DollarSign, color: "#56A837", weight: "20%" },
  { key: "marketScore",       label: "Market",       icon: BarChart2,  color: "#3B85BA", weight: "20%" },
  { key: "technologyScore",   label: "Technology",   icon: Cpu,        color: "#8b5cf6", weight: "15%" },
  { key: "governanceScore",   label: "Governance",   icon: Shield,     color: "#6b7280", weight: "10%" },
];

const LIBRARY_DOMAINS: Domain[] = ["talent", "supply_chain", "university", "research", "finance", "market", "ip", "legal", "crm", "specialist"];

// ── Readiness Gauge ───────────────────────────────────────────────────────────
function ReadinessGauge({ score, color }: { score: number; color: string }) {
  return (
    <div className="relative w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#56A837" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x={size / 2} y={size / 2 + 5}
        textAnchor="middle" fill={color}
        fontSize={size < 60 ? 11 : 14} fontWeight="700"
        style={{ transform: `rotate(90deg) translate(0, -${size}px)`, transformOrigin: "center" }}
      />
    </svg>
  );
}

// ── Link Status Badge ─────────────────────────────────────────────────────────
const LINK_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  proposed:    { color: "#6b7280", bg: "#f9fafb" },
  confirmed:   { color: "#3b82f6", bg: "#eff6ff" },
  contracted:  { color: "#56A837", bg: "#f0fdf4" },
  unavailable: { color: "#ef4444", bg: "#fef2f2" },
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SpinOutBlueprint() {
  const [, navigate] = useLocation();
  const [selectedVentureId, setSelectedVentureId] = useState<string>("");
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>("");
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "libraries" | "blueprint" | "launch">("overview");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddLinkDialog, setShowAddLinkDialog] = useState(false);
  const [addLinkDomain, setAddLinkDomain] = useState<Domain>("talent");
  const [addLinkRecordId, setAddLinkRecordId] = useState("");
  const [addLinkLabel, setAddLinkLabel] = useState("");
  const [addLinkStatus, setAddLinkStatus] = useState<"proposed" | "confirmed" | "contracted" | "unavailable">("proposed");
  const [addLinkNotes, setAddLinkNotes] = useState("");
  const [showBlueprintDialog, setShowBlueprintDialog] = useState(false);
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);
  const [launchFounderIds, setLaunchFounderIds] = useState<string>("");

  // Queries
  const venturesQ = trpc.ventures.list.useQuery();
  const offeringsQ = trpc.portfoliosOfferings.offerings.list.useQuery(
    { ventureId: selectedVentureId },
    { enabled: !!selectedVentureId }
  );
  const blueprintsQ = trpc.spinoutBlueprint.list.useQuery(
    { ventureId: selectedVentureId || undefined, offeringId: selectedOfferingId || undefined },
    { enabled: true }
  );
  const blueprintQ = trpc.spinoutBlueprint.get.useQuery(
    { id: selectedBlueprintId! },
    { enabled: !!selectedBlueprintId }
  );
  const libraryOptionsQ = trpc.spinoutBlueprint.getLibraryOptions.useQuery(
    { domain: addLinkDomain, ventureId: selectedVentureId || undefined, offeringId: selectedOfferingId || undefined },
    { enabled: showAddLinkDialog }
  );

  // Mutations
  const createBlueprint = trpc.spinoutBlueprint.create.useMutation({
    onSuccess: (data) => {
      toast.success("Blueprint created");
      setSelectedBlueprintId(data?.id ?? null);
      blueprintsQ.refetch();
      setShowCreateDialog(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const computeReadiness = trpc.spinoutBlueprint.computeReadiness.useMutation({
    onSuccess: () => { toast.success("Readiness scores updated"); blueprintQ.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const addLink = trpc.spinoutBlueprint.addLibraryLink.useMutation({
    onSuccess: () => {
      toast.success("Library link added");
      blueprintQ.refetch();
      setShowAddLinkDialog(false);
      setAddLinkRecordId(""); setAddLinkLabel(""); setAddLinkNotes("");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateLinkStatus = trpc.spinoutBlueprint.updateLinkStatus.useMutation({
    onSuccess: () => { blueprintQ.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const removeLink = trpc.spinoutBlueprint.removeLibraryLink.useMutation({
    onSuccess: () => { toast.success("Link removed"); blueprintQ.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const generateBlueprint = trpc.spinoutBlueprint.generateBlueprint.useMutation({
    onSuccess: () => { toast.success("Blueprint generated"); blueprintQ.refetch(); setShowBlueprintDialog(true); },
    onError: (e) => toast.error(e.message),
  });
  const launchToSpinoff = trpc.spinoutBlueprint.launchToSpinoffOS.useMutation({
    onSuccess: (data) => {
      toast.success("Launched to Spin-Off OS!");
      blueprintQ.refetch();
      navigate(`/spinoff?configId=${data.spinoffConfigId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const blueprint = blueprintQ.data;
  const ventures = venturesQ.data ?? [];
  const offerings = offeringsQ.data ?? [];
  const blueprints = blueprintsQ.data ?? [];

  const gateConfig = blueprint ? GATE_CONFIG[blueprint.gateStatus as GateStatus] ?? GATE_CONFIG.not_ready : null;

  // Group links by domain
  const linksByDomain = useMemo(() => {
    if (!blueprint?.links) return {} as Record<Domain, NonNullable<typeof blueprint>["links"]>;
    const grouped: Record<string, typeof blueprint.links> = {};
    for (const link of blueprint.links) {
      if (!grouped[link.domain]) grouped[link.domain] = [];
      grouped[link.domain].push(link);
    }
    return grouped as Record<Domain, typeof blueprint.links>;
  }, [blueprint?.links]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranch size={18} style={{ color: "#56A837" }} />
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#56A83715", color: "#56A837" }}>
                Spin-Out Blueprint
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Execution Platform Blueprint
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
              Select a Portfolio Offering, link your Venture OS libraries, and generate an AI-powered readiness blueprint — your complete pathway to spinning out into an independent Execution Platform.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 text-xs text-white"
            style={{ background: "#56A837" }}
            onClick={() => setShowCreateDialog(true)}
            disabled={!selectedOfferingId}
          >
            <Plus size={13} /> New Blueprint
          </Button>
        </div>

        {/* Venture + Offering Selectors */}
        <div className="flex items-center gap-4 mt-5">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Venture</Label>
            <Select value={selectedVentureId} onValueChange={(v) => { setSelectedVentureId(v); setSelectedOfferingId(""); setSelectedBlueprintId(null); }}>
              <SelectTrigger className="h-8 text-xs w-48"><SelectValue placeholder="Select venture…" /></SelectTrigger>
              <SelectContent>
                {ventures.map((v: { id: string; name: string }) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedVentureId && (
            <div className="flex items-center gap-2">
              <ChevronRight size={14} className="text-gray-400" />
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Offering (POI)</Label>
              <Select value={selectedOfferingId} onValueChange={(v) => { setSelectedOfferingId(v); setSelectedBlueprintId(null); }}>
                <SelectTrigger className="h-8 text-xs w-56"><SelectValue placeholder="Select offering…" /></SelectTrigger>
                <SelectContent>
                  {offerings.map((o: { id: string; name: string; offeringType?: string | null }) => (
                    <SelectItem key={o.id} value={o.id}>{o.name} — {o.offeringType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-0 h-full">
        {/* Left: Blueprint List */}
        <div className="w-72 bg-white border-r flex-shrink-0 overflow-y-auto" style={{ borderColor: "#e5e7eb", minHeight: "calc(100vh - 200px)" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Blueprints</p>
          </div>
          {blueprints.length === 0 ? (
            <div className="p-6 text-center">
              <GitBranch size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-400">No blueprints yet.</p>
              <p className="text-xs text-gray-400 mt-1">Select an offering and click "New Blueprint".</p>
            </div>
          ) : (
            <div className="p-2 flex flex-col gap-1">
              {blueprints.map((b) => {
                const gate = GATE_CONFIG[b.gateStatus as GateStatus] ?? GATE_CONFIG.not_ready;
                const GateIcon = gate.icon;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBlueprintId(b.id)}
                    className="w-full text-left p-3 rounded-lg transition-all duration-150 hover:bg-gray-50"
                    style={{
                      background: selectedBlueprintId === b.id ? "#f0fdf4" : "transparent",
                      border: selectedBlueprintId === b.id ? "1px solid #56A83730" : "1px solid transparent",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{b.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{b.overallScore}% ready</p>
                      </div>
                      <GateIcon size={13} style={{ color: gate.color, flexShrink: 0, marginTop: 2 }} />
                    </div>
                    <div className="mt-2">
                      <ReadinessGauge score={b.overallScore ?? 0} color={gate.color} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Blueprint Detail */}
        <div className="flex-1 overflow-y-auto">
          {!selectedBlueprintId || !blueprint ? (
            <div className="flex flex-col items-center justify-center h-96 text-center p-8">
              <GitBranch size={48} className="text-gray-200 mb-4" />
              <h3 className="text-base font-semibold text-gray-400 mb-2">Select or Create a Blueprint</h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Choose a venture and offering above, then select an existing blueprint or create a new one to begin the spin-out readiness process.
              </p>
            </div>
          ) : (
            <div className="p-6">
              {/* Blueprint Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                    {blueprint.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    {blueprint.offering && (
                      <span className="text-xs text-gray-500">
                        <Package size={11} className="inline mr-1" />
                        {blueprint.offering.name} · {blueprint.offering.offeringType}
                      </span>
                    )}
                    {blueprint.venture && (
                      <span className="text-xs text-gray-500">
                        <Target size={11} className="inline mr-1" />
                        {blueprint.venture.name}
                      </span>
                    )}
                  </div>
                </div>
                {gateConfig && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: gateConfig.bg }}>
                    <gateConfig.icon size={14} style={{ color: gateConfig.color }} />
                    <span className="text-xs font-semibold" style={{ color: gateConfig.color }}>{gateConfig.label}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: gateConfig.color }}>{blueprint.overallScore}%</span>
                  </div>
                )}
              </div>

              {/* Tab Nav */}
              <div className="flex gap-1 mb-6 border-b" style={{ borderColor: "#e5e7eb" }}>
                {(["overview", "libraries", "blueprint", "launch"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-4 py-2 text-xs font-semibold capitalize transition-all"
                    style={{
                      color: activeTab === tab ? "#56A837" : "#6b7280",
                      borderBottom: activeTab === tab ? "2px solid #56A837" : "2px solid transparent",
                    }}
                  >
                    {tab === "overview" ? "Readiness" : tab === "libraries" ? "Libraries" : tab === "blueprint" ? "AI Blueprint" : "Launch"}
                  </button>
                ))}
              </div>

              {/* Tab: Readiness Overview */}
              {activeTab === "overview" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700">6-Domain Readiness Assessment</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => computeReadiness.mutate({ id: blueprint.id })}
                      disabled={computeReadiness.isPending}
                    >
                      {computeReadiness.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      Recompute
                    </Button>
                  </div>

                  {/* Overall Score */}
                  <div className="bg-white rounded-xl border p-5 mb-4 flex items-center gap-6" style={{ borderColor: "#e5e7eb" }}>
                    <div className="relative flex-shrink-0">
                      <ScoreRing score={blueprint.overallScore ?? 0} size={80} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base font-bold" style={{ color: (blueprint.overallScore ?? 0) >= 80 ? "#56A837" : (blueprint.overallScore ?? 0) >= 60 ? "#3b82f6" : (blueprint.overallScore ?? 0) >= 40 ? "#f59e0b" : "#ef4444" }}>
                          {blueprint.overallScore ?? 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 mb-1">Overall Spin-Out Readiness</p>
                      <p className="text-xs text-gray-500 mb-2">
                        {(blueprint.overallScore ?? 0) < 40
                          ? "Significant gaps remain. Link more library resources and complete validation experiments."
                          : (blueprint.overallScore ?? 0) < 60
                          ? "Good progress. Focus on confirming supply chain and finance commitments."
                          : (blueprint.overallScore ?? 0) < 80
                          ? "Strong readiness. Submit for VBS review to unlock Approved status."
                          : "Excellent readiness. Generate your AI Blueprint and launch to Spin-Off OS."}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Gate:</span>
                        {gateConfig && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: gateConfig.bg, color: gateConfig.color }}>
                            {gateConfig.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Domain Scores */}
                  <div className="grid grid-cols-1 gap-3">
                    {READINESS_DOMAINS.map((domain) => {
                      const score = (blueprint[domain.key] as number) ?? 0;
                      const DomainIcon = domain.icon;
                      return (
                        <div key={domain.key} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${domain.color}15` }}>
                                <DomainIcon size={14} style={{ color: domain.color }} />
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-gray-700">{domain.label}</span>
                                <span className="text-xs text-gray-400 ml-2">weight: {domain.weight}</span>
                              </div>
                            </div>
                            <span className="text-sm font-bold font-mono" style={{ color: domain.color }}>{score}%</span>
                          </div>
                          <ReadinessGauge score={score} color={domain.color} />
                          <p className="text-xs text-gray-400 mt-1.5">
                            {score < 40 ? "⚠ Critical gap — add confirmed library links to improve this score"
                              : score < 70 ? "Progressing — confirm more resources to strengthen readiness"
                              : "Strong — maintain and document commitments"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: Libraries */}
              {activeTab === "libraries" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700">Venture OS Library Links</h3>
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs text-white"
                      style={{ background: "#3B85BA" }}
                      onClick={() => setShowAddLinkDialog(true)}
                    >
                      <Link2 size={12} /> Link Resource
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Connect your offering to specific records across all Venture OS libraries. Each confirmed or contracted link increases the domain readiness score.
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {LIBRARY_DOMAINS.map((domain) => {
                      const domainCfg = DOMAIN_CONFIG[domain];
                      const DomainIcon = domainCfg.icon;
                      const domainLinks = linksByDomain[domain] ?? [];
                      return (
                        <div key={domain} className="bg-white rounded-xl border" style={{ borderColor: "#e5e7eb" }}>
                          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#f3f4f6" }}>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${domainCfg.color}15` }}>
                                <DomainIcon size={12} style={{ color: domainCfg.color }} />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{domainCfg.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{domainLinks.length} linked</span>
                              <button
                                onClick={() => { setAddLinkDomain(domain); setShowAddLinkDialog(true); }}
                                className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                              >
                                <Plus size={11} className="text-gray-400" />
                              </button>
                            </div>
                          </div>
                          {domainLinks.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-gray-400 italic">No resources linked yet</div>
                          ) : (
                            <div className="divide-y" style={{ borderColor: "#f9fafb" }}>
                              {domainLinks.map((link) => {
                                const statusCfg = LINK_STATUS_COLORS[link.linkStatus ?? "proposed"];
                                return (
                                  <div key={link.id} className="flex items-center justify-between px-4 py-2.5 group">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="text-xs text-gray-700 truncate">{link.linkedRecordLabel ?? link.linkedRecordId}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Select
                                        value={link.linkStatus ?? "proposed"}
                                        onValueChange={(v) => updateLinkStatus.mutate({ linkId: link.id, linkStatus: v as "proposed" | "confirmed" | "contracted" | "unavailable" })}
                                      >
                                        <SelectTrigger className="h-6 text-xs w-28 border-0 p-1" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="proposed">Proposed</SelectItem>
                                          <SelectItem value="confirmed">Confirmed</SelectItem>
                                          <SelectItem value="contracted">Contracted</SelectItem>
                                          <SelectItem value="unavailable">Unavailable</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <button
                                        onClick={() => removeLink.mutate({ linkId: link.id })}
                                        className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                      >
                                        <Trash2 size={10} className="text-red-400" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: AI Blueprint */}
              {activeTab === "blueprint" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700">AI-Generated Spin-Out Blueprint</h3>
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs text-white"
                      style={{ background: "#3B85BA" }}
                      onClick={() => generateBlueprint.mutate({ id: blueprint.id })}
                      disabled={generateBlueprint.isPending}
                    >
                      {generateBlueprint.isPending ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                      {blueprint.blueprintMarkdown ? "Regenerate" : "Generate Blueprint"}
                    </Button>
                  </div>
                  {!blueprint.blueprintMarkdown ? (
                    <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: "#e5e7eb" }}>
                      <Zap size={32} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-500 mb-2">No blueprint generated yet</p>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                        Link your library resources, compute readiness scores, then generate a comprehensive AI blueprint covering all 10 sections — from executive summary to KPI framework.
                      </p>
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs text-white"
                        style={{ background: "#56A837" }}
                        onClick={() => generateBlueprint.mutate({ id: blueprint.id })}
                        disabled={generateBlueprint.isPending}
                      >
                        {generateBlueprint.isPending ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                        Generate AI Blueprint
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
                      <div className="prose prose-sm max-w-none">
                        <Streamdown>{blueprint.blueprintMarkdown}</Streamdown>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Launch */}
              {activeTab === "launch" && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Launch to Spin-Off OS</h3>
                  <div className="bg-white rounded-xl border p-6 mb-4" style={{ borderColor: "#e5e7eb" }}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#56A83715" }}>
                        <Rocket size={18} style={{ color: "#56A837" }} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-1">Convert to Execution Platform</h4>
                        <p className="text-xs text-gray-500 mb-3">
                          When your blueprint reaches 40%+ readiness, you can launch it directly into the Spin-Off OS wizard. The wizard will be pre-populated with all your offering and venture data, ready for the 5-step execution plan generation.
                        </p>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[
                            { label: "Readiness Gate", value: `${blueprint.overallScore ?? 0}%`, ok: (blueprint.overallScore ?? 0) >= 40 },
                            { label: "Blueprint", value: blueprint.blueprintMarkdown ? "Generated" : "Missing", ok: !!blueprint.blueprintMarkdown },
                            { label: "Gate Status", value: gateConfig?.label ?? "—", ok: blueprint.gateStatus !== "not_ready" },
                          ].map((check) => (
                            <div key={check.label} className="rounded-lg p-3 text-center" style={{ background: check.ok ? "#f0fdf4" : "#fef2f2" }}>
                              {check.ok ? <CheckCircle2 size={16} className="mx-auto mb-1" style={{ color: "#56A837" }} /> : <AlertCircle size={16} className="mx-auto mb-1" style={{ color: "#ef4444" }} />}
                              <p className="text-xs font-semibold" style={{ color: check.ok ? "#56A837" : "#ef4444" }}>{check.value}</p>
                              <p className="text-xs text-gray-400">{check.label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mb-4">
                          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Founder Profile IDs (comma-separated)</Label>
                          <Input
                            value={launchFounderIds}
                            onChange={(e) => setLaunchFounderIds(e.target.value)}
                            placeholder="e.g. 1, 2, 3"
                            className="h-9 text-sm"
                          />
                          <p className="text-xs text-gray-400 mt-1">Find profile IDs in the Founder Matching module.</p>
                        </div>
                        <Button
                          className="gap-1.5 text-white w-full"
                          style={{ background: "#56A837" }}
                          disabled={(blueprint.overallScore ?? 0) < 40 || launchToSpinoff.isPending}
                          onClick={() => {
                            const ids = launchFounderIds.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                            launchToSpinoff.mutate({ id: blueprint.id, founderProfileIds: ids });
                          }}
                        >
                          {launchToSpinoff.isPending ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                          Launch to Spin-Off OS
                          <ArrowRight size={14} />
                        </Button>
                        {(blueprint.overallScore ?? 0) < 40 && (
                          <p className="text-xs text-red-500 mt-2 text-center">Readiness must be ≥ 40% to launch. Current: {blueprint.overallScore ?? 0}%</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Journey Map */}
                  <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Spin-Out Journey</h4>
                    <div className="flex items-center gap-0">
                      {[
                        { label: "Blueprint", icon: BookOpen, done: !!blueprint.blueprintMarkdown },
                        { label: "40% Gate", icon: Target, done: (blueprint.overallScore ?? 0) >= 40 },
                        { label: "Spin-Off OS", icon: GitBranch, done: blueprint.gateStatus === "launched" },
                        { label: "Execution Plan", icon: FileText, done: false },
                        { label: "Live Platform", icon: Rocket, done: false },
                      ].map((step, i, arr) => {
                        const StepIcon = step.icon;
                        return (
                          <div key={step.label} className="flex items-center">
                            <div className="flex flex-col items-center gap-1">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{
                                  background: step.done ? "#56A837" : "#f3f4f6",
                                  border: step.done ? "none" : "2px solid #e5e7eb",
                                }}
                              >
                                <StepIcon size={14} color={step.done ? "white" : "#9ca3af"} />
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap">{step.label}</span>
                            </div>
                            {i < arr.length - 1 && (
                              <div className="w-8 h-0.5 mb-4 mx-1" style={{ background: step.done ? "#56A837" : "#e5e7eb" }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Blueprint Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Spin-Out Blueprint</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-gray-500 mb-4">
              A new blueprint will be created for <strong>{offerings.find((o: { id: string }) => o.id === selectedOfferingId)?.name ?? "the selected offering"}</strong>. You can then link library resources and generate the AI blueprint.
            </p>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Blueprint Title (optional)</Label>
            <Input
              id="blueprint-title"
              placeholder="e.g. EcoComp Lite — Q2 2026 Spin-Out Blueprint"
              className="h-9 text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              className="text-white"
              style={{ background: "#56A837" }}
              disabled={createBlueprint.isPending}
              onClick={() => {
                const titleInput = document.getElementById("blueprint-title") as HTMLInputElement;
                createBlueprint.mutate({ offeringId: selectedOfferingId, title: titleInput?.value || undefined });
              }}
            >
              {createBlueprint.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Create Blueprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Library Link Dialog */}
      <Dialog open={showAddLinkDialog} onOpenChange={setShowAddLinkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link Library Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Domain</Label>
              <Select value={addLinkDomain} onValueChange={(v) => setAddLinkDomain(v as Domain)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LIBRARY_DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>{DOMAIN_CONFIG[d].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {libraryOptionsQ.data && libraryOptionsQ.data.length > 0 ? (
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Select from Library</Label>
                <Select onValueChange={(v) => {
                  const opt = libraryOptionsQ.data?.find((o: { id: string }) => o.id === v);
                  if (opt) { setAddLinkRecordId(opt.id); setAddLinkLabel(opt.label); }
                }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose a record…" /></SelectTrigger>
                  <SelectContent>
                    {libraryOptionsQ.data.map((opt: { id: string; label: string }) => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Record ID</Label>
                  <Input value={addLinkRecordId} onChange={(e) => setAddLinkRecordId(e.target.value)} placeholder="e.g. 42" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Label</Label>
                  <Input value={addLinkLabel} onChange={(e) => setAddLinkLabel(e.target.value)} placeholder="e.g. John Smith — CTO" className="h-9 text-sm" />
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Status</Label>
              <Select value={addLinkStatus} onValueChange={(v) => setAddLinkStatus(v as typeof addLinkStatus)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposed">Proposed</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="contracted">Contracted</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Notes (optional)</Label>
              <Textarea value={addLinkNotes} onChange={(e) => setAddLinkNotes(e.target.value)} placeholder="e.g. LOI signed, awaiting formal contract" className="text-sm h-16 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLinkDialog(false)}>Cancel</Button>
            <Button
              className="text-white"
              style={{ background: "#3B85BA" }}
              disabled={!addLinkRecordId || addLink.isPending}
              onClick={() => {
                if (!selectedBlueprintId) return;
                addLink.mutate({
                  blueprintId: selectedBlueprintId,
                  domain: addLinkDomain,
                  linkedRecordId: addLinkRecordId,
                  linkedRecordLabel: addLinkLabel || undefined,
                  linkStatus: addLinkStatus,
                  notes: addLinkNotes || undefined,
                });
              }}
            >
              {addLink.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
