// ============================================================
// PEOPLE INTELLIGENCE MODULE
// Design: Precision Industrial — tabbed dashboard with 6 panels
// PVF Formula: (skillsMatch + industryMatch + stageMatch + networkValue + availabilityFit) / 5
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Users, UserCheck, AlertTriangle, TrendingUp, Plus, Trash2,
  ChevronDown, ChevronUp, Star, Zap, Network, Clock, BarChart3,
  RefreshCw, Target, Briefcase
} from "lucide-react";
import { ventures as VENTURES } from "@/lib/data";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";


// ── Colour helpers ────────────────────────────────────────────────────────────
const PVF_COLORS: Record<string, string> = {
  "Highly Recommended": "#51AF37",
  "Recommended": "#3A97D3",
  "Possible": "#F49C13",
  "Not Recommended": "#ef4444",
};
const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#ef4444", High: "#F49C13", Medium: "#3A97D3", Low: "#6b7280",
};
const AVAILABILITY_COLORS: Record<string, string> = {
  "Immediately Available": "#51AF37",
  "Available in 1 Month": "#3A97D3",
  "Available in 3 Months": "#F49C13",
  "Part-Time Only": "#8b5cf6",
  "Advisory Only": "#6b7280",
  "Not Available": "#ef4444",
};

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ value, max = 10, color = "#3A97D3" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${(value / max) * 100}%`, background: color }}
      />
    </div>
  );
}

// ── Radar-style capability summary ───────────────────────────────────────────
function CapabilityGrid({ profile }: { profile: any }) {
  const caps = [
    { label: "Technical",    value: profile.capTechnical ?? 0,    color: "#3A97D3" },
    { label: "Commercial",   value: profile.capCommercial ?? 0,   color: "#51AF37" },
    { label: "Operational",  value: profile.capOperational ?? 0,  color: "#F49C13" },
    { label: "Financial",    value: profile.capFinancial ?? 0,    color: "#8b5cf6" },
    { label: "Marketing",    value: profile.capMarketing ?? 0,    color: "#ec4899" },
    { label: "Leadership",   value: profile.attrLeadership ?? 0,  color: "#ef4444" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {caps.map(c => (
        <div key={c.label}>
          <div className="flex justify-between text-xs text-gray-500 mb-0.5">
            <span>{c.label}</span>
            <span className="font-mono">{c.value}/10</span>
          </div>
          <ScoreBar value={c.value} color={c.color} />
        </div>
      ))}
    </div>
  );
}

// ── Talent Card ───────────────────────────────────────────────────────────────
function TalentCard({ profile, onDelete, onComputePVF, ventureId }: {
  profile: any;
  onDelete: () => void;
  onComputePVF: (talentId: number) => void;
  ventureId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-xl border p-4 hover:shadow-md transition-all" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{profile.name}</span>
            {profile.profileType && (
              <Badge variant="outline" className="text-xs" style={{ borderColor: "#3A97D3", color: "#3A97D3" }}>
                {profile.profileType}
              </Badge>
            )}
            {profile.availability && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${AVAILABILITY_COLORS[profile.availability]}15`, color: AVAILABILITY_COLORS[profile.availability] }}
              >
                {profile.availability}
              </span>
            )}
          </div>
          {profile.currentRole && <p className="text-xs text-gray-500">{profile.currentRole}</p>}
          {profile.industryExpertise && <p className="text-xs text-gray-400 mt-0.5">{profile.industryExpertise}</p>}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1 h-7"
            style={{ borderColor: "#51AF37", color: "#51AF37" }}
            onClick={() => onComputePVF(profile.id)}
          >
            <Zap size={11} /> Score PVF
          </Button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
          <div className="grid grid-cols-3 gap-3 text-xs text-gray-500 mb-3">
            <div><span className="font-semibold text-gray-700">Experience</span><br />{profile.yearsExperience ?? "—"} yrs</div>
            <div><span className="font-semibold text-gray-700">Ventures</span><br />{profile.previousVentures ?? 0} ({profile.previousExits ?? 0} exits)</div>
            <div><span className="font-semibold text-gray-700">Hours/wk</span><br />{profile.availabilityHoursPerWeek ?? "—"}</div>
          </div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Capability Scores</p>
          <CapabilityGrid profile={profile} />
          {profile.bio && <p className="text-xs text-gray-500 mt-3 italic">"{profile.bio}"</p>}
        </div>
      )}
    </div>
  );
}

