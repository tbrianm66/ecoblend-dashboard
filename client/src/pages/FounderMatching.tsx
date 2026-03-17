// ============================================================
// FOUNDER MATCHING ENGINE PAGE
// Design: Precision Industrial — VOS design system
// Shows: top matches per opportunity, co-founder compatibility,
//        match score breakdown, and quick Spin-Off OS launch
// ============================================================

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Shuffle, Users, Target, Zap, TrendingUp, Award,
  Network, Clock, Briefcase, ChevronRight, RefreshCw,
  GitBranch, Star, CheckCircle2, AlertCircle,
} from "lucide-react";

// ── Score ring component ────────────────────────────────────────────────────
function ScoreRing({ score, size = 56, color = "#51AF37" }: { score: number; size?: number; color?: string }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x={size / 2} y={size / 2 + 5}
        textAnchor="middle"
        fontSize={size * 0.22}
        fontWeight="700"
        fill="#1a2332"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {score}
      </text>
    </svg>
  );
}

// ── Dimension bar ───────────────────────────────────────────────────────────
function DimBar({ label, value, color = "#51AF37" }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs text-gray-500 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono text-gray-400 w-7 text-right">{value}</span>
    </div>
  );
}

// ── Score colour helper ─────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 75) return "#51AF37";
  if (s >= 50) return "#F49C13";
  return "#ef4444";
}

function scoreBadge(s: number) {
  if (s >= 75) return { label: "Strong Match", color: "#51AF37", bg: "#51AF3715" };
  if (s >= 50) return { label: "Moderate Match", color: "#F49C13", bg: "#F49C1315" };
  return { label: "Weak Match", color: "#ef4444", bg: "#ef444415" };
}