// ── Add Talent Form ───────────────────────────────────────────────────────────
function AddTalentForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", currentRole: "", industryExpertise: "",
    profileType: "Founder" as any, availability: "Immediately Available" as any,
    yearsExperience: 0, availabilityHoursPerWeek: 40,
    capTechnical: 5, capCommercial: 5, capOperational: 5, capFinancial: 5,
    capMarketing: 5, attrLeadership: 5, attrExecution: 5,
    networkInvestors: 5, networkCustomers: 5, networkIndustry: 5,
    stageIdea: 5, stageValidation: 5, stageBuild: 5, stageScale: 5,
    bio: "",
  });

  const upsert = trpc.people.upsertTalent.useMutation({
    onSuccess: () => { toast.success("Talent profile saved"); onSuccess(); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  if (!open) {
    return (
      <Button size="sm" className="gap-1.5" style={{ background: "#51AF37" }} onClick={() => setOpen(true)}>
        <Plus size={13} /> Add Talent
      </Button>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>New Talent Profile</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <Label className="text-xs">Full Name *</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" className="h-8 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs">Email</Label>
          <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" className="h-8 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs">Current Role</Label>
          <Input value={form.currentRole} onChange={e => setForm(f => ({ ...f, currentRole: e.target.value }))} placeholder="CTO at Acme" className="h-8 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs">Industry Expertise</Label>
          <Input value={form.industryExpertise} onChange={e => setForm(f => ({ ...f, industryExpertise: e.target.value }))} placeholder="CleanTech, Bio-materials" className="h-8 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs">Profile Type</Label>
          <Select value={form.profileType} onValueChange={v => setForm(f => ({ ...f, profileType: v as any }))}>
            <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Founder","Operator","Executive","Technical Expert","Advisor","Mentor","Supplier","Partner","Investor"].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Availability</Label>
          <Select value={form.availability} onValueChange={v => setForm(f => ({ ...f, availability: v as any }))}>
            <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Immediately Available","Available in 1 Month","Available in 3 Months","Part-Time Only","Advisory Only","Not Available"].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 mb-3">Capability Scores (0–10)</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
        {[
          { key: "capTechnical", label: "Technical" },
          { key: "capCommercial", label: "Commercial" },
          { key: "capOperational", label: "Operational" },
          { key: "capFinancial", label: "Financial" },
          { key: "capMarketing", label: "Marketing" },
          { key: "attrLeadership", label: "Leadership" },
          { key: "attrExecution", label: "Execution" },
          { key: "networkInvestors", label: "Investor Network" },
          { key: "networkCustomers", label: "Customer Network" },
          { key: "networkIndustry", label: "Industry Network" },
        ].map(({ key, label }) => (
          <div key={key}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{label}</span>
              <span className="font-mono">{(form as any)[key]}/10</span>
            </div>
            <Slider
              value={[(form as any)[key]]}
              min={0} max={10} step={1}
              onValueChange={([v]) => setForm(f => ({ ...f, [key]: v }))}
            />
          </div>
        ))}
      </div>

      <div className="mb-4">
        <Label className="text-xs">Bio / Notes</Label>
        <textarea
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          className="w-full mt-1 text-sm border rounded-lg p-2 h-16 resize-none"
          style={{ borderColor: "#e5e7eb" }}
          placeholder="Brief background and key strengths..."
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" style={{ background: "#51AF37" }} onClick={() => upsert.mutate(form as any)} disabled={!form.name || upsert.isPending}>
          {upsert.isPending ? "Saving..." : "Save Profile"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Gap Severity Badge ────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${SEVERITY_COLORS[severity]}15`, color: SEVERITY_COLORS[severity] }}
    >
      {severity}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "talent",     label: "Talent Pool",       icon: Users },
  { id: "pvf",        label: "PVF Rankings",       icon: Star },
  { id: "team",       label: "Team Composition",   icon: Briefcase },
  { id: "gaps",       label: "Gap Analysis",       icon: AlertTriangle },
  { id: "suitability",label: "Founder Suitability",icon: UserCheck },
];

export default function PeopleIntelligence() {
  const [activeTab, setActiveTab] = useState("talent");
  const [selectedVenture, setSelectedVenture] = useState(VENTURES[0]?.id ?? "ecoblend");

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: talent = [], refetch: refetchTalent } = trpc.people.listTalent.useQuery();
  const { data: pvfRankings = [], refetch: refetchPVF } = trpc.people.getPVFRankings.useQuery({ ventureId: selectedVenture });
  const { data: teamComposition = [], refetch: refetchTeam } = trpc.people.getTeamComposition.useQuery({ ventureId: selectedVenture });
  const { data: teamGaps = [], refetch: refetchGaps } = trpc.people.getTeamGaps.useQuery({ ventureId: selectedVenture });
  const { data: founderSuitability = [], refetch: refetchSuitability } = trpc.people.getFounderSuitability.useQuery({ ventureId: selectedVenture });
  const { data: poolSummary } = trpc.people.getTalentPoolSummary.useQuery();
  const { data: roleRequirements = [] } = trpc.people.listRoleRequirements.useQuery({ ventureId: selectedVenture });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const deleteTalent = trpc.people.deleteTalent.useMutation({
    onSuccess: () => { toast.success("Profile removed"); refetchTalent(); },
  });

  const computePVF = trpc.people.computePVF.useMutation({
    onSuccess: (data) => {
      toast.success(`PVF Score: ${data.pvfScore}/10 — ${data.recommendation}`);
      refetchPVF();
    },
    onError: (e) => toast.error(e.message),
  });

  const computeGaps = trpc.people.computeTeamGaps.useMutation({
    onSuccess: (data) => {
      toast.success(`Gap analysis complete — ${data.gaps.length} gaps identified`);
      refetchGaps();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeTeamMember = trpc.people.removeTeamMember.useMutation({
    onSuccess: () => { toast.success("Team member removed"); refetchTeam(); },
  });

  const addToTeam = trpc.people.upsertTeamMember.useMutation({
    onSuccess: () => { toast.success("Added to team"); refetchTeam(); },
    onError: (e) => toast.error(e.message),
  });

  const venture = VENTURES.find(v => v.id === selectedVenture);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-5" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#51AF3715", color: "#51AF37" }}>
                People Intelligence
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">PVF Scoring Engine</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              People Intelligence Module
            </h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Talent profiling, People-Venture Fit scoring, and team gap analysis across the portfolio.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedVenture} onValueChange={setSelectedVenture}>
              <SelectTrigger className="w-44 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
              {VENTURES.map((v: any) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          {[
            { label: "Talent Pool", value: poolSummary?.totalTalent ?? 0, sub: "profiles", color: "#3A97D3", icon: Users },
            { label: "Assigned", value: poolSummary?.assignedToVentures ?? 0, sub: "to ventures", color: "#51AF37", icon: UserCheck },
            { label: "Critical Gaps", value: poolSummary?.criticalGaps ?? 0, sub: "portfolio-wide", color: "#ef4444", icon: AlertTriangle },
            { label: "PVF Rankings", value: pvfRankings.length, sub: `for ${venture?.name ?? "venture"}`, color: "#F49C13", icon: Star },
          ].map(({ label, value, sub, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color }} />
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
              </div>
              <span className="text-3xl font-bold" style={{ color, fontFamily: "'Prompt', sans-serif" }}>{value}</span>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-8" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-8">

        {/* ── TALENT POOL TAB ─────────────────────────────────────────────────── */}
        {activeTab === "talent" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Talent Pool — {talent.length} profiles
              </h2>
              <AddTalentForm onSuccess={refetchTalent} />
            </div>
            {talent.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
                <Users size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No talent profiles yet</p>
                <p className="text-xs text-gray-400 mt-1">Add your first profile to start building the talent pool.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {talent.map((profile: any) => (
                  <TalentCard
                    key={profile.id}
                    profile={profile}
                    ventureId={selectedVenture}
                    onDelete={() => deleteTalent.mutate({ id: profile.id })}
                    onComputePVF={(id) => computePVF.mutate({ talentProfileId: id, ventureId: selectedVenture })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PVF RANKINGS TAB ────────────────────────────────────────────────── */}
        {activeTab === "pvf" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  People-Venture Fit Rankings — {venture?.name}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  PVF = (Skills Match + Industry Match + Stage Match + Network Value + Availability Fit) ÷ 5
                </p>
              </div>
              <Button
                size="sm" variant="outline" className="gap-1.5 text-xs"
                onClick={() => {
                  talent.forEach((p: any) => computePVF.mutate({ talentProfileId: p.id, ventureId: selectedVenture }));
                }}
                disabled={computePVF.isPending || talent.length === 0}
              >
                <RefreshCw size={12} /> Recompute All
              </Button>
            </div>

            {/* Formula card */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs font-semibold text-gray-500 mb-3">PVF Formula Breakdown</p>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: "Skills Match", desc: "Weighted avg of capability scores, boosted by role functional area", color: "#3A97D3" },
                  { label: "Industry Match", desc: "Years of experience normalised to 0–10 scale", color: "#51AF37" },
                  { label: "Stage Match", desc: "Average of Idea/Validation/Build/Scale stage scores", color: "#F49C13" },
                  { label: "Network Value", desc: "Average of investor, customer, supplier, regulator, industry networks", color: "#8b5cf6" },
                  { label: "Availability Fit", desc: "Immediately Available=10 → Not Available=0", color: "#ef4444" },
                ].map(f => (
                  <div key={f.label} className="rounded-lg p-3" style={{ background: `${f.color}08`, border: `1px solid ${f.color}20` }}>
                    <p className="text-xs font-bold mb-1" style={{ color: f.color }}>{f.label}</p>
                    <p className="text-xs text-gray-500">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {pvfRankings.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
                <Star size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No PVF scores yet for {venture?.name}</p>
                <p className="text-xs text-gray-400 mt-1">Add talent profiles and click "Score PVF" on each card to generate rankings.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pvfRankings.map((row: any, idx: number) => {
                  const { fit, profile } = row;
                  const rec = fit.recommendation ?? "Possible";
                  return (
                    <div key={fit.id} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${PVF_COLORS[rec]}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-gray-300 font-mono w-8">#{idx + 1}</span>
                          <div>
                            <p className="font-bold text-gray-900">{profile.name}</p>
                            <p className="text-xs text-gray-500">{profile.currentRole} · {profile.profileType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ color: PVF_COLORS[rec], fontFamily: "'Prompt', sans-serif" }}>
                              {fit.pvfScore}/10
                            </p>
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${PVF_COLORS[rec]}15`, color: PVF_COLORS[rec] }}
                            >
                              {rec}
                            </span>
                          </div>
                          <Button
                            size="sm" variant="outline" className="text-xs gap-1 h-7"
                            style={{ borderColor: "#51AF37", color: "#51AF37" }}
                            onClick={() => addToTeam.mutate({
                              ventureId: selectedVenture,
                              talentProfileId: profile.id,
                              assignedRole: profile.currentRole ?? profile.profileType ?? "Team Member",
                              pvfScore: fit.pvfScore,
                              assignmentType: "Recommended",
                            })}
                          >
                            <Plus size={11} /> Add to Team
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { label: "Skills", value: fit.skillsMatch, color: "#3A97D3" },
                          { label: "Industry", value: fit.industryMatch, color: "#51AF37" },
                          { label: "Stage", value: fit.stageMatch, color: "#F49C13" },
                          { label: "Network", value: fit.networkValue, color: "#8b5cf6" },
                          { label: "Availability", value: fit.availabilityFit, color: "#ef4444" },
                        ].map(d => (
                          <div key={d.label}>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{d.label}</span>
                              <span className="font-mono">{d.value?.toFixed(1)}</span>
                            </div>
                            <ScoreBar value={d.value ?? 0} color={d.color} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TEAM COMPOSITION TAB ────────────────────────────────────────────── */}
        {activeTab === "team" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Team Composition — {venture?.name}
              </h2>
              <span className="text-xs text-gray-400 font-mono">{teamComposition.length} members</span>
            </div>

            {teamComposition.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
                <Briefcase size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No team members assigned yet</p>
                <p className="text-xs text-gray-400 mt-1">Score PVF rankings and click "Add to Team" to build the team composition.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {teamComposition.map((row: any) => {
                  const { composition, profile } = row;
                  return (
                    <div key={composition.id} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{profile.name}</p>
                          <p className="text-xs text-gray-500">{composition.assignedRole}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {composition.assignmentType && (
                              <Badge variant="outline" className="text-xs" style={{ borderColor: "#3A97D3", color: "#3A97D3" }}>
                                {composition.assignmentType}
                              </Badge>
                            )}
                            {composition.engagementType && (
                              <Badge variant="outline" className="text-xs">
                                {composition.engagementType}
                              </Badge>
                            )}
                            {composition.isFounder && (
                              <Badge className="text-xs" style={{ background: "#51AF3720", color: "#51AF37", border: "1px solid #51AF3740" }}>
                                Founder
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {composition.pvfScore !== null && (
                            <div className="text-right">
                              <p className="text-lg font-bold" style={{ color: PVF_COLORS["Recommended"], fontFamily: "'Prompt', sans-serif" }}>
                                {composition.pvfScore}/10
                              </p>
                              <p className="text-xs text-gray-400">PVF</p>
                            </div>
                          )}
                          <button
                            onClick={() => removeTeamMember.mutate({ id: composition.id })}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <CapabilityGrid profile={profile} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── GAP ANALYSIS TAB ────────────────────────────────────────────────── */}
        {activeTab === "gaps" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  Team Gap Analysis — {venture?.name}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Identifies capability gaps by comparing team average scores against the 6/10 threshold.
                </p>
              </div>
              <Button
                size="sm" variant="outline" className="gap-1.5 text-xs"
                style={{ borderColor: "#3A97D3", color: "#3A97D3" }}
                onClick={() => computeGaps.mutate({ ventureId: selectedVenture })}
                disabled={computeGaps.isPending}
              >
                <RefreshCw size={12} className={computeGaps.isPending ? "animate-spin" : ""} />
                {computeGaps.isPending ? "Analysing..." : "Run Gap Analysis"}
              </Button>
            </div>

            {teamGaps.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
                <Target size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No gap analysis run yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Assign team members first, then click "Run Gap Analysis" to identify capability gaps.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamGaps.map((gap: any) => (
                  <div key={gap.id} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${SEVERITY_COLORS[gap.severity]}` }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900">{gap.gapArea}</p>
                          <SeverityBadge severity={gap.severity} />
                        </div>
                        <p className="text-xs text-gray-500">{gap.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: SEVERITY_COLORS[gap.severity], fontFamily: "'Prompt', sans-serif" }}>
                          −{gap.gapScore?.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-400">gap score</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Current</span>
                          <span className="font-mono">{gap.currentScore?.toFixed(1)}/10</span>
                        </div>
                        <ScoreBar value={gap.currentScore ?? 0} color={SEVERITY_COLORS[gap.severity]} />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Required</span>
                          <span className="font-mono">{gap.requiredScore}/10</span>
                        </div>
                        <ScoreBar value={gap.requiredScore ?? 0} color="#6b7280" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FOUNDER SUITABILITY TAB ──────────────────────────────────────────── */}
        {activeTab === "suitability" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  Founder Suitability — {venture?.name}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  7-dimension assessment: Domain Knowledge · Execution · Leadership · Network · Stage Readiness · Risk Profile · Commitment
                </p>
              </div>
            </div>

            <FounderSuitabilityPanel
              ventureId={selectedVenture}
              talent={talent}
              assessments={founderSuitability}
              onRefresh={refetchSuitability}
            />
          </div>
        )}

      </div>
    </div>
  );
}

// ── Founder Suitability Panel ─────────────────────────────────────────────────
function FounderSuitabilityPanel({ ventureId, talent, assessments, onRefresh }: {
  ventureId: string;
  talent: any[];
  assessments: any[];
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    talentProfileId: 0,
    domainKnowledge: 5, executionCapability: 5, leadershipStrength: 5,
    networkRelevance: 5, stageReadiness: 5, riskProfile: 5, commitmentLevel: 5,
    readinessToExecute: "Ready Now" as any, assessmentNotes: "",
  });

  const upsert = trpc.people.upsertFounderSuitability.useMutation({
    onSuccess: (data) => {
      toast.success(`Suitability: ${data.overallScore}/10 — ${data.recommendation}`);
      onRefresh();
      setShowForm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const dimensions = [
    { key: "domainKnowledge",    label: "Domain Knowledge",    color: "#3A97D3" },
    { key: "executionCapability",label: "Execution Capability",color: "#51AF37" },
    { key: "leadershipStrength", label: "Leadership Strength", color: "#F49C13" },
    { key: "networkRelevance",   label: "Network Relevance",   color: "#8b5cf6" },
    { key: "stageReadiness",     label: "Stage Readiness",     color: "#ec4899" },
    { key: "riskProfile",        label: "Risk Profile",        color: "#ef4444" },
    { key: "commitmentLevel",    label: "Commitment Level",    color: "#14b8a6" },
  ];

  return (
    <div className="space-y-4">
      {assessments.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
          <UserCheck size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No founder assessments yet</p>
          <p className="text-xs text-gray-400 mt-1">Run a suitability assessment for each founder candidate.</p>
          <Button size="sm" className="mt-4 gap-1.5" style={{ background: "#51AF37" }} onClick={() => setShowForm(true)}>
            <Plus size={13} /> New Assessment
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" style={{ background: "#51AF37" }} onClick={() => setShowForm(s => !s)}>
              <Plus size={13} /> New Assessment
            </Button>
          </div>

          {assessments.map((row: any) => {
            const { assessment, profile } = row;
            const SUIT_COLORS: Record<string, string> = {
              "Highly Suitable": "#51AF37", "Suitable": "#3A97D3",
              "Conditionally Suitable": "#F49C13", "Not Suitable": "#ef4444",
            };
            const rec = assessment.recommendation ?? "Conditionally Suitable";
            return (
              <div key={assessment.id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${SUIT_COLORS[rec]}` }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900">{profile.name}</p>
                    <p className="text-xs text-gray-500">{profile.currentRole}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${SUIT_COLORS[rec]}15`, color: SUIT_COLORS[rec] }}>
                        {rec}
                      </span>
                      {assessment.readinessToExecute && (
                        <Badge variant="outline" className="text-xs">{assessment.readinessToExecute}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold" style={{ color: SUIT_COLORS[rec], fontFamily: "'Prompt', sans-serif" }}>
                      {assessment.overallScore}/10
                    </p>
                    <p className="text-xs text-gray-400">Overall Score</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {dimensions.map(d => (
                    <div key={d.key}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{d.label}</span>
                        <span className="font-mono">{assessment[d.key]}/10</span>
                      </div>
                      <ScoreBar value={assessment[d.key] ?? 0} color={d.color} />
                    </div>
                  ))}
                </div>
                {assessment.assessmentNotes && (
                  <p className="text-xs text-gray-500 mt-3 italic">"{assessment.assessmentNotes}"</p>
                )}
              </div>
            );
          })}
        </>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>New Founder Suitability Assessment</h3>
          <div className="mb-4">
            <Label className="text-xs">Select Talent Profile *</Label>
            <Select value={String(form.talentProfileId)} onValueChange={v => setForm(f => ({ ...f, talentProfileId: parseInt(v) }))}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select a talent profile..." /></SelectTrigger>
              <SelectContent>
                {(talent as any[]).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
            {dimensions.map(d => (
              <div key={d.key}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{d.label}</span>
                  <span className="font-mono">{(form as any)[d.key]}/10</span>
                </div>
                <Slider
                  value={[(form as any)[d.key]]}
                  min={0} max={10} step={1}
                  onValueChange={([v]) => setForm(f => ({ ...f, [d.key]: v }))}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label className="text-xs">Readiness to Execute</Label>
              <Select value={form.readinessToExecute} onValueChange={v => setForm(f => ({ ...f, readinessToExecute: v as any }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Ready Now","Ready in 3 Months","Ready in 6 Months","Not Ready"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-4">
            <Label className="text-xs">Assessment Notes</Label>
            <textarea
              value={form.assessmentNotes}
              onChange={e => setForm(f => ({ ...f, assessmentNotes: e.target.value }))}
              className="w-full mt-1 text-sm border rounded-lg p-2 h-16 resize-none"
              style={{ borderColor: "#e5e7eb" }}
              placeholder="Key observations about this founder candidate..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm" style={{ background: "#51AF37" }}
              onClick={() => upsert.mutate({ ...form, ventureId })}
              disabled={!form.talentProfileId || upsert.isPending}
            >
              {upsert.isPending ? "Saving..." : "Save Assessment"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