// ── Match card ──────────────────────────────────────────────────────────────
function MatchCard({
  match,
  onLaunchSpinoff,
}: {
  match: {
    id: number;
    founderName: string;
    founderRole: string;
    availability: string;
    overallMatchScore: number;
    sectorAlignmentScore: number;
    capabilityFitScore: number;
    availabilityScore: number;
    pvfScore: number;
    experienceScore: number;
    networkScore: number;
    recommendedRole: string | null;
    status: string;
    talentProfileId: number;
  };
  onLaunchSpinoff: (profileId: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = scoreBadge(match.overallMatchScore);
  const color = scoreColor(match.overallMatchScore);

  return (
    <Card className="p-5 border hover:shadow-md transition-all duration-200" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-start gap-4">
        {/* Score ring */}
        <div className="shrink-0">
          <ScoreRing score={match.overallMatchScore} color={color} />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                {match.founderName}
              </h3>
              <p className="text-xs text-gray-500">{match.founderRole}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: badge.bg, color: badge.color }}
              >
                {badge.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} /> {match.availability}
            </span>
            {match.recommendedRole && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Briefcase size={11} /> {match.recommendedRole}
              </span>
            )}
          </div>

          {/* Dimension bars (collapsed by default) */}
          {expanded && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
              <DimBar label="Sector Alignment"  value={match.sectorAlignmentScore} color={color} />
              <DimBar label="Capability Fit"    value={match.capabilityFitScore}   color={color} />
              <DimBar label="Availability"      value={match.availabilityScore}    color={color} />
              <DimBar label="Values Fit (PVF)"  value={match.pvfScore}             color={color} />
              <DimBar label="Experience"        value={match.experienceScore}      color={color} />
              <DimBar label="Network"           value={match.networkScore}         color={color} />
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
            >
              {expanded ? "Hide breakdown" : "Show breakdown"}
              <ChevronRight size={11} style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              style={{ borderColor: "#51AF37", color: "#51AF37" }}
              onClick={() => onLaunchSpinoff(match.talentProfileId)}
            >
              <GitBranch size={11} /> Launch Spin-Off
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Co-founder pair card ────────────────────────────────────────────────────
function CoFounderCard({
  result,
}: {
  result: {
    nameA: string;
    nameB: string;
    overall: number;
    capComplement: number;
    valueAlignment: number;
    styleScore: number;
    netComplement: number;
  };
}) {
  const color = scoreColor(result.overall);
  const badge = scoreBadge(result.overall);
  return (
    <Card className="p-4 border" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center gap-3 mb-3">
        <ScoreRing score={result.overall} size={48} color={color} />
        <div>
          <p className="text-sm font-bold text-gray-900">{result.nameA} + {result.nameB}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        </div>
      </div>
      <DimBar label="Capability Complement" value={result.capComplement}  color={color} />
      <DimBar label="Value Alignment"       value={result.valueAlignment} color={color} />
      <DimBar label="Working Style"         value={result.styleScore}     color={color} />
      <DimBar label="Network Complement"    value={result.netComplement}  color={color} />
    </Card>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function FounderMatching() {
  const [, navigate] = useLocation();
  const [selectedOppId, setSelectedOppId] = useState<number | null>(null);
  const [coFounderA, setCoFounderA] = useState<number | null>(null);
  const [coFounderB, setCoFounderB] = useState<number | null>(null);
  const [coFounderResult, setCoFounderResult] = useState<{
    nameA: string; nameB: string; overall: number;
    capComplement: number; valueAlignment: number; styleScore: number; netComplement: number;
  } | null>(null);

  // Data queries
  const oppsQuery = trpc.poi.listOpportunities.useQuery();
  const profilesQuery = trpc.matching.getAllTalentProfiles.useQuery();
  const matchesQuery = trpc.matching.getTopMatchesForOpportunity.useQuery(
    { productOpportunityId: selectedOppId!, limit: 20 },
    { enabled: !!selectedOppId }
  );

  // Mutations
  const computeAll = trpc.matching.computeAllForOpportunity.useMutation({
    onSuccess: (count) => {
      toast.success(`Computed ${count} match scores`);
      matchesQuery.refetch();
    },
    onError: () => toast.error("Failed to compute matches"),
  });

  const computeCoFounder = trpc.matching.computeCoFounderCompatibility.useMutation({
    onSuccess: (result) => {
      if (result) setCoFounderResult(result as typeof coFounderResult);
    },
    onError: () => toast.error("Failed to compute co-founder compatibility"),
  });

  const opportunities = oppsQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const matches = matchesQuery.data ?? [];

  const handleLaunchSpinoff = (profileId: number) => {
    if (!selectedOppId) return;
    navigate(`/spinoff?oppId=${selectedOppId}&founderIds=${profileId}`);
  };

  const handleComputeCoFounder = () => {
    if (!coFounderA || !coFounderB) {
      toast.error("Select two founders to compare");
      return;
    }
    computeCoFounder.mutate({
      profileIdA: coFounderA,
      profileIdB: coFounderB,
      opportunityId: selectedOppId ?? undefined,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#51AF3715", color: "#51AF37" }}>
                Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Founder Matching Engine
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Automatically match onboarded founders to problem statements and product opportunities using multi-dimensional compatibility scoring.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            style={{ borderColor: "#3A97D3", color: "#3A97D3" }}
            onClick={() => navigate("/spinoff")}
          >
            <GitBranch size={13} /> Open Spin-Off OS
          </Button>
        </div>
      </div>

      <div className="p-8">
        <Tabs defaultValue="opportunity">
          <TabsList className="mb-6">
            <TabsTrigger value="opportunity" className="flex items-center gap-1.5">
              <Target size={13} /> By Opportunity
            </TabsTrigger>
            <TabsTrigger value="cofounder" className="flex items-center gap-1.5">
              <Users size={13} /> Co-Founder Compatibility
            </TabsTrigger>
          </TabsList>

          {/* ── By Opportunity tab ─────────────────────────────────────────── */}
          <TabsContent value="opportunity">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 max-w-sm">
                <Select
                  value={selectedOppId?.toString() ?? ""}
                  onValueChange={(v) => setSelectedOppId(Number(v))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a product opportunity…" />
                  </SelectTrigger>
                  <SelectContent>
                    {opportunities.map((o: { id: number; name: string; sector?: string | null }) => (
                      <SelectItem key={o.id} value={o.id.toString()}>
                        {o.name} {o.sector ? `— ${o.sector}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-9"
                disabled={!selectedOppId || computeAll.isPending}
                onClick={() => selectedOppId && computeAll.mutate({ productOpportunityId: selectedOppId })}
              >
                <RefreshCw size={12} className={computeAll.isPending ? "animate-spin" : ""} />
                {computeAll.isPending ? "Computing…" : "Recompute Scores"}
              </Button>
            </div>

            {!selectedOppId && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Shuffle size={40} className="text-gray-200 mb-4" />
                <p className="text-sm text-gray-400 font-medium">Select an opportunity above to see founder matches</p>
                <p className="text-xs text-gray-300 mt-1">Scores are computed across all {profiles.length} talent profiles</p>
              </div>
            )}

            {selectedOppId && matchesQuery.isLoading && (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={20} className="animate-spin text-gray-300" />
              </div>
            )}

            {selectedOppId && !matchesQuery.isLoading && matches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle size={32} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 font-medium">No match scores yet</p>
                <p className="text-xs text-gray-300 mt-1 mb-4">Click "Recompute Scores" to run the matching engine</p>
                <Button
                  size="sm"
                  onClick={() => selectedOppId && computeAll.mutate({ productOpportunityId: selectedOppId })}
                  disabled={computeAll.isPending}
                  style={{ background: "#51AF37", color: "white" }}
                >
                  <Zap size={13} className="mr-1.5" />
                  {computeAll.isPending ? "Computing…" : "Run Matching Engine"}
                </Button>
              </div>
            )}

            {matches.length > 0 && (
              <>
                {/* Summary bar */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Total Profiles", value: matches.length, icon: Users, color: "#1a2332" },
                    { label: "Strong Matches (≥75)", value: matches.filter((m: { overallMatchScore: number | null }) => (m.overallMatchScore ?? 0) >= 75).length, icon: Star, color: "#51AF37" },
                    { label: "Moderate Matches (≥50)", value: matches.filter((m: { overallMatchScore: number | null }) => (m.overallMatchScore ?? 0) >= 50 && (m.overallMatchScore ?? 0) < 75).length, icon: CheckCircle2, color: "#F49C13" },
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

                {/* Match cards */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {matches.map((raw: {
                    id: number;
                    founderName: string;
                    founderRole: string;
                    availability: string;
                    overallMatchScore: number | null;
                    sectorAlignmentScore: number | null;
                    capabilityFitScore: number | null;
                    availabilityScore: number | null;
                    pvfScore: number | null;
                    experienceScore: number | null;
                    networkScore: number | null;
                    recommendedRole: string | null;
                    status: string | null;
                    talentProfileId: number;
                  }) => {
                    const m = {
                      ...raw,
                      overallMatchScore: raw.overallMatchScore ?? 0,
                      sectorAlignmentScore: raw.sectorAlignmentScore ?? 0,
                      capabilityFitScore: raw.capabilityFitScore ?? 0,
                      availabilityScore: raw.availabilityScore ?? 0,
                      pvfScore: raw.pvfScore ?? 0,
                      experienceScore: raw.experienceScore ?? 0,
                      networkScore: raw.networkScore ?? 0,
                      status: raw.status ?? "Suggested",
                    };
                    return (
                      <MatchCard key={m.id} match={m} onLaunchSpinoff={handleLaunchSpinoff} />
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Co-Founder Compatibility tab ───────────────────────────────── */}
          <TabsContent value="cofounder">
            <div className="max-w-2xl">
              <p className="text-sm text-gray-500 mb-5">
                Select two talent profiles to compute their co-founder compatibility score. The algorithm measures capability complementarity, value alignment, working style, and network diversity.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Founder A</label>
                  <Select value={coFounderA?.toString() ?? ""} onValueChange={(v) => setCoFounderA(Number(v))}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select founder…" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p: { id: number; name: string; currentRole?: string | null }) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name} {p.currentRole ? `— ${p.currentRole}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Founder B</label>
                  <Select value={coFounderB?.toString() ?? ""} onValueChange={(v) => setCoFounderB(Number(v))}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select founder…" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p: { id: number; name: string; currentRole?: string | null }) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name} {p.currentRole ? `— ${p.currentRole}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                size="sm"
                className="gap-1.5 text-xs mb-6"
                style={{ background: "#51AF37", color: "white" }}
                onClick={handleComputeCoFounder}
                disabled={computeCoFounder.isPending || !coFounderA || !coFounderB}
              >
                <Shuffle size={12} className={computeCoFounder.isPending ? "animate-spin" : ""} />
                {computeCoFounder.isPending ? "Computing…" : "Compute Compatibility"}
              </Button>

              {coFounderResult && (
                <CoFounderCard result={coFounderResult} />
              )}

              {!coFounderResult && (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl" style={{ borderColor: "#e5e7eb" }}>
                  <Users size={32} className="text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">Select two founders and click Compute Compatibility</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
